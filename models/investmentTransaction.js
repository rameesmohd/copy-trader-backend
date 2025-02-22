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
      manager : {
        type: Schema.Types.ObjectId, 
        ref: 'managers',
        index : true 
      },
      type: {
        type: String,
        enum: ['deposit', 'withdrawal','manager_fee'],
        required: true,
        index: true 
      },
      from : {
        type : String,
      },
      to : {
        type : String
      },
      status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected','success','confirmed'], 
        default: 'pending' 
      },
      amount: { 
        type: Number, 
        required: true 
      },
      comment: {
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
        ref: 'user_transactions' 
      },
      deduction : {
        type : Number,
        default : 0
      },
      is_deducted : {
        type : Boolean,
        default : false
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

transactionSchema.index({ user: 1 });
transactionSchema.index({ investment: 1 });
transactionSchema.index({ type: 1 });
  
const investmentTransactionModel = mongoose.model('investment_transactions', transactionSchema);
module.exports = investmentTransactionModel;