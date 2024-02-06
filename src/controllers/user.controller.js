import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SALT_ROUNDS } from "../constants.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        if (!accessToken || !refreshToken) {
            throw new Erorr;
        };

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens.")
    }

}

const registerUser = asyncHandler(
    async (req, res) => {
        //get user details from frontend (req.body)
        const { username, fullName, email, password } = req.body;

        // console.log(req.body);

        //validation - not empty
        if ([fullName, username, email, password].some((field) => {
            field?.trim() === ""
        })) {
            throw new ApiError(400, "All fields are required");
        }

        //check if user already exists check in db if  enail, username already exists
        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        })
        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists.");
        }
        //check for images, check for avatar

        // console.log(req.files);

        const avatarLocalPath = req.files?.['avatar']?.[0]?.path;
        const coverImageLocalPath = req.files?.['coverImage']?.[0]?.path;


        // if(req.files && Array.isArray(req.files['coverImage']) && req.files['coverImage'].length > 0){
        //     coverImageLocalPath = req.files.coverImage.at(0).path;
        // }


        //avatar is required while cover Image is optional
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required (localpath)");
        }
        //upload them to cloudinary , check avatar
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required");
        }

        const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

        //create user object - create entry in db
        const user = await User.create({
            fullName,
            username: username.toLowerCase(),
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",

        });

        // console.log(user);

        // remove password and refresh token field from response and 
        // check for user creation.
        const createdUser = await User.findById(user._id)?.select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user.")
        }

        //return response

        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered Successfully")
        );

    }
)

const loginUser = asyncHandler(
    async (req, res) => {
        //get data from the body (frontend)

        const { email, username, password } = req.body;

        if (!username && !email) {
            throw new ApiError(400, "Please provide username or email ")
        }
        //check if the account with the email exist
        const user = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (!user) {
            throw new ApiError(404, "User with that email or username doesnt exist.")
        };

        //if so compare password with bcrypt compare (password check)

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Incorrect Password");
        }

        //if matches then generate acces and refresh token and send them to the user using secure cookie

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const loggedUser = await User.findById(user._id).select('-password -refreshToken');

        //this ensures cookie can only be modified by server
        const options = {
            httpOnly: true,
            secure: true,
        }

        //return thre response
        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(new ApiResponse(200, { user: loggedUser, accessToken, refreshToken }, "User logged in successfully"));
    }
)

const logoutUser = asyncHandler(
    async (req, res) => {
        const { _id } = req.user;

        const user = await User.findByIdAndUpdate(_id, {
            $set: { refreshToken: "" }
        }, {
            new: true,
        })

        console.log(user);

        const option = {
            httpOnly: true,
            secure: true,
        }

        return res.status(200).clearCookie('accessToken', option).clearCookie('refreshToken', option).json(
            new ApiResponse(200, {}, "User Logged out")
        );


    }
)

const refreshAccessToken = asyncHandler(
    async (req, res, next) => {
        //access refresh token from cookie or header
        // console.log(req.body)


        const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;


        if (!incomingRefreshToken) {
            throw new ApiError(401, "No refresh token found, Unauthroized request");
        }

        try {
            const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);


            const user = await User.findById(decodedToken?._id).select('-password');

            if (!user) {
                throw new ApiError(401, "Invalid Refresh Token");
            }

            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh token is expred or used");
            }

            const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

            const options = {
                httpOnly: true,
                secure: true,
            }


            res.status(200)
                .cookie('accessToken', accessToken, options)
                .cookie('refreshToken', newRefreshToken, options)
                .json(
                    new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully")
                )
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token");
        }
    }
);

const changeCurrentPassword = asyncHandler(
    async (req, res, next) => {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword && !newPassword) {
            throw new ApiError(401, "Please provide password");
        }



        const { _id } = req.user;

        const user = await User.findById(_id);

        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }

        const isPasswordValid = await user.isPasswordCorrect(oldPassword);


        if (!isPasswordValid) {
            throw new ApiError(400, "Invalid Password");
        }

        user.password = newPassword;

        await user.save({ validateBeforeSave: false });

        return res.status(200).json(
            new ApiResponse(200, {}, "Password changed succesfully")
        );

    }
)

const getCurrentUser = asyncHandler(
    async (req, res, next) => {

        return res.status(200).json(
            new ApiResponse(200, req.user, "current user fetched successfully.")
        )
    }

)

const updateAccuontDetails = asyncHandler(
    async (req, res, next) => {
        const { fullName, email, } = req.body;

        if (!fullName || !email) {
            throw new ApiError(400, "Please provide fullname and email")
        }

        const updatedUser = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    fullName: fullName,
                    email: email
                }
            },
            {
                new: true,
            }).select('-password -refreshToken');

        return res.status(200).json(
            new ApiResponse(200, updatedUser, "Account details updated sucessfully")
        )

    }
)

const updateUserAvatar = asyncHandler(
    async (req, res, next) => {
        const avatarLocalPath = req.file?.path;


        if (!avatarLocalPath) {
            throw new ApiError(401, "Something went wrong while upload avatar    ")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {
            throw new ApiError(400, "Errror while upload to CLoudinary");
        }

        const { _id } = req.user;

        const user = await User.findByIdAndUpdate(_id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {
                new: true,
            }).select('-password -refreshToken');


        return res.status(200, user, "User avatar updated succesfully");
    }
)

const updateCoverImage = asyncHandler(
    async (req, res, next) => {
        const coverImageLocalPath = req.file?.path;

        if (!coverImageLocalPath) {
            throw new ApiError(401, "Something went wrong while uploading cover Image");
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage.url) {
            throw new ApiError(400, "Error while uploading to Cloudinary");
        }

        const {_id} = req.user;

        const user = await User.findByIdAndUpdate(
            _id,
            {
                $set: {
                    coverImage: coverImage.url,
                }
            },
            {
                new: true,
            }
        ).select(
            "-password -rereshToken "
        )

        return res.status(200).json(new ApiResponse(200,user,"Cover Image updated successfully."));
    }
)


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccuontDetails, updateUserAvatar, updateCoverImage};