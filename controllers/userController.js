import validator from "validator";
import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";
import dotenv from 'dotenv';
dotenv.config();
import crypto from "crypto";





//Api to register a new user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !password || !email  ) {
            return res.json({ success: false, message: "Please fill all the fields" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }
        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = {
            name,
            email,
            password: hashedPassword,
        }
        const newUser = new userModel(userData);
        const user =  await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET )
        res.json({ success: true,token})


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
        
    }
}

//Api to login a user

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, message: "Please fill all the fields" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET )
            res.json({ success: true, token }) 
        }
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
    }
}

//Api to get user data
const getProfile = async (req, res) => {
    try {
       const { userId } = req.body
         const userData = await userModel.findById(userId).select("-password")
         res.json({success:true,userData})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
    }
}

//Api to update user profile
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;
        if(!name || !phone || !dob || !gender){
            return res.json({ success: false, message: "Please fill all the fields" });

        }
        await userModel.findByIdAndUpdate(userId, {
            name,
            phone,
            address:JSON.parse(address),
            dob,
            gender
        }, { new: true });
        if (imageFile) {
            // Upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"})
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, {
                image: imageURL
            })
        }
        res.json({ success: true, message: "Profile updated successfully"});

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
        
    }
}

//Api to book appointment
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;
        const docData = await doctorModel.findById(docId).select("-password")
        if (!docData.available) {
            return res.json({ success: false, message: "Doctor not found" });
        }
       let slots_booked = docData.slots_booked

       //checking for slot availability
       if(slots_booked[slotDate]){
            if(slots_booked[slotDate].includes(slotTime)){
                return res.json({ success: false, message: "Slot not available" });
            }else{
                slots_booked[slotDate].push(slotTime)
            }
       }else{
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
       }

       const userData = await userModel.findById(userId).select("-password")
       delete docData.slots_booked
       const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
           
       }
         const newAppointment = new appointmentModel(appointmentData)
         await newAppointment.save()

         // save new slots in doctor data
            await doctorModel.findByIdAndUpdate(docId, {
                slots_booked
            })
            res.json({ success: true, message: "Appointment booked successfully" })


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
        
    }
}

// Api to get user appointments for frontend my-appointments page

const listAppointments = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId })
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
    }
}

//API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { userId,appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId)
        //verify appointment belongs to user
        if(appointmentData.userId !== userId){
            return res.json({ success: false, message: "Unauthorized" });
        }
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


const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

// // API TO MAKE PAYMENT USING RAZORPAY
const paymentRazorpay = async (req, res) => {


    try {
        
    const {appointmentId} = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)
    if(!appointmentData || appointmentData.cancelled){
        return res.json({success:false,message:"Appointment not found"})
    }
    //creating option for rajorpay payment
    const options = {
        amount: appointmentData.amount * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: appointmentId,
       
    }
    //creating order in razorpay
    const order = await razorpayInstance.orders.create(options)
    res.json({success:true,order})
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
        
    }
 

}

//api to verify payment of rzorpay
const verifyRazorpay = async (req,res)=>{
    try {
        const {razorpay_order_id} = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
       
        if(orderInfo.status === 'paid'){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{
                payment:true,
                
            })
            res.json({success:true,message:"Payment successful"})
            
        }
        else{
            res.json({success:false,message:"Payment failed"})
        }
        
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
        
    }
}


export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointments, cancelAppointment, paymentRazorpay,verifyRazorpay };