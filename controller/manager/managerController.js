const investmentModel = require('../../models/investment')
const managerModel = require('../../models/manager')

const getManagerData=async(req,res)=>{
    try {
        const {user_id} = req.query
        const manager = await managerModel.findOne({user_id},{password:0})
        res.status(200).json({result : manager})
    } catch (error) {
        res.status(500).json({errMsg : 'sever side error'})
    }
}

const fetchMyInvesters = async(req,res)=>{
    try {
        const { manager_id }=req.query
        console.log(req.query)
        
        const investments = await investmentModel.find({manager:manager_id})
        res.status(200).json({result : investments})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({errMsg : 'sever side error'})
    }
}

module.exports = { 
    getManagerData,
    fetchMyInvesters
}