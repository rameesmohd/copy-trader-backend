const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'users', 
        index: true 
    },
    mode : {
        type : String,
        enum : ['usdt-trc20'],
        required : true,
        index: true
    },
    dep_address : {
        type: String
    },
    pvt_key : {
        type: String
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal'],
        required: true,
        index: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending',
        index : true 
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
        default: () => Math.random().toString(36).substring(2, 10).toUpperCase(),
        index : true
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
  
const paymentsModel = mongoose.model('payments', paymentSchema);
module.exports = paymentsModel;