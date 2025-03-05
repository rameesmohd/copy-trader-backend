const mongoose = require("mongoose");
const { Schema } = mongoose;

const depositSchema = new Schema({
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'users', 
      index: true 
    },
    wallet_id: { 
      type: String, 
      index: true 
    },
    payment_mode : {
        type: String,
        enum : ["usdt-trc20","usdt-bep20"],
        required: true
    },
    crypto_txid : {
        type : String
    },
    payment_address : {
      type : String
    },
    private_key : {
      type : String
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending',
      index: true 
    },
    is_payment_recieved : {
      type: Boolean,
      default: false
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
  
const depositsModel = mongoose.model('deposits', depositSchema);
module.exports = depositsModel;