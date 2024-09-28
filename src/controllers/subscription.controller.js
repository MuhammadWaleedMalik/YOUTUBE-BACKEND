import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id; 
  
    try {
      const subscription = await Subscription.findOne({ channel: channelId, subscriber: userId });
  
      if (subscription) {
        // Unsubscribe
        await subscription.remove();
        return res.status(200).json(new ApiResponse(200,'USER UNSUBSCRIBED SUCCESFULLY'));
      } else {
        // Subscribe
        const newSubscription = await Subscription.create({ channel: channelId, subscriber: userId });
        return res.status(201).json(new ApiResponse(200, newSubscription  , "Subscribed to channel successfully" ));
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json(new ApiResponse(500, "Error toggling subscription" ));
    }
  };
    
    // controller to return subscriber list of a channel
    const getUserChannelSubscribers = asyncHandler(async (req, res) => {
        const { channelId } = req.params;
      
        if (!channelId) {
          throw new ApiError(400, "You Failed to send Channel ID");
        }
      
        const result = await Subscription.aggregate([
          {
            $match: { channel: mongoose.Types.ObjectId(channelId) }
          },
          {
            $facet: {
              count: [{ $count: "count" }],
              subscribers: [{ $skip: 0 }] // or use $limit if you want to limit the number of subscribers
            }
          }
        ]);
      
        if (!result || result.length === 0) {
          throw new ApiError(500, "Failed TO Fetch Subscribers");
        }
      
        const subscriberCount = result[0].count[0].count;
        const subscribers = result[0].subscribers;
      
        return res.status(200).json(new ApiResponse(200, { count: subscriberCount, subscribers }, "Subscribers fetched Successfully"));
      });

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { user } = req.user;
  
    const result = await Subscription.aggregate([
      {
        $match: {
          subscriber: mongoose.Types.ObjectId(user._id)
        }
      },
      {
        $facet: {
          count: [{ $count: "count" }],
          channels: [{ $lookup: { from: "users", localField: "channel", foreignField: "_id", as: "channel" } }]
        }
      }
    ]);
  
    if (!result || result.length === 0) {
      throw new ApiError(404, "No subscribed channels found");
    }
  
    const subscribedChannelCount = result[0].count[0].count;
    const subscribedChannels = result[0].channels.map(channel => channel.channel[0]);
  
    return res.status(200).json(new ApiResponse(200, { count: subscribedChannelCount, channels: subscribedChannels }, "Subscribed channels fetched successfully"));
  });

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}