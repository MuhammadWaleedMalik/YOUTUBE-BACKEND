import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Both name and description are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user._id
     })

     if(!playlist){
        throw new ApiError(500,"Failed To Create Playlist")
     }

     res.status(201).json(new ApiResponse(201,"Playlist Created Successfully",playlist))
       //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    const playlists = await Playlist.find({owner:userId})

    if(!playlists){
        throw new ApiError(404,"No Playlists Found")
    }

    res.status(200).json(new ApiResponse(200,"Playlists Fetched Successfully",playlists))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist Not Found")
    }

    res.status(200).json(new ApiResponse(200,"Playlist Fetched Successfully",playlist))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist Not Found")
    }

    // Check if the video exists (assuming you have a Video model)
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video Not Found")
    }

    // Check if the video is already in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist")
    }
    
    playlist.videos.push(videoId)

    const updatedPlaylist = await playlist.save()

    if (!updatedPlaylist) {
        throw new ApiError(500, "Failed to add video to playlist")
    }

    res.status(200).json(new ApiResponse(200, "Video Added To Playlist Successfully", updatedPlaylist))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist Not Found")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video Not Found")
    }

    if(!playlist.videos.includes(videoId)){
        throw new ApiError(400,"Video Not Found In Playlist")
    }

    playlist.videos = playlist.videos.filter(id => id !== videoId)

    const updatedPlaylist = await playlist.save()

    if(!updatedPlaylist){
        throw new ApiError(500,"Failed To Remove Video From Playlist")
    }

    res.status(200).json(new ApiResponse(200,"Video Removed From Playlist Successfully",updatedPlaylist))
    
    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete Playlist
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist Not Found")
    }

    res.status(200).json(new ApiResponse(200,"Playlist Deleted Successfully",playlist)) 

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    const playlist = await Playlist.findByIdAndUpdate(playlistId,{name,description})

    if(!playlist){
        throw new ApiError(404,"Playlist Not Found")
    }

    res.status(200).json(new ApiResponse(200,"Playlist Updated Successfully",playlist)) 
    
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
