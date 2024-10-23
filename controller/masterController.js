const userModel = require('../models/user')
const managerModel = require('../models/manager')

const fetchUser =async(req,res)=>{
    try {
        const result =  await userModel.find({},{password : 0})
        console.log(result);
        
        return res.status(200).json({result :result})
    } catch (error) {
        res.status(500).json({ errMsg: 'Error fetching users' });
    }
}

const addProvider=async(req,res)=>{
    try {
        console.log(req.body);
        // {
        //     username: 'Shahin',
        //     nickname: 'sdsdf',
        //     platform: 'mt4',
        //     account_type: 'raw',
        //     trading_interval: 'daily',
        //     leverage: '1:500',
        //     performance_fees_percentage: '3',
        //     security_deposit: '3333',
        //     joined_at: '2024-10-22T18:30:00.000Z',
        //     description: 'dfvdfgvdfg',
        //     open_trade_profit: '4',
        //     closed_trade_profit: '4',
        //     total_trade_profit: '4',
        //     total_funds: '4',
        //     risks: '4',
        //     compound: '4',
        //     return: '4',
        //     total_investors: '4',
        //     win_rate: '4'
        //   }
        const newProvider =  new managerModel(req.body)  
        await newProvider.save()  
        res.status(201).json({ msg: 'Provider added successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Error adding provider,please try again' ,error : error.message})
    }
}

const fetchProviders=async(req,res)=>{
    try {
        const providers =  await managerModel.find({})
        return res.status(200).json({result : providers})
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Error adding provider,please try again' ,error : error.message})
    }
}

const updateProvider = async (req, res) => {
    try {
      const { _id, ...updates } = req.body; // Extract ID and fields to update
      const provider = await managerModel.findOneAndUpdate(
        { _id }, 
        { $set: updates },  
        { new: true }       
      );
  
      if (!provider) {
        return res.status(404).json({ errMsg: 'Provider not found' });
      }
  
      return res.status(200).json({ result: provider ,msg : "Provider data updated successfully."});
    } catch (error) {
      console.error(error);
      res.status(500).json({ errMsg: 'Error updating provider, please try again', error: error.message });
    }
};
  
module.exports = {
    fetchUser,
    addProvider,
    fetchProviders,
    updateProvider
}