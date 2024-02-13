import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccuontDetails, updateCoverImage, updateUserAvatar, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields(
        [
            { name: 'avatar', maxCount: 1 },
            { name: 'coverImage', maxCount: 1 },
        ]
    ), registerUser);

router.route("/login").post(loginUser);


//secured routes:  
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);
router.route("/update-text-data").patch(verifyJWT, updateAccuontDetails);
router.route("/update-user-avatar").patch(verifyJWT
    , upload.single('avatar'), updateUserAvatar
);
router.route("/update-coverImage").patch(verifyJWT,
    upload.single('coverImage'), updateCoverImage
);

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);

router.route('/history').get(
    verifyJWT,
    getWatchHistory
);

export default router;