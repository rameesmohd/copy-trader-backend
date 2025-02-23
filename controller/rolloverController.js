const investmentTransactionModel = require("../models/investmentTransaction");
const rolloverModel = require('../models/rollover')
const { approveDepositTransaction,approveWithdrawalTransaction } = require('../controller/investmentController')
const { rollOverTradeDistribution } = require('../controller/tradeController')

const getLatestPendingRollover = async () => {
    const latestRollover = await rolloverModel.findOne({ status: "completed" }).sort({ start_time: -1 });
    console.log(latestRollover);
    
    return latestRollover;
};

const fetchAndUseLatestRollover = async () => {
    const latestPendingRollover = await getLatestPendingRollover();
    if (!latestPendingRollover) {
      console.log("No rollovers found!");
      return;
    }
    console.log("Latest Rollover ID:", latestPendingRollover._id);
    return latestPendingRollover
};

const fetchAndApprovePendingInvestmentTransactions=async(rollover_id)=>{
    const pendingDepositTransactions = await investmentTransactionModel.find({ status: "pending",type : "deposit" })
    const pendingWithdrawTransactions = await investmentTransactionModel.find({ status: "pending",type : "withdrawal" })

    for (let transaction of pendingDepositTransactions) {
        await approveDepositTransaction(transaction._id,rollover_id)
    }
 
    for (let transaction of pendingWithdrawTransactions) {
        await approveWithdrawalTransaction(transaction._id,rollover_id)
    }

    await rollOverTradeDistribution(rollover_id)
}


module.exports = {
    fetchAndApprovePendingInvestmentTransactions,
    fetchAndUseLatestRollover
}