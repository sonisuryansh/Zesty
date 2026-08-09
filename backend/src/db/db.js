const mongoose = require('mongoose');
const dns = require('dns');

function connectDB() {
    const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!rawUri || typeof rawUri !== 'string' || !rawUri.trim()) {
        const errorMsg = "MONGODB_URI environment variable is missing in .env file";
        console.error("❌ MongoDB connection failed:", errorMsg);
        throw new Error(errorMsg);
    }

    const uri = rawUri.trim();
    const isCloudAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');

    if (isCloudAtlas) {
        try {
            dns.setServers(['8.8.8.8', '1.1.1.1']);
        } catch (e) {
            // DNS fallback ignore if restricted
        }
    }

    return mongoose.connect(uri)
        .then(() => {
            console.log("✅ MongoDB connected");
        })
        .catch((err) => {
            console.error("❌ MongoDB connection failed:", err.message);
            throw err;
        });
}

module.exports = connectDB;
