import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query } = req.query
  

    const videos = await Video.find()
      .skip((page - 1) * limit)
      .limit(limit)
  
    try {
        if (query) {
          videos.filter(video => video.title.toLowerCase().includes(query.toLowerCase()))
        }
    } catch (error) {
        throw new ApiError(500,"Failed to Fetched Videos")
    }

  
    res.status(200).json(new ApiResponse(200,videos,"Videos Fetched Succesfully"))
  })

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const {user} = req.user
    
    if(!title || !description){
        throw new ApiError(400,"Failed to send title or description")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(200,"You have Failed to Send the video and thumbnail")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const video = await Video.create({
     videoFile:videoFile.url,
     thumbnail:thumbnail.url,
     title,
     description,
     duration:videoFile.duration,
     owner:user._id
    })

    if(!video){
        throw new ApiError(400,'Failed To Upload Video')
    }

    return 
    res
    .status(200)
    .json(new ApiResponse(200,video,'Video Uploaded Succesfully'))

    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400,"You Failed to Send The Params")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(500,"Internal Error or Video Doonot Exists")
    }

    return
    res
    .status(200)
    .json(new ApiResponse(200,video,'Video Fetched Succesfully'))

   

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!videoId){
        throw new ApiError(400,'Failed to send the videoID in params')
    }
    
    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(200,"You have Failed to Send the video and thumbnail")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    
    
    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set:{title,
                description,
                thumbnail:thumbnail.url,
                videoFile:videoFile.url,
                duration:videoFile.duration

            }
        },
        {new:true}
    )

    if(!video){
        throw new ApiError(500,"Failed To Update Video")
    }


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,'Failed to send the videoID in params')
    }

    if(!(await Video.findByIdAndDelete(videoId))){
      throw new ApiError(500,"Failed to Delete Video")
    }

    return 
    res
    .status(200)
    .json(new ApiResponse(200,"Video Deleted Succesfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
  
    if (!videoId) {
      throw new ApiError(400, 'Failed to send the videoID in params')
    }
  
    const video = await Video.findById(videoId)
  
    if (!video) {
      throw new ApiError(404, 'Video not found')
    }
  
    const isPublished = video.isPublished
    await video.updateOne({ $set: { isPublished: !isPublished } })
  
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video publish status toggled successfully"))
  })

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
