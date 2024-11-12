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
  },
  password: {
    type: String,
    required: true,
  },
  user_id : {
    type : String,
    unique : true,
    default: () => Math.random().toString(36).substring(2, 10).toUpperCase() 
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
  kyc_Step : {
    type: Number,
    default: 0,
    min: 0,
    max: 3, // assuming there are three steps in the KYC process
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value for KYC step",
    },
  },
  identify_proof: {
    type: String,
    default: null,
    validate: {
      validator: (v) => !v || v.match(/\.(jpg|jpeg|png|pdf)$/i), // assumes a URL or filename with an extension
      message: "Identity proof must be a valid image or PDF file",
    },
  },
  identify_proof_status : {
    type: String,
    enum: ["submitted", "verified", "unavailable"],
    default: "unavailable",
  },
  residential_proof: {
    type: String,
    default: null,
    validate: {
      validator: (v) => !v || v.match(/\.(jpg|jpeg|png|pdf)$/i),
      message: "Residential proof must be a valid image or PDF file",
    },
  },
  residential_proof_status : {
    type: String,
    enum: ["submitted", "verified", "unavailable"],
    default: "unavailable",
  },
  my_wallets: {
    main_wallet_id : {
      type: String,
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase() 
    },
    main_wallet: {
      type : Number,
      default : 0.00,
      set: twoDecimalPlaces
    },
    earned_profit : {
      type : Number,
      default : 0.00,
      set: twoDecimalPlaces
    },
    rebate_wallet_id : {
      type: String,
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase() 
    },
    rebate_wallet: {
      type : Number,
      default : 0.00,
      set: twoDecimalPlaces
    },
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
