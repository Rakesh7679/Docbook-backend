import validator from 'validator';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';


const addDoctor = async (req, res) => {
    try{
        const {name, email, password, speciality,degree,experience,about,fees,address} = req.body;
        const imageFile = req.file

        // console.log({name, email, password, speciality,degree,experience,about,fees,address}, imageFile);

        


        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address){
            return res.json({
                success: false,
                message: "Please fill all the fields"
            })

        }
        if(!validator.isEmail(email)){
            return res.json({
                success: false,
                message: "Please enter a valid email"
            })
        }
        if(password.length < 8){
            return res.json({
                success: false,
                message: "Please enter a strong password"
            })
        }
        // hashing doctor password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)


        //uploading image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
           resource_type: "image",
        })
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address:JSON.parse(address),
           
            date:Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({
            success: true,
            message: "Doctor added successfully",
          
        })
        


     }
    catch(error){
        console.log(error)
        res.json({
            success: false,
            message: "Internal server error",
            error: error.message
        })

    }
}

//api for the addmin login

const loginAdmin = async (req, res) => {
     res.setHeader('Access-Control-Allow-Origin', 'https://docbook-admin.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    try {

        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { admin: true, email: process.env.ADMIN_EMAIL }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1h' }
              )
             res.cookie('token', token, {
                httpOnly: true,
                secure: true,      // Render/production pe true
                sameSite: 'none'   // Cross-origin ke liye
            });
            res.json({
                success: true,
                token
            })

        }else {
            res.json({
                success: false,
                message: "Invalid credentials",
                admin: false
            })
        }

      
        
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
        
    }

}
//api to get all doctors list for admin panel
const allDoctors = async (req, res) =>{
    try {
        const doctors = await doctorModel.find({}).select("-password")
        res.json({
            success: true,
            doctors
        })

        
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
        
    }

}
//Api to gett all appoinment list
const appoinmentsAdmin = async (req, res) =>{
    try {
        const appoinments = await appointmentModel.find({})
        res.json({
            success: true,
            appoinments
        })

        
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
        
    }

}
//api to Appointment cancellation
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId)
      
        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true})

        // remove slot from doctor data
        const { docId, slotDate, slotTime } = appointmentData
        const doctorData = await doctorModel.findById(docId).select("-password")
        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e !== slotTime)
        await doctorModel.findByIdAndUpdate(docId, {
            slots_booked
        })
        res.json({ success: true, message: "Appointment cancelled successfully" })
       
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
    }
}

//api to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            
            appointments: appointments.length,
            patients: userModel.length,
            latestAppointments: appointments.reverse().slice(0, 5),
        }
        res.json({
            success: true,
            dashData
        })
     
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
        
    }

}


export{addDoctor, loginAdmin, allDoctors, appoinmentsAdmin,appointmentCancel, adminDashboard}
