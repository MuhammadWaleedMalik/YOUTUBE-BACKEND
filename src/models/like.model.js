import mongoose ,{Schema} from "mongoose";

const LikeSchema = new Schema({
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
    likeBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})


export const Like = mongoose.model('Like',LikeSchema)

