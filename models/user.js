const mongoose = require("mongoose");
const { Schema } = mongoose;

const twoDecimalPlaces = (value) => {
  return parseFloat(value).toFixed(2);
};

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    index : true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
  },
  user_id : {
    type : String,
    unique : true,
    index : true 
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
  },
  country : {
    type: String,
  },
  country_code : {
    type: String,
  },
  date_of_birth :{
    type : Date
  },
  is_email_verified: {
    type: Boolean,
    default: false,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  is_kyc_verified : {
    type: Boolean,
    default: false,
  },
  kyc_step : {
    type: Number,
    default: 0,
    min: 0,
    max: 4, // assuming there are three steps in the KYC process
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value for KYC step",
    },
  },
  identify_proof: {
    type: [String],  
    default: null,
    validate: [
      {
        validator: (arr) => !arr || arr.every(url => /\.(jpg|jpeg|png|pdf)$/i.test(url)),
        message: "Residential proof must be a valid image or PDF file",
      },
      {
        validator: (arr) => !arr || arr.length <= 3,
        message: "You can upload a maximum of 3 files for residential proof",
      }
    ],
  },
  identify_proof_status : {
    type: String,
    enum: ["submitted", "verified", "unavailable"],
    default: "unavailable",
  },
  residential_proof: {
    type: [String],  
    default: null,
    validate: [
      {
        validator: (arr) => !arr || arr.every(url => /\.(jpg|jpeg|png|pdf)$/i.test(url)),
        message: "Residential proof must be a valid image or PDF file",
      },
      {
        validator: (arr) => !arr || arr.length <= 3,
        message: "You can upload a maximum of 3 files for residential proof",
      }
    ],
  },
  residential_proof_status : {
    type: String,
    enum: ["submitted", "verified", "unavailable"], 
    default: "unavailable",
  },
  my_wallets: {
    main_wallet_id : {
      type: String,
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase(),
      unique: true, 
    },
    main_wallet: {
      type : Number,
      default : 0,
      set: twoDecimalPlaces,
      min: 0
    },
    rebate_wallet_id : {
      type: String,
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase(),
      index: true,
      unique: true
    },
    rebate_wallet: {
      type : Number,
      default : 0,
      set: twoDecimalPlaces,
      min: 0
    },
  },
  referral : {
    total_earned_commission : {
      type : Number,
      default : 0,
      set: twoDecimalPlaces,
      min: 0
    },
    total_referrals : {
      type : Number,
      default : 0,
      min: 0
    },
    referred_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "users",
      default: null 
    },
    referrals: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "users" }
    ],
    investments: [
      {
        investment_id : { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "investments" },
        rebate_recieved : {
          type : Number,
          default : 0,
          set: twoDecimalPlaces,
        }
      }
    ]
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
const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
