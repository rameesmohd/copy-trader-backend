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
      unique: true, 
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase() 
    },
    related_transaction: { 
      type: Schema.Types.ObjectId, 
      ref: 'investment_transactions' 
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