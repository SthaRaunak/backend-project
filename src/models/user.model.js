import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt, { compare } from "bcrypt";
import { SALT_ROUNDS } from "../constants";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: [true, 'Password is required'], //with error message
        },


        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        avatar: {
            type: String, //cloudinary url 
            required: true,
        },

        coverImage: {
            type: String,
        },

        watchHistory:
            [
                {
                    type: Schema.Types.ObjecId,
                    ref: 'Video'
                }
            ],



        refreshToken: {
            type: String,
        },

    }, { timestamps: true }
);

//dont use arrow in pre middleware as we neeed acces to this keyword
userSchema.pre('save', async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
    next();

});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    const accessToken = jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });


    return accessToken;
};

userSchema.methods.generateRefreshToken = function () {
    jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
};

export const User = mongoose.model('User', userSchema);