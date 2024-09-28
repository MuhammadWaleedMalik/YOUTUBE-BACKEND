import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} =req.body
    const {user}=req.user

    if(!content){
        throw new Error(400,'Please Enter Content for Tweet')
    }

    if(user){
        throw new ApiError(400,'Error User Is Not Veries')
    }

    const tweet = await Tweet.create({
        content,
        owner:user._id
    })

    return
    res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet Added Succesfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    const user=req.user
    const tweets = await Tweet.find({owner:user._id}).sort({createdAt:-1})
    return 
    res
    .status(200,tweets,'Tweets Fetched seccesfully')
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweet_id}=req.params
    const {content} =req.body
    
    if(!tweet_id){
        throw new ApiError(400,"You failed To Send The tweet ID")
    }
    if(!content){
        throw new Error(400,'Please Enter Content for Tweet')
    }

    const newTweet = await Tweet.findOneAndUpdate(tweet_id,
        {
            $set:{content}
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,newTweet,"tweet Modified Succesfuly"))

    


})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweet_id} = req.params
    if(!tweet_id){
        throw new ApiError(400,"You failed To Send The tweet ID")
    }
    const tweet = await Tweet.findByIdAndDelete(tweet_id)
    if(!tweet){
        throw new ApiError(404,"Tweet Not Found")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,tweet,"Tweet Deleted Succesfuly"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
