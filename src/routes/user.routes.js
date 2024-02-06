import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccuontDetails, updateCoverImage, updateUserAvatar } from "../controllers/user.controller.js";
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
router.route("/get-current-user").post(verifyJWT, getCurrentUser);
router.route("/update-text-data").post(verifyJWT, updateAccuontDetails);
router.route("/update-user-avatar").post(verifyJWT
    , upload.single('avatar'), updateUserAvatar
)
router.route("/update-coverImage").post(verifyJWT,
    upload.single('coverImage'), updateCoverImage
)


export default router;