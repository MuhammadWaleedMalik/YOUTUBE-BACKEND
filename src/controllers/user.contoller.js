import {asyncHandler }from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'



const generateAccessAndRefreshTokens = async(userId)=>{

    try {
    const user = await User.findById(userId)    
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
    return {refreshToken , accessToken}
    
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

if(! username || email){
    throw new ApiError(400,'Username or Password is Required')
}

const user = await User.findOne({ 
    $or:[{email},{username}]
 })

 if(!user){
    throw new ApiError(404,"User Does Not Exit")
 }
 
 const isPasswordValid = await user.isPasswordCorrect(password)

 if(isPasswordValid){
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
        {
        user:loggedInUser,accessToken,refreshToken
    }
   ,"User Logged In Successfully")
 )

})


const logoutUser = asyncHandler(async(req,res)=>{
  await  User.findByIdAndUpdate(req.user._id,
    {
        
        $set:{
            refreshToken:undefined 
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


export {registerUser,loginUser,logoutUser}