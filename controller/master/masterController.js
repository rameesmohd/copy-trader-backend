const userModel = require('../../models/user')
const managerModel = require('../../models/manager')
const depositModel = require('../../models/deposit')
const withdrawModel = require('../../models/withdrawal')
const jwt = require("jsonwebtoken");
const userTransactionModel = require('../../models/userTransaction');
const { default: mongoose } = require('mongoose');
const {fetchAndUseLatestRollover} = require('../rolloverController')

const fetchUser =async(req,res)=>{
    try {
        const result =  await userModel.find({},{password : 0})
        console.log(result);
        const latestRollover = await fetchAndUseLatestRollover()
        return res.status(200).json({result :result,rollover : latestRollover})
    } catch (error) {
        res.status(500).json({ errMsg: 'Error fetching users' });
    }
}

const addManager=async(req,res)=>{
    try {
        const newManager =  new managerModel(req.body)  
        await newManager.save()  
        res.status(201).json({ msg: 'Manager added successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Error adding Manager,please try again' ,error : error.message})
    }
}

const fetchManagers=async(req,res)=>{
    try {
        const Managers =  await managerModel.find({},{growth_data:0,})
        return res.status(200).json({result : Managers})
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Error adding Manager,please try again' ,error : error.message})
    }
}

const updateManager = async (req, res) => {
    try {
      const { _id, ...updates } = req.body; // Extract ID and fields to update
      const Manager = await managerModel.findOneAndUpdate(
        { _id }, 
        { $set: updates },  
        { new: true }       
      );
  
      if (!Manager) {
        return res.status(404).json({ errMsg: 'Manager not found' });
      }
  
      return res.status(200).json({ result: Manager ,msg : "Manager data updated successfully."});
    } catch (error) {
      console.error(error);
      res.status(500).json({ errMsg: 'Error updating Manager, please try again', error: error.message });
    }
};

const masterLogin=(req,res)=>{
    try {
        const { id,password } = req.body
        console.log(req.body);
        
        if (!id || !password ) {
            return res.status(400).json({ errMsg: 'Validation failed. Please review the provided input.', errors });
        }

        const  real_id = process.env.MASTER_USERNAME
        const pass = process.env.MASTER_PASS

        if(id== real_id && password == pass){
            const token = jwt.sign({ _id:id ,role : 'master'}, process.env.JWT_SECRET_KEY_MASTER, { expiresIn: '24h' });
            return res.status(200).json({token})
        }
        return res.status(400).json({})
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Error while login to master, please try again', error: error.message });
    }
}


const fetchDeposits=async(req,res)=>{
    try {
        const deposits =  await depositModel.find({},{private_key : 0,payment_address:0}).populate({ path: "user", select: "email first_name last_name" });
        res.status(200).json({result : deposits})
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Error fetching deposits, please try again', error: error.message });
    }
}
  
const fetchWithdrawals=async(req,res)=>{
    try {
        const withdrawals =  await withdrawModel.find({})
        res.status(200).json({result : withdrawals})
    } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: 'Error fetching deposits, please try again', error: error.message });
    }
}

const getPendingKYCRequests = async (req, res) => {
    try {
      const pendingUsers = await userModel.find({ 
        // is_kyc_verified: false,  
        $or: [
          { identify_proof_status: "submitted" },
          { residential_proof_status: "submitted" },
          { residential_proof_status: "verified" },
          { identify_proof_status: "verified" },
        ]
      }).select("first_name user_id country is_email_verified last_name email is_email_verified is_kyc_verified identify_proof_status residential_proof_status identify_proof residential_proof createdAt");
      res.status(200).json({ success: true, result: pendingUsers });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching KYC requests", error });
    }
};

const approveKycDocs = async (req, res) => {
    try {
        const { role, record_id, status } = req.body;

        // Validate role first
        if (role !== 'identify_proof' && role !== 'residential_proof') {
            return res.status(400).json({ errMsg: "Invalid payloads!" });
        }

        const key = role === 'identify_proof' ? 'identify_proof_status' : 'residential_proof_status';
        console.log(req.body);
        
        if (status === 'verified') {
            await userModel.updateOne(
                { _id: record_id }, 
                { $set: { [key]: status } } // Wrapped in $set
            );
        }

        if (status === 'unavailable') {
            await userModel.updateOne(
                { _id: record_id }, 
                { 
                    $set: { [key]: status },
                    $inc: { kyc_step: -1 } // Correctly formatted
                }
            );
        }

        res.status(200).json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error approving KYC docs", error });
    }
};

const approveKyc = async (req, res) => {
    try {
        const { _id } = req.body;
        console.log(req.body);

        const user = await userModel.findById(_id); // Corrected findById

        if (!user) {
            return res.status(404).json({ errMsg: "User not found" });
        }
        
        if (user.is_email_verified && user.identify_proof_status === 'verified' && user.residential_proof_status === 'verified') {
            await userModel.findByIdAndUpdate(_id, { is_kyc_verified: true ,kyc_step: 4});

            return res.status(200).json({ msg: "Approved successfully" });
        }

        return res.status(400).json({ errMsg: "Not a valid KYC approval" });
        
    } catch (error) {
        res.status(500).json({ success: false, message: "Error approving KYC docs", error });
    }
};

const handleWithdraw = async (req, res) => {
    try {
        const { _id, status } = req.body;

        // Validate status
        if (status !== 'approved' && status !== 'rejected') {
            return res.status(400).json({ errMsg: "Invalid status value" });
        }

        const withdrawData = await withdrawModel.findOne({_id,status : 'pending'})

        if(!withdrawData){
           return res.status(400).json({ errMsg: "Data not found", error });
        }

        // Update withdrawal status
        await withdrawModel.updateOne({ _id:withdrawData._id }, { $set: { status } });
        await userTransactionModel.updateOne({related_transaction : withdrawData._id},{$set: { status }})
        if(status=='rejected'){
            await userModel.updateOne({_id:withdrawData.user},
                { $inc: { 'my_wallets.main_wallet': withdrawData.amount }}
            )
        }
        return res.status(200).json({ msg: `Withdrawal ${status} successfully` });
    } catch (error) {
        res.status(500).json({ errMsg: "Error approving withdrawal", error });
    }
};

const addToWallet = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { email, amount, comment,type,payment_mode } = req.body;
        console.log(req.body);

        if(!email || !amount || !comment || !type || !payment_mode){
            return res.status(400).json({ errMsg: "Invalid inputs!", error });
        }
        
        // Find the user within the transaction
        const user = await userModel.findOne({ email }).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ errMsg: "User not found!!" });
        }

        // Create new user transaction
        const newUserTransaction = new userTransactionModel({
            user: user._id,
            type,
            payment_mode,
            status: 'approved',
            amount: amount,
            transaction_type: 'deposits',
            description: comment || '',
        });

        await newUserTransaction.save({ session });

        // Update the user's wallet balance
        const walletUpdate = await userModel.findOneAndUpdate(
            { _id: user._id },
            { $inc: { 'my_wallets.main_wallet': amount } },
            { session }
        );

        if (!walletUpdate) {
            throw new Error("Failed to update wallet balance");
        }

        // Commit transaction if everything is successful
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ msg: "Funds added successfully" });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error adding funds:", error);
        return res.status(500).json({ errMsg: "Error adding funds", error });
    }
};


module.exports = {
    fetchUser,
    addManager,
    fetchManagers,
    updateManager,
    masterLogin,
    fetchDeposits,
    fetchWithdrawals,
    getPendingKYCRequests,
    approveKycDocs,
    approveKyc,
    handleWithdraw,
    addToWallet
}