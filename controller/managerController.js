const managerModel = require('../models/manager')

const getManagerData=async(req,res)=>{
    try {
        const {username} = req.query

        const manager = await managerModel.findOne({username})
        
        res.status(200).json({result : manager})
    } catch (error) {
        res.status(500).json({errMsg : 'sever side error'})
    }
}

module.exports = { 
    getManagerData
}