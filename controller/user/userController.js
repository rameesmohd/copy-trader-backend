const {validateLogin,validateRegister} = require('../common/validations');
const userModel = require('../../models/user')
const managerModel = require('../../models/manager');
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const userTransactionModel = require('../../models/userTransaction');
const mongoose = require("mongoose");
const depositModel = require('../../models/deposit')
const rebateTransactionModel = require('../../models/rebateTransaction');
const managerTradeModel = require('../../models/managerTrades')

const {
    forgotMail,
    verification
} = require("../../assets/html/verification");

const fetchUser =async(req,res)=>{
    try {
        const {_id}=req.query
        const user = await userModel.findOne({_id},{password : 0})
        if(!user){
            return res.status(400).json({errMsg:'User not found!'})
        }
        return res.status(200).json({result :user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ errMsg: 'Error registering user', error: error.message });
    }
}

const registerUser =async(req,res)=>{
    const { valid, errors } = validateRegister(req.body);
    
    if (!valid) {
        return res.status(400).json({ errMsg: 'Validation failed. Please review the provided input.', errors });
    }

    try {
        const {
            firstName,
            lastName,
            email,
            country,
            countryCode,
            mobile,
            dateOfBirth,
            password,
        } = req.body

        const isAlreadyRegistered = await userModel.findOne({email})
        if(isAlreadyRegistered){
            return res.status(400).json({ errMsg : "User already registered please login!" });
        }

        const hashpassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            first_name:firstName,
            last_name:lastName,
            email,
            country,
            country_code:countryCode,
            mobile,
            password:hashpassword,
            date_of_birth:dateOfBirth,
        });
        await newUser.save();
        res.status(201).json({ msg: 'User registered successfully' });
      } catch (error) {
        res.status(500).json({ errMsg: 'Error registering user', error: error.message });
      }
}

