import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const userId = req.user._id

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    if (existingLike) {
        // Unlike the video
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Video unliked successfully")
        )
    } else {
        // Like the video
        const newLike = await Like.create({
            video: videoId,
            likeBy: userId
        })
        return res.status(200).json(
            new ApiResponse(200, { liked: true, like: newLike }, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const userId = req.user._id

    const existingLike = await Like.findOne({
        comment: commentId,
        likeBy: userId
    })

    if (existingLike) {
        // Unlike the comment
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Comment unliked successfully")
        )
    } else {
        // Like the comment
        const newLike = await Like.create({
            comment: commentId,
            likeBy: userId
        })
        return res.status(200).json(
            new ApiResponse(200, { liked: true, like: newLike }, "Comment liked successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const userId = req.user._id

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likeBy: userId
    })

    if (existingLike) {
        // Unlike the tweet
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Tweet unliked successfully")
        )
    } else {
        // Like the tweet
        const newLike = await Like.create({
            tweet: tweetId,
            likeBy: userId
        })
        return res.status(200).json(
            new ApiResponse(200, { liked: true, like: newLike }, "Tweet liked successfully")
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id
    const likedVideos = await Like.find({likeBy:userId}).populate("video")

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}