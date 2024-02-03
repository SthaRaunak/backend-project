import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(
    async (req, res) => {
        //get user details from frontend (req.body)
        const { username, fullName, email, password } = req.body;

        console.log(req.body);

        //validation - not empty
        if ([fullName, username, email, password].some((field) => {
            field?.trim() === ""
        })) {
            throw new ApiError(400, "All fields are required");
        }
        
        //check if user already exists check in db if  enail, username already exists
        const existedUser = await User.findOne({
            $or: [{username},{email}]
        })
        if(existedUser){
            throw new ApiError(409,"User with email or username already exists.");
        }
        //check for images, check for avatar

        console.log(req.files);
        const avatarLocalPath =  req.files?.['avatar'][0]?.path;
        const coverImageLocalPath =  req.files?.['coverImage'][0]?.path;

        //avatar is required while cover Image is optional
        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar file is required");
        }
        //upload them to cloudinary , check avatar
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if(!avatar){
            throw new ApiError(400,"Avatar file is required");
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
        
        console.log(user);

        // remove password and refresh token field from response and 
        // check for user creation.
         const createdUser = await User.findById(user._id)?.select(
            "-password -refreshToken"
         );
        
         if(!createdUser) {
            throw new ApiError(500,"Something went wrong while registering the user.")
         }

        //return response
       
        return res.status(201).json(
            new ApiResponse(201,createdUser,"User registered Successfully")
        );

        })

export { registerUser }