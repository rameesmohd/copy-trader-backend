const mongoose = require("mongoose");
const { Schema } = mongoose;

const rebateTransactionSchema = new Schema({
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
      enum: ['commission', 'withdrawal','transfer'],
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
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase() 
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
  
const rebateTransactionModel = mongoose.model('rebate_transactions', rebateTransactionSchema);
module.exports = rebateTransactionModel;