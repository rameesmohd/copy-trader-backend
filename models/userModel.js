const mongoose = require("mongoose");

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
  join_date: {
    type: Date,
    default: Date.now, 
  },
  identify_proof: {
    type: String,
  },
  residential_proof: {
    type: String,
  },
  my_investments :{
    type : Array,
    default : []
  },
  main_wallet: {
    locked : {
        type : Number,
        default : 0
    },
    unlocked : {
        type : Number,
        default : 0
    },
    earned_profit : {
        type : Number,
        default : 0
    }
  },
});

// Create the model
const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
