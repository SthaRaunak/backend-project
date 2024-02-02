import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            required: true,
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true,
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },

        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        duration: {
            type: Number, //we wiill also get this from cloduinary duration
            required: true,
        },

        views: {
            type: Number,
            default: 0,
            required: true,
        },

        isPublished: {
            type: Boolean,
            default: true,
        },
        
        watchHistory: {
            type: [
                {

                }
            ],
            default: true,
        }


    }, { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.models('Video', videoSchema);

