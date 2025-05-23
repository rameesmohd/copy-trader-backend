const mongoose = require("mongoose");
const { Schema } = mongoose;

const truncateToTwoDecimals = (num) => {
  return Math.floor(num * 100) / 100;
};

const managerSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  manager_id : {
    type : String,
    unique : true,
    default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    required: true
  },
  img_url:{
    type : String,
    default : 'https://api.dicebear.com/7.x/miniavs/svg?seed=8'
  },
  password: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
    enum : ["mt4","mt5"]
  },
  account_type: {
    type: String,
    required: true,
    enum : ["standard","raw"]
  },
  performance_fees_percentage: {
    type: Number,
    required: true,
  },
  security_deposit : {
    type: Number,
    required: true,
  },
  trading_interval : {
    type: String,
    enum : ["weekly","daily","monthly"],
    required: true,
  },
  description : {
    type : String,
    required: true
  },
  open_trade_profit: {
    type: Number,
    required: true,
    set : truncateToTwoDecimals
  },
  closed_trade_profit: {
    type: Number,
    required: true,
    set : truncateToTwoDecimals
  },
  origin: {
    type: String,
  },
  joined_at : {
    type: Date,
    default: Date.now, 
  },
  total_trade_profit: {
    type: Number,
    required: true,
    set : truncateToTwoDecimals
  },
  min_initial_investment: {
    type: Number,
    required: true,
  },
  min_top_up: {
    type: Number,
    required: true,
  },
  min_withdrawal: {
    type: Number,
    required: true,
  },
  referral : {
    type: Number,
    required: true,
  }, 
  total_funds: {
    type: Number,
    required: true,
    set : truncateToTwoDecimals
  },
  risks :{
    type : Number,
    min: [1, 'Risk must be at least 1'],
    max: [10, 'Risk cannot exceed 10'],
    required: true,
  },
  compound :{
    type : Number,
    required: true
  },
  total_return :{
    type : Number,
    required: true,
  },
  growth_data :{
    type : Array
  },
  total_investors : {
    type : Number,
    default : 0
  },
  win_rate : {
    type : Number,
    required: true,
  },
  leverage : {
    type : String,
    enum : [ "1:50","1:100","1:200","1:500","1:1000" ],
    required: true,
  },
  max_drawdown : {
    type : Number,
    required : true
  },
  trading_liquidity_period : {
    type : Number,
    default : 30
  },
  total_performance_fee_collected: {
    type: Number,
    default : 0,
    set : truncateToTwoDecimals
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

// Create the model
const managerModel = mongoose.model("managers", managerSchema);

module.exports = managerModel;
