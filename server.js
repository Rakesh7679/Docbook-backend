import express from 'express';
import cors from 'cors';
// import 'dotenv/config'
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js'
import dotenv from 'dotenv';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';
import path from 'path';

dotenv.config();





//app config
const app = express();
const port = process.env.PORT || 4000;
connectDB()
connectCloudinary()



//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [
        'https://docbook-frontend.vercel.app'
        'https://docbook-admin.vercel.app'
    ],
    credentials: true
}));

//api endpoint
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)

// if(process.env.NODE_ENV === 'production'){
//     app.use(express.static(path.join(__dirname, '../frontend/dist')))
//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'))
//     })
// }


//localhost:4000/api/admin/add-doctor

app.get('/', (req, res) => {
    res.send('Hello World')
})

//listening to server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
