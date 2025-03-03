const mongoose = require("mongoose");
const { Schema } = mongoose;

const masterSchema = new Schema({
    id: { 
      type: String, 
    },
    password: { 
      type: String, 
    }
  },
  {
    timestamps: true,
  }
);
  
const masterModel = mongoose.model('master', masterSchema);
module.exports = masterModel;