const login =async(req,res)=>{
    try {
        const {email,password}=req.body
        const { valid, errors } = validateLogin(req.body);

        if (!valid) {
            return res.status(400).json({ errMsg: 'Validation failed. Please review the provided input.', errors });
        }

        const userData = await userModel.findOne({email}).lean();

        if(!userData){
            return res.status(400).json({ errMsg: 'User not found. Please register.', errors });
        } 

        const isMatch = await bcrypt.compare(password, userData.password);
        
        if(isMatch){
            const token = jwt.sign({ _id:userData._id ,role : 'user'}, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
            const { password, ...userWithoutPassword } = userData;
           return res.status(200).json({result : userWithoutPassword,token})
        }

        return res.status(400).json({ errMsg: 'Invalid password. Please try again.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}

const fetchManager =async(req,res)=>{
    try {
        const {id} = req.query
        console.log(req.query);
        
        const manager =  await managerModel.findOne({user_id : id },{password : 0})
        console.log("manager : ", manager);
        if(manager){
            return res.status(200).json({result : manager})
        }else{
            return res.status(200).json({errMsg : "Invalid id"})
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}

const fetchUserTransactions = async (req, res) => {
    try {
        const filters = req.query;
        
        // Convert filter values to lowercase
        const sanitizedFilters = {
            ...filters,
            status: filters.status?.toLowerCase(),
            type: filters.type?.toLowerCase()
        };

        // Parse created_at_from and created_at_to with end-of-day adjustment for created_at_to
        const createdAtFrom = sanitizedFilters.created_at_from ? new Date(sanitizedFilters.created_at_from) : null;
        const createdAtTo = sanitizedFilters.created_at_to 
            ? new Date(new Date(sanitizedFilters.created_at_to).setUTCHours(23, 59, 59, 999)) 
            : null;

        const pipeline = [
            {
                $match: {
                    
                    ...(createdAtFrom && createdAtTo && {
                        createdAt: {
                            $gte: createdAtFrom,
                            $lte: createdAtTo
                        }
                    }),
                    ...(sanitizedFilters.status !== 'null' && { status: sanitizedFilters.status }),
                    ...(sanitizedFilters.type !== 'null' && { type: sanitizedFilters.type })
                },
            },
            { $sort: { createdAt: -1 } }
        ];

        // console.log('Pipeline:', JSON.stringify(pipeline, null, 2));
        
        const data = await userTransactionModel.aggregate(pipeline)
        return res.status(200).json({ result: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
};

const { Resend } = require("resend");
const ticketModel = require('../../models/tickets');
const resend = new Resend(process.env.RESEND_SECRET_KEY);
const randomSixDigitNumber = Math.floor(100000 + Math.random() * 900000);

const handleEmailVerificationOtp=async(req,res)=>{
    try {
        const {action,user_id} = req.body
        console.log(req.body);
        const userData = await userModel.findOne({_id:user_id})
        const OTP = randomSixDigitNumber
        if(action=='send'){
            try {
                await resend.emails.send({
                  from: process.env.WEBSITE_MAIL,
                  to: userData.email,
                  subject:"Verify email",
                  html: verification(OTP,userData.first_name),
                });
            } catch (emailError) {
                console.error("Error sending email:", emailError);
                return res
                    .status(500)
                    .json({ errMsg: "Failed to send verification email." });
            }
           return res.status(200).json({OTP,success: true,msg: "Otp sent successfully" });
        } else if(action=='verify'){
            const updatedUser = await userModel.findOneAndUpdate(
                {_id : user_id},
                { 
                    $set : {is_email_verified : true },
                    $inc : {kyc_step : 1}
            },
            {new : true}
            ) 
            return res.status(200).json({result : updatedUser, success: true, msg: "Email successfully verified." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}

const handleKycProofSubmit=async(req,res)=>{
    try {
        console.log(req.body);
        const { type,identityProofUrls,residentialProofUrl,user_id } = req.body
        if (type === "identity") {
            const updatedUser = await userModel.findOneAndUpdate(
                { _id: user_id },
                {
                    $set: {
                        identify_proof: identityProofUrls,
                        identify_proof_status: "submitted"
                    },
                    $inc: { kyc_step: 1 }
                },
                { new: true }
            );
            return res.status(200).json({ result: updatedUser });
        } else if(type==="residential"){
            const updatedUser =await userModel.findOneAndUpdate(
                    { _id: user_id},
                    {
                        $set: {
                            residential_proof: residentialProofUrl,
                            residential_proof_status: "submitted"
                        },
                        $inc: { kyc_step: 1 }
                    },
                    {new  : true}
            )
            return res.status(200).json({result : updatedUser});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}

const submitTicket=async(req,res)=>{
    try {
    
        console.log("ssssssssssss",req.files); 
        console.log(req.body);

        const { category, describe, user_id } = req.body;

        const user = userModel.findOne({_id:user_id})
        if(!user){
            return res.status(400).json({errMsg : "User not found!"})
        }
        const uploadedFiles = req.files.map((file) => file.path);

        const ticketData = {
            user_id,
            category,
            describe,
            upload: uploadedFiles, // Array of Cloudinary URLs
        };

        const ticket = await ticketModel.create(ticketData);

        res.status(201).json({ success: true, ticket ,msg :"Ticket submitted successfully"});
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}

const fetchTickets = async(req,res)=>{
    try {
        const { user_id} = req.query
        const myTickets = await ticketModel.find({user_id})
        return res.status(200).json({result : myTickets});
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}

const fetchRebateTransactions=async(req,res)=>{
    try {
        const _id =new mongoose.Types.ObjectId(req.decodedUser._id);
        
        const data = await rebateTransactionModel.find({user : _id})
        console.log(data);
        
        return res.status(200).json({result : data})
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}

const fetchManagerOrderHistory=async(req,res)=>{
    try {
        const {_id} = req.query
        const trades = await managerTradeModel.find({manager : _id,is_distributed:true})
        res.status(200).json({result : trades})
    } catch (error) {
        res.status(500).json({errMsg : 'sever side error'})
    }
}

module.exports = {
    fetchUser,
    registerUser,
    login,
    fetchManager,
    fetchUserTransactions,
    handleEmailVerificationOtp,
    handleKycProofSubmit,
    submitTicket,
    fetchTickets,
    fetchRebateTransactions,
    fetchManagerOrderHistory
}