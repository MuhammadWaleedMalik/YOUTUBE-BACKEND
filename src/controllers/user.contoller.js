import {asyncHandler }from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'





const generateAccessAndRefreshTokens = async(userId)=>{

    try {
    const user = await User.findById(userId)    
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
    return {accessToken, refreshToken}
    
    } catch (error) {
        throw new ApiError(500,'Something went wrong while generating refresh and access token')
    }
}


const registerUser=asyncHandler( async (req,res)=>{

const {username,email,fullname,password} = req.body

if (
    [fullname,email,username,password].some((field)=>{
        return field?.trim() === ''
    })
) {
    throw new ApiError(400,"All Field Are Required")
}

const existedUser =await User.findOne({
    $or:[ { username } ,{ email }]
})

if(existedUser){
    throw new ApiError(409 , "User with email of Username or Email already exists")
}

const avatarLocalPath = req.files?.avatar[0]?.path;
const avatarImagePath = req.files?.coverImage[0]?.path;



if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
}
if(!avatarImagePath){
    throw new ApiError(400,"CoverImage file is required")
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

 
const loginUser=asyncHandler(async (req,res)=>{

const {email,username,password} = req.body;

// const email="Waleed@waleed.com"
// const username='Waleed'
// const password='WALEED'


if(!username && !email){
    throw new ApiError(400,'Username or Password is Required')
}

const user = await User.findOne({ 
    $or:[{email},{username}]
 })

 if(!user){
    throw new ApiError(404,"User Does Not Exit")
 }
 
 const isPasswordValid = await user.isPasswordCorrect(password)
// console.log(isPasswordValid)
 if(!isPasswordValid){
    throw new ApiError(401,'Invalid User Credentials')
 }
 
 const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
 
 const loggedInUser = User.findById(user._id).select("-password -refreshToken")

 const options = {
    httpOnly:true,
    secure:true
 }
 return res.
 status(200)
 .cookie('accessToken',accessToken,options)
 .cookie('refreshToken',refreshToken,options)
 .json(
    new ApiResponse(200,
        JSON.stringify({
            user: loggedInUser,
            accessToken,
            refreshToken
        }, (key, value) => {
            if (typeof value === 'object' && value !== null) {
             return undefined;
            }
            return value;
        }),
       "User Logged In Successfully")
 )

})


const logoutUser = asyncHandler(async(req,res)=>{
  await  User.findByIdAndUpdate(req.user._id,
    {
        
        $set:{
            refreshToken:null
            }
    },
    {
        new:true
    }
  )

  const options = {
    httpOnly:true,
    secure:true
 }
 res
 .status(200)
 .clearCookie('accesToken',options)
 .clearCookie('refreshToken',options)
 .json(new ApiResponse(200,{},"User Logged Out Successfully"))
   
})


const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefeshToken = req.cookies.refreshAccessToken || req.body.refreshToken

    if(!incomingRefeshToken){
        throw new ApiError(401,"UnAuthorized Request")
    }

   try {
     const decodedToken = jwt.verify(incomingRefeshToken,process.env.REFRESH_TOKEN_SECRET)
 
     
     const user = await User.findById(decodedToken?._id)
     
     
     if(!user){
         throw new ApiError(401,"InValid Refresh Token")
     }
 
     if(incomingRefeshToken !== user?.refreshToken){
         throw new ApiError(401,'Refresh Token is expired or used')
     }
 
     const {accessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
     const options = {
         httpOnly:true,
         secure:true
     }
     return res
     .status(200)
     .cookie("accessToken",newrefreshToken,options)
     .cookie("refreshToken",accessToken,options)
     ,json(
         new ApiResponse(
             200,
             {accessToken,refreshToken},
             "Access Token  Refresh"
         )
     )
   } catch (error) {
    throw new ApiError(401,'Invalid Refresh Token')
   }


})


const changeCurrentPasword = asyncHandler(async(req,res)=>{

    const {oldPassword, newPassword}=req.body
   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid OLD Password")

    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed Succesfully"))
   }

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"Current user Fetched Successfully")
})

const updateAccountDetails =asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body;
    if(!fullname || !email){
        throw new ApiError(400,"ALL Fields are Required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new:true}
    ).select('-password')

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details Updated Successfully"))
    
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){

     throw new ApiError(500,"Error While Uploading on Avatar")

   }

   const user = await User.findByIdAndUpdate(
    req.user._id,

    {
        $set:{     avatar:avatar.url     }
    },

    {new:true}

).select('-password')

return res
.status(200)
.json(
    new ApiResponse(200,user,'Avatar Changed Successfully')
)

})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
   const coverImageLocalPath = req.file?.path
   if(!coverImageLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){

     throw new ApiError(500,"Error While Uploading on Avatar")

   }

   const user = await User.findByIdAndUpdate(
    req.user._id,

    {
        $set:{     coverImage:coverImage.url     }
    },

    {new:true}

).select('-password')

return res
.status(200)
.json(
    new ApiResponse(200,user,'CoverImage Changed Successfully')
)

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,'Username is Missing');
    }
     
     const channel = await User.aggregate([
        {
            $match:{
          username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:'subscriptions',
                localField:'_id',
                foreignField:'channel',
                as :'subscribers'
            }
        },
        {
            $lookup:{
                from:'subscriptions',
                localField:'_id',
                foreignField:'subscriber',
                as :'subscribedTo'

            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:'$subscribers'
                },
                subscribedToCount:{
                   $size:"$subscribedTo"
                },
                isSubscibed:{
                    $cond:{
                        if:{$in:[req.user?._id,'$subscribers.subscriber']},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
          $project:{
            fullname:1,
            username:1,
            subscriberCount:1,
            subscribedToCount:1,
            isSubscibed:1,
            avatar:1,
            coverImage:1,
            email:1
          }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,'Channel Does Not exists')
    }

    return 
    res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User Channel Fetched Successfully"))
    

})

const getWatchHistory =asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:'videos',
            localField:'watchHistory',
            foreignField:"_id",
            as : 'watchHistory',
            pipeline:[
                {
                    $lookup:'users',
                    localField:'owner',
                    foreignField:'_id',
                    as :'owner',
                    pipeline:[
                        {
                            $project:{
                                fullname:1,
                                username:1,
                                avatar:1
                            }
                        }
                    ]
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"  
                        } 
                    }
                }
            ]
        }
    ])
    return
    res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch History Fetched"))

})




export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPasword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

