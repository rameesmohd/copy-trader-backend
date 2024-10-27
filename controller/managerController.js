const managerModel = require('../models/manager')

const getManagerData=async(req,res)=>{
    try {
        const {user_id} = req.query

        const manager = await managerModel.findOne({user_id},{password:0})
        
        res.status(200).json({result : manager})
    } catch (error) {
        res.status(500).json({errMsg : 'sever side error'})
    }
}

module.exports = { 
    getManagerData
}