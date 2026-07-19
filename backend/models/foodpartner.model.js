const mongoose = require('mongoose')
const foodPartenerSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true,
        unique: true
    },
    password:{
        type:String,
        required:true
    }
})

const foodPartnerModel = mongoose.model("foodpartner", foodPartenerSchema)

module.exports = foodPartnerModel;