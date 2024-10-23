const {validateLogin,validateRegister} = require('./validations/validations');
const userModel = require('../models/user')
const managerModel = require('../models/manager');
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const investmentModel = require('../models/investment');
const userTransactionModel = require('../models/userTransaction')
const investmentTransactionModel = require('../models/investmentTransaction');


const fetchUser =()=>{

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
        
        const manager =  await managerModel.findOne({_id : id },{password : 0})
        console.log("manager : ", manager);
        return res.status(200).json({result : manager})
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}

const makeDeposit =async(req,res)=>{
    try {
        const {userId,managerId,amount,referralCode} = req.body
        console.log(req.query);
        const user = await userModel.findById(userId);
        const manager = await managerModel.findById(managerId);

        if (amount > user.my_wallets.main_wallet) {
            return res.status(400).json({errMsg : 'Insufficient balance. Please deposit more funds.'});
        }
        if (amount < manager.min_initial_investment) {
            return res.status(400).json({errMsg : `Minimum investment is ${manager.min_initial_investment} USD.`});
        }

        // Deduct amount from user's main wallet
        user.my_wallets.main_wallet -= amount;

        // Create a new investment record
        const newInvestment = new investmentModel({
            user: user._id,
            manager: manager._id,
            total_funds : amount,
            trading_interval : manager.trading_inverval,
            investment_duration : manager?.investment_locking_duration,
        });
        
        await newInvestment.save();
        user.my_investments.push(newInvestment._id);

        manager.my_investments.push(newInvestment._id);
        manager.total_funds +=amount

        await user.save();
        await manager.save();

        // Create the User Withdrawal Transaction (Main Wallet)
        const userTransaction = new userTransactionModel({
            user: user._id,
            investment: newInvestment._id,
            type: 'transfer',
            amount,
            description: `Transferred to investment with manager ${manager.nickname}.`,
        });
        await userTransaction.save();

        const investmentTransaction = new investmentTransactionModel({
            user: user._id,
            investment: newInvestment._id,
            type: 'deposit',
            amount,
            description: `Added to manager ${manager.nickname}'s portfolio.`,
          });
        await investmentTransaction.save();
        
        // Return the new investment document _id
        return res.status(201).json({
            result: newInvestment,
            investmentId: newInvestment._id, // Include _id in response
            msg: "Investment created successfully!",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}


const fetchMyInvestments =async(req,res)=>{
    try {
        const { id } = req.query
        const investments = await investmentModel
        .find({user : id})
        .populate({
            path: 'manager',      
            select: ['nickname','trading_interval'] 
        });

        if(!investments){
            return res.status(200).json({msg:"No investments yet!"})
        }

        return res.status(200).json({result : investments})
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Server error!', error: error.message });
    }
}


const fetchInvestment =async(req,res)=>{
    try {
        const { id } = req.query
        console.log(id);
        
        const investment = await investmentModel.findById(id)
        .populate({
            path: 'manager',      
            select: ['nickname','trading_interval'] 
        });
        
        if(!investment){
            return res.status(200).json({msg:"No investments yet!"})
        }

        console.log('investment :',investment);
        
        return res.status(200).json({result : investment})
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
    makeDeposit,
    fetchMyInvestments,
    fetchInvestment
}