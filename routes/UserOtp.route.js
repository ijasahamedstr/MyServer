// Import required modules
import express from "express";
import { userOtpSend } from "../controller/Sentotp.Controller.js";


const userotprouters = express.Router()

//CURD Functionality of Registertion

// Create the Data Register
userotprouters.post('/',userOtpSend);


export default userotprouters;
