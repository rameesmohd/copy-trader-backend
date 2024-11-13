const mongoose = require("mongoose");
const { Schema } = mongoose;

const kycRequestSchema = new Schema({
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'users', 
      index: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending',
      index : true 
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
  
const kycRequestModel = mongoose.model('kyc_requests', kycRequestSchema);
module.exports = kycRequestModel;