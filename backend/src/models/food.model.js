const mongoose = require('mongoose');
const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['video', 'image'],
        default: 'video'
    },
    video: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    description: {
        type: String
    },
    category: {
        type: String,
        default: 'Trending'
    },
    price: {
        type: Number,
        default: 299,
        required: true
    },
    packagingCharge: {
        type: Number,
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    videoFileId: {
        type: String,
        default: ''
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "foodpartner",
        required: true
    }
}, {
    timestamps: true
})

const foodModel = mongoose.model("food",foodSchema);
module.exports = foodModel;
