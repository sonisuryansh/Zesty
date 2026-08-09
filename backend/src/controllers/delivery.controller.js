const deliveryPartnerModel = require('../models/deliverypartner.model');
const orderModel = require('../models/order.model');
const foodPartnerModel = require('../models/foodpartner.model');

// Geographic Haversine Distance Formula in Kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5; // default fallback km
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

// Nearest Available Delivery Partner Auto Assignment Algorithm
async function assignNearestDeliveryPartner(order) {
    try {
        const availableRiders = await deliveryPartnerModel.find({
            dutyStatus: 'online',
            approvalStatus: 'approved'
        });

        if (!availableRiders || availableRiders.length === 0) return null;

        const foodPartner = await foodPartnerModel.findById(order.foodPartner);
        const restLat = foodPartner?.location?.latitude || 28.6139;
        const restLng = foodPartner?.location?.longitude || 77.2090;

        let nearestRider = null;
        let minDistance = Infinity;

        for (const rider of availableRiders) {
            const dist = calculateHaversineDistance(
                rider.currentLocation?.latitude || 28.6139,
                rider.currentLocation?.longitude || 77.2090,
                restLat,
                restLng
            );
            if (dist < minDistance) {
                minDistance = dist;
                nearestRider = rider;
            }
        }

        if (nearestRider) {
            order.deliveryPartner = nearestRider._id;
            order.status = 'Assigned Rider';
            order.timeline.push({ status: 'Assigned Rider', timestamp: new Date() });
            await order.save();

            nearestRider.dutyStatus = 'busy';
            await nearestRider.save();

            return nearestRider;
        }
    } catch (err) {
        console.error("❌ Delivery assignment error:", err.message);
    }
    return null;
}

