import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload file in cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        },
            function (error, result) {
                console.log(result.url);
            });
        //file has been scuccessfully uploaded

        console.log("File has been sucessfully uploaded on cloudinary")
        return response;

    } catch (error) {
        console.error('File failed to upload to cloudinary')
        fs.unlinkSync(localFilePath); //remove the locally stored temp file as thhe upload operation got failed.

        return null;
    }
}

export { uploadOnCloudinary };
