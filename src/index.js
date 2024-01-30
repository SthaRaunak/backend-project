// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";


dotenv.config({path: './env'});

connectDB();


















// const app = express();

// ; (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error",(error)=> {
//             console.log('Application not able to connect to data base');
//             throw error;
//         })
//     } catch (error) {
//         console.error("ERROR: ", error);
//         throw error;
//     }
// })()