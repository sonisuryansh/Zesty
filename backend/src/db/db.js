const mongoose = require('mongoose');

function connectDB() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/zesty';
    const isCloudAtlas = uri.includes('mongodb.net');

    return mongoose.connect(uri)
        .then(() => {
            const host = mongoose.connection.host;
            const dbName = mongoose.connection.name;
            const targetType = isCloudAtlas ? "☁️ Cloud MongoDB Atlas Cluster" : "🖥️ Local Standalone MongoDB (localhost:27017)";
            console.log(`==================================================`);
            console.log(`✅ MongoDB Connection Established Successfully`);
            console.log(`   Target Type : ${targetType}`);
            console.log(`   Host        : ${host}:${mongoose.connection.port || 27017}`);
            console.log(`   Database    : ${dbName}`);
            console.log(`   Ready State : ${mongoose.connection.readyState} (1 = Connected)`);
            console.log(`==================================================`);
        })
        .catch((err) => {
            console.error("❌ MongoDB Connection Error:", err.message);
        });
}

module.exports = connectDB;
