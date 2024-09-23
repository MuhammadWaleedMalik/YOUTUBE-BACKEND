import {asyncHandler }from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const registerUser=asyncHandler( async (req,res)=>{

const {username,email,fullname,password} = req.body

if (
    [fullname,email,username,password].some((field)=>{
        return field?.trim() === ''
    })
) {
    throw new ApiError(400,"All Field Are Required")
}

const existedUser = User.findOne({
    $or:[ { username } ,{ email }]
})

if(existedUser){
    throw new ApiError(409 , "User with email of Username already exists")
}

const avatarLocalPath = req.files?.avatar[0]?.path;
const avatarImagePath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
}

const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverImage=await uploadOnCloudinary(avatarImagePath)

if(!avatar){
    throw new ApiError(400,"Avatar File Is Required")
}



const user = await User.create(
    {
        username,
        email,
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        password,

    }
)

const createdUser = await User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
    throw new ApiError(500,"Sorry Something went Wrong while creating the user")
}

return res.status(201).json(new ApiResponse(200,createdUser,"User Regsitered Successfully"))



})


export {registerUser}