const mongoose = require("mongoose");
const { Schema } = mongoose;

const forgetPasswordSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'users', 
      index: true 
    },
    otp: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
      index: { expires: '10m' } // Auto-delete document after 10 minutes
    }
  },
  {
    timestamps: true,
  }
);

const forgetPasswordModel = mongoose.model('forget_passwords', forgetPasswordSchema);
module.exports = forgetPasswordModel;
