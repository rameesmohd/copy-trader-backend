const mongoose = require("mongoose");
const { Schema } = mongoose;

// Helper function to calculate the unlocked date considering only trading days (weekdays)
function calculateUnlockedDate(startDate, lockDuration) {
    let unlockedDate = new Date(startDate);
    let daysAdded = 0;
  
    while (daysAdded < lockDuration) {
      // Increment the date by 1 day
      unlockedDate.setDate(unlockedDate.getDate() + 1);
  
      // Check if it's a weekday (Monday to Friday)
      const dayOfWeek = unlockedDate.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }
    return unlockedDate;
}

const DepositSchema = new Schema({
  amount: { type: Number, required: true },
  deposited_at: { type: Date, default: Date.now }, // When the deposit was made
  lock_duration: { type: Number, required: true }, // Lock period in days
  unlocked_at: {
    type: Date,
    default: function () {
      return calculateUnlockedDate(this.deposited_at, this.lock_duration);
    },
  },
});

const investmentSchema = new mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'users' },
    manager: { type: Schema.Types.ObjectId, ref: 'managers' },
    manager_nickname: { type: String, required: true },
    total_funds: { type: Number, required: true }, // Total active funds
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'active' },
    trading_interval: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    min_initial_investment: { type: Number, required: true },
    min_top_up: { type: Number, required: true },
    min_withdrawal : { type : Number ,required : true },
    
    deposits: [DepositSchema], 

    open_trade_profit: { type: Number, default: 0.0 },
    closed_trade_profit: { type: Number, default: 0.0 },
    current_interval_profit: { type: Number, default: 0.0 },
    net_profit: { type: Number, default: 0.0 },

    total_deposit: { type: Number, default: 0.0 }, // Sum of all deposits
    total_withdrawal: { type: Number, default: 0 },

    total_trade_profit: { type: Number, default: 0 },
    manager_performance_fee: { type: String, required: true },
    performance_fee_paid: { type: Number, default: 0 },
    performance_fee_projected: { type: Number, default: 0 },
    trading_liquidity_period: { type: Number, required: true },
  },
  { timestamps: true }
);

const investmentModel = mongoose.model("investments", investmentSchema);
module.exports = investmentModel;