// Toggle Duty Status (Online / Offline)
async function toggleDutyStatus(req, res) {
    try {
        const { dutyStatus } = req.body; // 'online' or 'offline'
        const partner = await deliveryPartnerModel.findByIdAndUpdate(
            req.deliveryPartner._id,
            { dutyStatus },
            { returnDocument: 'after' }
        ).select('-password');

        res.status(200).json({ message: `Status updated to ${dutyStatus}`, partner });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Update GPS Location
async function updateLocation(req, res) {
    try {
        const { latitude, longitude, addressText } = req.body;
        const partner = await deliveryPartnerModel.findByIdAndUpdate(
            req.deliveryPartner._id,
            {
                currentLocation: {
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    addressText: addressText || 'Active Location',
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        ).select('-password');

        res.status(200).json({ message: "Location updated successfully", partner });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Available / Assigned Orders with Distance Calculations
async function getAssignedOrders(req, res) {
    try {
        const activeOrders = await orderModel.find({
            $or: [
                { deliveryPartner: req.deliveryPartner._id, status: { $in: ['Assigned Rider', 'Picked Up', 'Out for Delivery'] } },
                { status: 'Ready', deliveryPartner: null }
            ]
        })
        .populate('foodPartner', 'name email location verificationDetails')
        .populate('customer', 'fullName email phone')
        .sort({ createdAt: -1 });

        const riderLat = req.deliveryPartner.currentLocation?.latitude || 28.6139;
        const riderLng = req.deliveryPartner.currentLocation?.longitude || 77.2090;

        const formattedOrders = activeOrders.map(ord => {
            const restLat = ord.foodPartner?.location?.latitude || 28.6139;
            const restLng = ord.foodPartner?.location?.longitude || 77.2090;
            const custLat = ord.deliveryAddress?.latitude || 28.6200;
            const custLng = ord.deliveryAddress?.longitude || 77.2100;

            const distanceToRestaurant = calculateHaversineDistance(riderLat, riderLng, restLat, restLng);
            const distanceToCustomer = calculateHaversineDistance(restLat, restLng, custLat, custLng);

            const orderObj = ord.toObject();
            orderObj.distanceToRestaurant = distanceToRestaurant;
            orderObj.distanceToCustomer = distanceToCustomer;
            return orderObj;
        });

        res.status(200).json({ orders: formattedOrders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Accept Order
async function acceptOrder(req, res) {
    try {
        const { orderId } = req.params;
        const order = await orderModel.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.deliveryPartner = req.deliveryPartner._id;
        order.status = 'Assigned Rider';
        order.timeline.push({ status: 'Assigned Rider', timestamp: new Date() });
        await order.save();

        await deliveryPartnerModel.findByIdAndUpdate(req.deliveryPartner._id, { dutyStatus: 'busy' });

        res.status(200).json({ message: "Order accepted successfully", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

const OrderStateMachineService = require('../services/OrderStateMachineService');

// Update Order Progress (Picked Up, Out for Delivery, Delivered)
async function updateOrderProgress(req, res) {
    try {
        const { orderId } = req.params;
        const { status, otp } = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const normStatus = (status === 'Delivered' || status === 'DELIVERED') ? 'DELIVERED' : status;

        if (normStatus === 'DELIVERED') {
            if (otp && order.otp !== otp) {
                return res.status(400).json({ message: "Invalid Delivery OTP" });
            }
        }

        // Trigger State Machine Transition (handles earning release & ledger entries)
        const updatedOrder = await OrderStateMachineService.transition(order._id, normStatus);

        res.status(200).json({ message: `Order updated to ${status}`, order: updatedOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// Delivery Earnings & History
async function getEarningsAndHistory(req, res) {
    try {
        const partner = await deliveryPartnerModel.findById(req.deliveryPartner._id).select('earnings completedDeliveries rating');
        const history = await orderModel.find({
            deliveryPartner: req.deliveryPartner._id,
            status: 'Delivered'
        }).sort({ updatedAt: -1 });

        res.status(200).json({ stats: partner, history });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Delivery Earnings & History Analytics (5% Delivery Commission Ledger)
async function getDeliveryFinancials(req, res) {
    try {
        const riderId = req.deliveryPartner._id;
        const { month } = req.query; // YYYY-MM or default current month

        let startDate, endDate;
        if (month && /^\d{4}-\d{2}$/.test(month)) {
            const [year, m] = month.split('-').map(Number);
            startDate = new Date(year, m - 1, 1);
            endDate = new Date(year, m, 0, 23, 59, 59, 999);
        } else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const matchCriteria = {
            deliveryPartner: riderId,
            status: 'Delivered',
            createdAt: { $gte: startDate, $lte: endDate }
        };

        const summaryResult = await orderModel.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: null,
                    totalCompletedDeliveries: { $sum: 1 },
                    totalOrderValueHandled: { $sum: '$pricing.grandTotal' },
                    deliveryCommission: { $sum: { $ifNull: ['$financialBreakdown.deliveryPartnerCommission', { $multiply: ['$pricing.grandTotal', 0.05] }] } }
                }
            }
        ]);

        const summary = summaryResult[0] || {
            totalCompletedDeliveries: 0,
            totalOrderValueHandled: 0,
            deliveryCommission: 0
        };

        const dailyBreakdown = await orderModel.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    deliveriesCount: { $sum: 1 },
                    orderValueHandled: { $sum: '$pricing.grandTotal' },
                    commissionEarnings: { $sum: { $ifNull: ['$financialBreakdown.deliveryPartnerCommission', { $multiply: ['$pricing.grandTotal', 0.05] }] } }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        res.status(200).json({
            month: month || new Date().toISOString().slice(0, 7),
            summary,
            dailyBreakdown
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    calculateHaversineDistance,
    assignNearestDeliveryPartner,
    toggleDutyStatus,
    updateLocation,
    getAssignedOrders,
    acceptOrder,
    updateOrderProgress,
    getEarningsAndHistory,
    getDeliveryFinancials
};
