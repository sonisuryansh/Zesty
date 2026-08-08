const { body, param, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation Error",
            errors: errors.array().map(e => e.msg)
        });
    }
    next();
}

const passwordValidation = body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[\W_]/).withMessage('Password must contain at least one special character');

const emailValidation = body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail();

const phoneValidation = body('phone')
    .matches(/^[0-9+]{10,15}$/).withMessage('Please provide a valid phone number (10-15 digits)');

const mongoIdParamValidation = (paramName) => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    passwordValidation,
    emailValidation,
    phoneValidation,
    mongoIdParamValidation,
    
    registerValidation: [
        body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        emailValidation,
        passwordValidation,
        handleValidationErrors
    ],
    loginValidation: [
        emailValidation,
        body('password').notEmpty().withMessage('Password is required'),
        handleValidationErrors
    ],
    otpSendValidation: [
        phoneValidation,
        handleValidationErrors
    ]
};
