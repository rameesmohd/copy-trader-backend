const mongoose = require("mongoose");
const { Schema } = mongoose;

const twoDecimalPlaces = (value) => {
  return parseFloat(value).toFixed(2);
};

const investmentSchema = new mongoose.Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'users' 
    },
    manager: { 
        type: Schema.Types.ObjectId, 
        ref: 'managers' 
    },
    total_funds: { 
        type: Number, 
        required: true 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        default: 'active' 
    },
    trading_interval : {
        type : String,
        enum : ["daily","weekly","monthly"]
    },
    open_trade_profit : {
        type : Number,
        default : 0
    },
    closed_trade_profit : {
        type : Number,
        default : 0
    },
    current_interval_profit : {
        type : Number ,
         default : 0
    },
    net_profit : {
        type : Number,
        default : 0
    },
    total_deposit : {
        type : Number ,
        default : 0
    },
    total_withdrawal : {
        type : Number,
        default : 0
    },
    total_trade_profit : {
        type : Number,
        default : 0
    },
    performance_fee_paid : {
        type : Number,
        default : 0
    },
    performance_fee_projected : {
        type : Number , 
        default : 0
    },
    investment_duration : {
        type:Number,
        required : true
    },
    },
    {
        timestamps: true,
    }
);


const investmentModel = mongoose.model("investments", investmentSchema);

module.exports = investmentModel;
