require('dotenv').config();
const ImageKit = require('@imagekit/nodejs').default;
const { toFile } = require('@imagekit/nodejs');

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_test_key_zesty'
});

async function uploadFile(file) {
    if (!file?.buffer) {
        throw new Error('A file is required for upload');
    }

    return imagekit.files.upload({
        file: await toFile(file.buffer, file.originalname, { type: file.mimetype }),
        fileName: `${Date.now()}-${file.originalname}`,
        folder: '/food-videos'
    });
}

module.exports = { uploadFile };
