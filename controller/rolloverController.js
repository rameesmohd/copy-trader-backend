const investmentTransactionModel = require("../models/investmentTransaction");
const rolloverModel = require('../models/rollover')
const { approveDepositTransaction,approveWithdrawalTransaction } = require('../controller/investmentController')
const { rollOverTradeDistribution } = require('../controller/tradeController')

const fetchAndUseLatestRollover = async () => {
    const latestPendingRollover = await rolloverModel.findOne({ status: "completed" }).sort({ start_time: -1 });
    if (!latestPendingRollover) {
      console.log("No rollovers found!");
      return;
    }
    console.log("Latest Rollover ID:", latestPendingRollover._id);
    return latestPendingRollover
};

const fetchAndApprovePendingInvestmentTransactions = async (rollover_id) => {
    try {
      const pendingDepositTransactions = await investmentTransactionModel.find({
        status: "pending",
        type: "deposit",
      });
  
      const pendingWithdrawTransactions = await investmentTransactionModel.find({
        status: "pending",
        type: "withdrawal",
      });
  
      await rollOverTradeDistribution(rollover_id);
  
      const depositPromises = pendingDepositTransactions.map((transaction) =>
        approveDepositTransaction(transaction._id, rollover_id)
      );
  
      const withdrawPromises = pendingWithdrawTransactions.map((transaction) =>
        approveWithdrawalTransaction(transaction._id, rollover_id)
      );
  
      const results = await Promise.allSettled([
        ...depositPromises,
        ...withdrawPromises,
      ]);
  
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Transaction ${index + 1} failed:`,
            result.reason.message || result.reason
          );
        }
      });
  
      console.log("All pending transactions processed.");
    } catch (error) {
      console.error("Error processing investment transactions:", error);
    }
  };
  
module.exports = {
    fetchAndApprovePendingInvestmentTransactions,
    fetchAndUseLatestRollover
}