require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ImageKit = require('@imagekit/nodejs').default;
const { toFile } = require('@imagekit/nodejs');

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_test_key_zesty'
});

async function uploadFile(file) {
    if (!file?.buffer) {
        throw new Error('A file is required for upload');
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const isRealImageKit = privateKey && !privateKey.includes('mock') && !privateKey.includes('test');

    if (isRealImageKit) {
        try {
            const result = await imagekit.files.upload({
                file: await toFile(file.buffer, file.originalname, { type: file.mimetype }),
                fileName: `${Date.now()}-${file.originalname}`,
                folder: '/food-videos'
            });
            return result;
        } catch (err) {
            console.warn("⚠️ ImageKit Cloud API failed, falling back to local file storage:", err.message);
        }
    }

    // Save intact file to local public/uploads folder
    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanOriginalName = (file.originalname || 'media.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${cleanOriginalName}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return {
        url: `/uploads/${fileName}`,
        fileId: `local_${fileName}`
    };
}

module.exports = { uploadFile };
