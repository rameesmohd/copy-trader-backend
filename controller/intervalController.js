const managerModel = require('../models/manager');
const investmentModel = require('../models/investment');
const investmentTransactionModel = require('../models/investmentTransaction');
const userModel = require('../models/user')
const rebateTransactionModel = require('../models/rebateTransaction')

const intervalInvestmentHandle = async (req, res) => {
    try {
        // Fetch all managers
        const managers = await managerModel.find({trading_interval:'weekly'});

        // Process each manager
        for (const manager of managers) {
            // Fetch all investments for the manager
            const investments = await investmentModel.find({ manager: manager._id });

            for (const investment of investments) {
                // Calculate the amount to be added to total funds
                const netIntervalProfit = investment.current_interval_profit_equity - investment.performance_fee_projected;

                // Update investment's total funds and net profit
                investment.total_funds += netIntervalProfit;
                investment.net_profit += netIntervalProfit;

                // Update manager's performance fee and investment's fee tracking
                let adjustedPerformanceFee =investment.performance_fee_projected

                if (investment.inviter) {
                    const inviter = await userModel.findOne({ user_id: investment.inviter });
                    if (inviter && investment.performance_fee_projected > 0) {
                        // Calculate inviter's share (5% of total profit)
                        const inviterShare = investment.current_interval_profit_equity * 0.05;
                
                        // Update inviter's wallets and commission tracking
                        inviter.my_wallets.rebate_wallet += inviterShare;
                        inviter.referral.total_earned_commission += inviterShare;
                        await inviter.save();

                        const rebateTransaction = new rebateTransactionModel({
                            user : inviter._id,
                            investment : investment._id,
                            type : 'commission',
                            status : 'approved',
                            amount : inviterShare , 
                            description : `Weekly commission distribution.`,
                        })
                        await rebateTransaction.save()
                        
                        // Adjust the performance fee by deducting the inviter's share
                        adjustedPerformanceFee = Math.max(0, investment.performance_fee_projected - inviterShare);
                    }
                }
                
                manager.total_performance_fee_collected += adjustedPerformanceFee;
                investment.performance_fee_paid += investment.performance_fee_projected;

                // Reset performance fee projections and profits
                investment.performance_fee_projected = 0;
                investment.current_interval_profit_equity = 0;
                investment.current_interval_profit = 0;

                // Create a performance fee deduction transaction
                const feeTransaction = new investmentTransactionModel({
                    user: investment.user,
                    investment: investment._id,
                    type: 'manager_fee',
                    status: 'success',
                    amount: investment.performance_fee_paid, // Use correct value
                    comment: `Performance fee of ${investment.performance_fee_paid} deducted`,
                });

                // Save investment and fee transaction
                await investment.save();
                await feeTransaction.save();

                console.log(`Handled current interval profit of ${netIntervalProfit} for investment ${investment._id}`);
            }

            // Save the manager with updated performance fee
            await manager.save();
        }

        res.status(200).json({ message: 'Interval investment handling completed successfully' });
    } catch (error) {
        console.error('Error in interval investment handling:', error);
        res.status(500).json({ errMsg: 'Server side error', error: error.message });
    }
};


  
module.exports = {
    intervalInvestmentHandle,
};
