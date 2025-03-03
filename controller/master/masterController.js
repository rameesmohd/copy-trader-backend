const userModel = require('../../models/user')
const managerModel = require('../../models/manager')
const depositModel = require('../../models/deposit')
const withdrawModel = require('../../models/withdrawal')
const jwt = require("jsonwebtoken");

const fetchUser =async(req,res)=>{
    try {
        const result =  await userModel.find({},{password : 0})
        console.log(result);
        
        return res.status(200).json({result :result})
    } catch (error) {
        res.status(500).json({ errMsg: 'Error fetching users' });
    }
}

const addManager=async(req,res)=>{
    try {
        const newManager =  new managerModel(req.body)  
        await newManager.save()  
        res.status(201).json({ msg: 'Manager added successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Error adding Manager,please try again' ,error : error.message})
    }
}

const fetchManagers=async(req,res)=>{
    try {
        const Managers =  await managerModel.find({},{growth_data:0,})
        return res.status(200).json({result : Managers})
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Error adding Manager,please try again' ,error : error.message})
    }
}

const updateManager = async (req, res) => {
    try {
      const { _id, ...updates } = req.body; // Extract ID and fields to update
      const Manager = await managerModel.findOneAndUpdate(
        { _id }, 
        { $set: updates },  
        { new: true }       
      );
  
      if (!Manager) {
        return res.status(404).json({ errMsg: 'Manager not found' });
      }
  
      return res.status(200).json({ result: Manager ,msg : "Manager data updated successfully."});
    } catch (error) {
      console.error(error);
      res.status(500).json({ errMsg: 'Error updating Manager, please try again', error: error.message });
    }
};

const masterLogin=(req,res)=>{
    try {
        const { id,password } = req.body
        console.log(req.body);
        
        if (!id || !password ) {
            return res.status(400).json({ errMsg: 'Validation failed. Please review the provided input.', errors });
        }

        const  real_id = '123456'    
        const pass = '12345678'

        if(id=== real_id && password == pass){
            const token = jwt.sign({ _id:id ,role : 'master'}, process.env.JWT_SECRET_KEY_MASTER, { expiresIn: '24h' });
            return res.status(200).json({token})
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Error while login to master, please try again', error: error.message });
    }
}


const fetchDeposits=async(req,res)=>{
    try {
        const deposits =  await depositModel.find({})
        res.status(200).json({result : deposits})
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Error fetching deposits, please try again', error: error.message });
    }
}
  
const fetchWithdrawals=async(req,res)=>{
    try {
        const withdrawals =  await withdrawModel.find({})
        res.status(200).json({result : withdrawals})
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Error fetching deposits, please try again', error: error.message });
    }
}
  
module.exports = {
    fetchUser,
    addManager,
    fetchManagers,
    updateManager,
    masterLogin,
    fetchDeposits,
    fetchWithdrawals
}