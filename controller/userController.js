const {validateLogin,validateRegister} = require('./validations/validations');
const userModel = require('../models/user')
const managerModel = require('../models/manager');
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");


const fetchUser =async(req,res)=>{
    try {
        const {_id}=req.query
        const user = await userModel.findOne({_id})
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
            date_of_birth:dateOfBirth
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
            const token = jwt.sign({ _id:userData._id }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
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
        return res.status(200).json({result : manager})
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}



module.exports = {
    fetchUser,
    registerUser,
    login,
    fetchManager,
}