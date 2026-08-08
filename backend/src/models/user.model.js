const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String
        },
        phone: {
            type: String,
            sparse: true
        },
        googleId: {
            type: String,
            sparse: true
        },
        avatar: {
            type: String
        },
        profilePicture: {
            type: String,
            default: ''
        },
        username: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true
        },
        displayName: {
            type: String
        },
        bio: {
            type: String,
            default: ''
        },
        location: {
            type: String,
            default: ''
        },
        website: {
            type: String,
            default: ''
        },
        isPrivate: {
            type: Boolean,
            default: false
        },
        followers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }],
        following: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }],
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        failedLoginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date
        },
        knownDevices: [{
            ip: String,
            userAgent: String,
            lastUsed: Date
        }]
    },
    {
        timestamps: true
    }
);

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;