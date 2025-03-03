const investmentModel = require('../../models/investment')
const managerModel = require('../../models/manager')
const jwt = require("jsonwebtoken");
const {fetchAndUseLatestRollover} = require('../rolloverController')

const getManagerData=async(req,res)=>{
    try {
        const {_id} = req.query
        const manager = await managerModel.findById({_id},{
            password:0,
            my_investments:0,
            trade_history:0,
            growth_data:0,
            _v: 0
        })
        const latestRollover = await fetchAndUseLatestRollover()
        res.status(200).json({result : manager,rollover : latestRollover})
    } catch (error) {
        res.status(500).json({errMsg : 'sever side error'})
    }
}

const fetchMyInvesters = async(req,res)=>{
    try {
        const { manager_id }=req.query
        console.log(req.query)
        
        const investments = await investmentModel
        .find({ manager: manager_id })
        .populate('user', 'email');

        return res.status(200).json({result : investments})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({errMsg : 'sever side error'})
    }
}

const login=async(req,res)=>{
    try {
        const { id,password } = req.body

        if (!id || !password ) {
            return res.status(400).json({ errMsg: 'Validation failed. Please review the provided input.', errors });
        }

        const managerData = await managerModel.findOne({manager_id : id}).lean();
        console.log('manager data:',managerData);
        
        if(!managerData){
            return res.status(400).json({ errMsg: 'Manager not found!' });
        } 

        const isMatch = password === managerData.password
        
        if(isMatch){
            const token = jwt.sign({ _id:managerData._id ,role : 'manager'}, process.env.JWT_SECRET_KEY_MANAGER, { expiresIn: '24h' });
            const { password, ...userWithoutPassword } = managerData;
            return res.status(200).json({token,result:userWithoutPassword})
        }

        return res.status(400).json({ errMsg: 'Invalid password. Please try again.' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({errMsg : 'sever side error'})
    }
}

module.exports = { 
    getManagerData,
    fetchMyInvesters,
    login
}