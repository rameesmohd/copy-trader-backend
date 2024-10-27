const investmentModel = require('../models/investment');
const investorTradeModel = require('../models/investorTrades');
const managerModel = require('../models/manager')
const managerTradeModel = require('../models/managerTrades')
const { ObjectId } = require('mongoose').Types;


const addTradeToManager=async(req,res)=>{
    try {
        const { formData , manager_id } = req.body
        const {
            close_price,
            close_time,
            manager_profit,
            manager_volume,
            open_price,
            open_time,
            symbol,
            type,
            swap    
        } = formData

        const newTrade =new managerTradeModel({
            manager : manager_id,
            symbol,
            manager_volume,
            type,
            open_price,
            close_price,
            swap,
            open_time,
            close_time,
            manager_profit
        })
        
        await newTrade.save()
        res.status(200).json({result : newTrade})
    } catch (error) {
        console.log(error);
        res.status(500).json({errMsg : 'sever side error'})
    }
}


const getTrades=async(req,res)=>{
    try {
        const {_id,distributed} = req.query
        // Validate _id
        if (!ObjectId.isValid(_id)) {
            return res.status(400).json({ errMsg: 'Invalid manager ID' });
        }

        // Query trades based on distribution status
        const tradeData = await managerTradeModel.find({
            manager: _id,
            is_distributed: distributed === 'true', // Convert query parameter to boolean
        });

        // // If no trades found, send a 404 response
        // if (tradeData.length === 0) {
        //     return res.status(404).json({ errMsg: 'No trades found' });
        // }

        res.status(200).json({result : tradeData})
    } catch (error) {
        console.log(error);
        res.status(500).json({errMsg : 'sever side error'})
    }
}

const rollOverTradeDistribution = async (req, res) => {
    try {
        // Fetch undistributed trades
        const unDistributedTrades = await managerTradeModel.find({ is_distributed: false });

        // Process each trade asynchronously
        for (const trade of unDistributedTrades) {
            const tradeProfit = trade.manager_profit; // Already a number

            const manager = await managerModel.findOne({ _id: trade.manager });

            // Update manager's profits directly (assuming they have default 0 in schema)
            manager.closed_trade_profit += tradeProfit;
            manager.total_trade_profit += tradeProfit;

            // Fetch all investments for the manager
            const investments = await investmentModel.find({ manager: manager._id });

            // Calculate total funds
            const totalFunds = investments.reduce((sum, inv) => sum + inv.total_funds, 0);

            if (totalFunds === 0) {
                console.warn(`Manager ${manager._id} has no funds to distribute.`);
                continue; // Skip if no funds to distribute
            }

            // Distribute the profit proportionally to each investment
            for (const investment of investments) {
                const investorProfit = (investment.total_funds / totalFunds) * tradeProfit;

                // Update investment profits
                investment.current_interval_profit += investorProfit;
                investment.current_interval_profit_equity += investorProfit;
                investment.total_trade_profit += investorProfit;

                // Calculate performance fee and update net profit
                const performanceFee = (investorProfit * investment.manager_performance_fee) / 100;
                investment.performance_fee_projected += performanceFee;
                
                // Mark the trade as distributed
                trade.is_distributed = true;
                await trade.save(); // Save the trade update
                
                const investorTradeHistory = new investorTradeModel({
                    manager : manager._id,
                    manager_trade : trade._id,
                    symbol : trade.symbol,
                    manager_volume : trade.manager_volume,
                    open_price : trade.open_price,
                    close_price : trade.close_price,
                    swap : trade.swap,
                    open_time: trade.open_time,
                    close_time : trade.close_time,
                    manager_profit : trade.manager_profit,
                    investor_profit : investorProfit
                })
                await investorTradeHistory.save()
                await investment.save(); // Save each investment update
            }
            
            // Save manager updates
            await manager.save();
        }

        res.status(200).json({ msg: 'Profit distributed successfully' });
    } catch (error) {
        console.error('Error in distribution:', error);
        res.status(500).json({ errMsg: 'Server side error', error: error.message });
    }
};



module.exports = { 
    addTradeToManager,
    getTrades,
    rollOverTradeDistribution
}