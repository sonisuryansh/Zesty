const userModel = require('../models/user.model');
const foodModel = require('../models/food.model');
const mongoose = require('mongoose');

// Get User Profile by ID or Username
async function getUserProfile(req, res) {
    try {
        const { userId } = req.params;
        let query = {};

        if (mongoose.Types.ObjectId.isValid(userId)) {
            query = { _id: userId };
        } else {
            query = { username: userId.toLowerCase() };
        }

        const user = await userModel.findOne(query).select('-password -failedLoginAttempts -knownDevices');
        if (!user) {
            return res.status(404).json({ message: "User profile not found" });
        }

        const currentViewerId = req.user ? req.user._id.toString() : null;
        const isOwner = currentViewerId === user._id.toString();

        const followersCount = user.followers ? user.followers.length : 0;
        const followingCount = user.following ? user.following.length : 0;

        // Check if current viewer is following this user
        const isFollowing = currentViewerId && user.followers ? user.followers.some(id => id.toString() === currentViewerId) : false;

        // Count posts/reels created by this user
        const postsCount = await foodModel.countDocuments({
            $or: [
                { foodPartner: user._id },
                { creator: user._id }
            ]
        });

        // Respect profile privacy for non-followers/non-owners
        if (user.isPrivate && !isOwner && !isFollowing) {
            return res.status(200).json({
                user: {
                    _id: user._id,
                    username: user.username || `@user_${user._id.toString().slice(-4)}`,
                    displayName: user.displayName || user.fullName,
                    profilePicture: user.profilePicture || user.avatar || '',
                    bio: user.bio || '',
                    isPrivate: true,
                    followersCount,
                    followingCount,
                    postsCount,
                    isFollowing,
                    isOwner
                },
                isPrivateRestricted: true
            });
        }

        res.status(200).json({
            user: {
                _id: user._id,
                username: user.username || `user_${user._id.toString().slice(-4)}`,
                displayName: user.displayName || user.fullName,
                fullName: user.fullName,
                profilePicture: user.profilePicture || user.avatar || '',
                bio: user.bio || '',
                location: user.location || '',
                website: user.website || '',
                isPrivate: user.isPrivate || false,
                followersCount,
                followingCount,
                postsCount,
                isFollowing,
                isOwner,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Update Logged-in User Profile
async function updateUserProfile(req, res) {
    try {
        const userId = req.user._id;
        const { username, displayName, bio, location, website, profilePicture } = req.body;

        const updates = {};
        if (displayName !== undefined) updates.displayName = displayName;
        if (bio !== undefined) updates.bio = bio;
        if (location !== undefined) updates.location = location;
        if (website !== undefined) updates.website = website;
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;

        if (username) {
            const cleanUsername = username.toLowerCase().trim();
            if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
                return res.status(400).json({ message: "Username can only contain letters, numbers, underscores, and dots." });
            }

            const existingUser = await userModel.findOne({
                username: cleanUsername,
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.status(400).json({ message: "Username is already taken by another user." });
            }

            updates.username = cleanUsername;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        ).select('-password -failedLoginAttempts -knownDevices');

        res.status(200).json({
            message: "Profile updated successfully ✨",
            user: updatedUser
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Get User Uploaded Food Posts & Reels
async function getUserPostsAndReels(req, res) {
    try {
        const { userId } = req.params;
        let queryUser = {};

        if (mongoose.Types.ObjectId.isValid(userId)) {
            queryUser = { _id: userId };
        } else {
            queryUser = { username: userId.toLowerCase() };
        }

        const user = await userModel.findOne(queryUser);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch posts linked to this user/partner
        const posts = await foodModel.find({
            $or: [
                { foodPartner: user._id },
                { creator: user._id }
            ]
        })
        .populate('foodPartner', 'name rating location isOnline')
        .sort({ createdAt: -1 });

        res.status(200).json({
            postsCount: posts.length,
            posts
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Follow a User
async function followUser(req, res) {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;

        if (currentUserId.toString() === userId.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself." });
        }

        const targetUser = await userModel.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "User to follow not found." });
        }

        // Atomically add currentUserId to targetUser's followers
        await userModel.findByIdAndUpdate(userId, {
            $addToSet: { followers: currentUserId }
        });

        // Atomically add targetUserId to currentUserId's following
        await userModel.findByIdAndUpdate(currentUserId, {
            $addToSet: { following: userId }
        });

        const updatedTarget = await userModel.findById(userId).select('followers');

        res.status(200).json({
            message: `Now following ${targetUser.fullName || targetUser.username} 🎉`,
            isFollowing: true,
            followersCount: updatedTarget.followers.length
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Unfollow a User
async function unfollowUser(req, res) {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;

        const targetUser = await userModel.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "User to unfollow not found." });
        }

        // Atomically remove currentUserId from targetUser's followers
        await userModel.findByIdAndUpdate(userId, {
            $pull: { followers: currentUserId }
        });

        // Atomically remove targetUserId from currentUserId's following
        await userModel.findByIdAndUpdate(currentUserId, {
            $pull: { following: userId }
        });

        const updatedTarget = await userModel.findById(userId).select('followers');

        res.status(200).json({
            message: `Unfollowed ${targetUser.fullName || targetUser.username}`,
            isFollowing: false,
            followersCount: updatedTarget.followers.length
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserPostsAndReels,
    followUser,
    unfollowUser
};
