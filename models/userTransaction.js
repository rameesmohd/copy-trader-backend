const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'users' 
    },
    investment: { 
      type: Schema.Types.ObjectId, 
      ref: 'investments' 
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal','transfer', 'profit'],
      required: true,
    },
    amount: { 
      type: Number, 
      required: true 
    },
    description: String,
    createdAt: { 
      type: Date, 
      default: Date.now, 
      index: true 
    },
    },
    {
        timestamps: true,
    }
);

transactionSchema.index({ user: 1 });
transactionSchema.index({ investment: 1 });
transactionSchema.index({ type: 1 });
  
const userTransactionModel = mongoose.model('user_transactions', transactionSchema);
module.exports = userTransactionModel;