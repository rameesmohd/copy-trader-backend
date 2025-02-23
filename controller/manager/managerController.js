const investmentModel = require('../../models/investment')
const managerModel = require('../../models/manager')
const {fetchAndUseLatestRollover} = require('../rolloverController')

const getManagerData=async(req,res)=>{
    try {
        const {user_id} = req.query
        const manager = await managerModel.findOne({user_id},{
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

module.exports = { 
    getManagerData,
    fetchMyInvesters
}