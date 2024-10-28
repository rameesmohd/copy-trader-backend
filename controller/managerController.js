const managerModel = require('../models/manager')
const managerTradeModel = require('../models/managerTrades')

const getManagerData=async(req,res)=>{
    try {
        const {user_id} = req.query

        const manager = await managerModel.findOne({user_id},{password:0})
        
        res.status(200).json({result : manager})
    } catch (error) {
        res.status(500).json({errMsg : 'sever side error'})
    }
}

const fetchOrderHistory=async(req,res)=>{
    try {
        const {_id} = req.query
        const trades = await managerTradeModel.find({manager : _id,is_distributed:true})
        res.status(200).json({result : trades})
    } catch (error) {
        res.status(500).json({errMsg : 'sever side error'})
    }
}

module.exports = { 
    getManagerData,
    fetchOrderHistory
}