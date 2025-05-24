import express from 'express'
import { addDoctor,allDoctors,loginAdmin,appoinmentsAdmin,appointmentCancel,adminDashboard } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailability } from '../controllers/doctorController.js'

const adminRouter = express.Router()
adminRouter.post('/add-doctor',authAdmin, upload.single('image'), addDoctor)
adminRouter.post('/login', loginAdmin)
adminRouter.get('/all-doctors', allDoctors)
adminRouter.post('/change-avaiability',authAdmin, changeAvailability)
adminRouter.get('/appoinments',authAdmin, appoinmentsAdmin)
adminRouter.post('/cancel-appointment',authAdmin, appointmentCancel)
adminRouter.get('/dashboard',authAdmin, adminDashboard)



export default adminRouter

