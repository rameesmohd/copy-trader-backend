const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'users', 
      index: true 
    },
    investment: { 
      type: Schema.Types.ObjectId, 
      ref: 'investments', 
      index: true 
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal','transfer', 'profit'],
      required: true,
      index: true 
    },
    payment_mode : {
      type : String,
      enum : ['main wallet' ,'usdt','usdt-trc20','usdt-bep20','usdt-erc20']
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    description: {
      type : String,
      required : false
    },
    transaction_id: { 
      type: String, 
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase() 
    },
    related_transaction: {
      type: Schema.Types.ObjectId,
      refPath: 'transaction_type' // This tells Mongoose to use the value in `transaction_type` to decide the ref
    },
    transaction_type: {
      type: String,
      enum: ['investment_transactions', 'deposits','withdrawals'],
      required: true
    },
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
  
const userTransactionModel = mongoose.model('user_transactions', transactionSchema);
module.exports = userTransactionModel;