import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getPublicId = (imageUrl) => {
    const publicId = imageUrl.split("/").pop().split().at(0);

    return publicId;
}


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload file in cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        },
            function (error, result) {
                // console.log('cloudinaryfunction', result.url);
                fs.unlinkSync(localFilePath)
            });
        //file has been scuccessfully uploaded
        // console.log(response)
        // console.log("File has been sucessfully uploaded on cloudinary")
        return response;

    } catch (error) {
        console.error('File failed to upload to cloudinary: ', error)
        fs.unlinkSync(localFilePath); //remove the locally stored temp file as thhe upload operation got failed.

        return null;
    }
}

const deleteOnCloudinary = async(cloudinaryUrl) => {
    try{
        if(!cloudinaryUrl){
            return null;
        }

        const response = await cloudinary.uploader.destroy( getPublicId(cloudinaryUrl) , {
            resource_type: 'auto'
        });

        return response;

    }catch(error){
            console.log('File failed to delete on cloudinary: ',error);
            return null;

    }
}

export { uploadOnCloudinary, deleteOnCloudinary };
