const foodModel = require('../models/food.model');
const { uploadFile } = require('../services/storage.services');

async function createFood(req, res) {
     const { name, description, category, price, isAvailable } = req.body;

     if (!name || !req.file) {
          return res.status(400).json({
               message: 'Name and video/media file are required'
          });
     }

     try {
          const uploadedFile = await uploadFile(req.file);
          const mediaUrl = uploadedFile.url;
          const isImage = (req.body.mediaType === 'image') || (req.file && req.file.mimetype && req.file.mimetype.startsWith('image'));
          const mediaType = isImage ? 'image' : 'video';

          const food = await foodModel.create({
               name: req.body.name,
               description: req.body.description || '',
               category: req.body.category || 'Trending',
               price: price ? Number(price) : 299,
               isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
               mediaType: mediaType,
               video: mediaUrl,
               image: mediaUrl,
               videoFileId: uploadedFile.fileId || `local_${Date.now()}`,
               foodPartner: req.foodPartner._id
          });

          console.log("🍱 Food reel created");

          return res.status(201).json({
               message: 'Food item created successfully',
               food
          });
     } catch (error) {
          console.error("❌ Food reel creation failed:", error.message);
          return res.status(500).json({
               message: error.message || 'Unable to create food item'
          });
     }
}

async function getFoodItems(req, res) {
     try {
          const foodItems = await foodModel.find({ isAvailable: true })
               .populate('foodPartner', 'name email isOnline rating totalRatings cuisine location verificationDetails')
               .sort({ createdAt: -1 });

          res.status(200).json({
               message: "Food items fetched successfully",
               foodItems
          });
     } catch (err) {
          res.status(500).json({ message: err.message });
     }
}

async function getRestaurantReels(req, res) {
     try {
          const { restaurantId } = req.params;
          const reels = await foodModel.find({ foodPartner: restaurantId })
               .populate('foodPartner', 'name email isOnline rating totalRatings cuisine location verificationDetails')
               .sort({ createdAt: -1 });

          res.status(200).json({
               message: "Restaurant reels fetched successfully",
               reels
          });
     } catch (err) {
          res.status(500).json({ message: err.message });
     }
}

async function searchRestaurantFood(req, res) {
     try {
          const { restaurantId } = req.params;
          const { q = '' } = req.query;

          const query = {
               foodPartner: restaurantId
          };

          if (q) {
               query.$or = [
                    { name: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { category: { $regex: q, $options: 'i' } }
               ];
          }

          const foodItems = await foodModel.find(query)
               .populate('foodPartner', 'name email isOnline rating totalRatings cuisine location verificationDetails')
               .sort({ createdAt: -1 });

          res.status(200).json({
               message: "Restaurant food search results",
               foodItems
          });
     } catch (err) {
          res.status(500).json({ message: err.message });
     }
}

async function deleteFood(req, res) {
     const { id } = req.params;
     try {
          const food = await foodModel.findById(id);
          if (!food) {
               return res.status(404).json({
                    message: 'Food item not found'
               });
          }
          if (food.foodPartner.toString() !== req.foodPartner._id.toString()) {
               return res.status(403).json({
                    message: 'You are not authorized to delete this food item'
               });
          }
          await foodModel.findByIdAndDelete(id);
          return res.status(200).json({
               message: 'Food item deleted successfully'
          });
     } catch (error) {
          console.error("❌ Food deletion failed:", error.message);
          return res.status(500).json({
               message: 'Failed to delete food item'
          });
     }
}

async function getPartnerFoodItems(req, res) {
     try {
          const foodItems = await foodModel.find({ foodPartner: req.foodPartner._id })
               .sort({ createdAt: -1 });

          return res.status(200).json({
               message: "Partner food items fetched successfully",
               foodItems
          });
     } catch (err) {
          return res.status(500).json({ message: err.message });
     }
}

module.exports = {
     createFood,
     getFoodItems,
     getPartnerFoodItems,
     getRestaurantReels,
     searchRestaurantFood,
     deleteFood
};
