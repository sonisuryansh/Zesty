const mongoose = require('mongoose')



function connectDB() {
    return mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("MongoDB is Connected");
        })
        .catch((err) => {
            console.log("MongoDB connection Error ", err);
        });
}

module.exports = connectDB;
