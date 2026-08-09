const addressModel = require('../models/address.model');

// Get User Saved Addresses
async function getAddresses(req, res) {
    try {
        const addresses = await addressModel.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        res.status(200).json({ addresses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Add New Saved Address
async function addAddress(req, res) {
    try {
        const { label, fullName, phone, houseNumber, street, area, landmark, city, state, pincode, latitude, longitude, deliveryInstructions, isDefault } = req.body;

        if (isDefault) {
            await addressModel.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const address = await addressModel.create({
            user: req.user._id,
            label,
            fullName,
            phone,
            houseNumber,
            street,
            area,
            landmark,
            city,
            state,
            pincode,
            latitude,
            longitude,
            deliveryInstructions,
            isDefault: isDefault || false
        });

        res.status(201).json({ message: "Address added successfully", address });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Update Address
async function updateAddress(req, res) {
    try {
        const { addressId } = req.params;
        if (req.body.isDefault) {
            await addressModel.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const address = await addressModel.findOneAndUpdate(
            { _id: addressId, user: req.user._id },
            req.body,
            { returnDocument: 'after' }
        );

        if (!address) return res.status(404).json({ message: "Address not found" });

        res.status(200).json({ message: "Address updated", address });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Delete Address
async function deleteAddress(req, res) {
    try {
        const { addressId } = req.params;
        await addressModel.findOneAndDelete({ _id: addressId, user: req.user._id });
        res.status(200).json({ message: "Address deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress
};
