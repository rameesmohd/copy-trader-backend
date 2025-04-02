const {TronWeb}  = require('tronweb');
const userModel = require('../models/user');
const dotenv = require('dotenv');
const crypto = require('crypto');
const depositsModel = require('../models/deposit');
const userTransactionModel = require('../models/userTransaction');
const withdrawalModel = require('../models/withdrawal');
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_SECRET_KEY);
const { withdrawalVerification } = require('../assets/html/verification');
dotenv.config();

const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// Function to create a new TronWeb instance
const createTronWebInstance = (privateKey) => {
    return new TronWeb({
        fullHost: 'https://api.trongrid.io',
        privateKey: privateKey
    });
};

// Function to initialize USDT contract
const initializeUsdtContract = async (tronWebInstance) => {
    return await tronWebInstance.contract().at(USDT_CONTRACT_ADDRESS);
};

const generateUniqueCode = () => {
  const buffer = crypto.randomBytes(6); 
  const code = buffer.toString('hex').slice(0, 12); 
  return code;
};

// Endpoint to generate a unique address and amount for payment
const trc20CreateDeposit = async (req, res) => {
    try {
        const { user_id, payment_mode, amount } = req.query;

        if (amount < 50) {
            return res.status(400).json({ errMsg: 'Invalid amount' });
        }

        const alreadyGenerated = await depositsModel.findOne({ user: user_id,payment_mode:"usdt-trc20",status:"pending"});

        if (!alreadyGenerated) {
            const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);

            // Generate a new TRX account using generateAccount()
            const { address: { base58: payment_address }, privateKey } = tronWebInstance.utils.accounts.generateAccount();

            const user = await userModel.findOne({ _id: user_id });
            if (!user) {
                return res.status(402).json({ errMsg: 'User not found' });
            }

            const newDeposit = new depositsModel({
                user: user._id,
                wallet_id: user.my_wallets.main_wallet_id,
                payment_mode: "usdt-trc20",
                amount,
                payment_address,
                private_key: privateKey,
            });

            // Store payment details
            const deposit = await newDeposit.save();
            return res.status(200).json({ result: { address: deposit.payment_address, _id: deposit._id } });
        } else {
            if (alreadyGenerated.amount !== amount) {
                await depositsModel.updateOne({ _id: alreadyGenerated._id }, { $set: { amount: amount } });
            }
            return res.status(200).json({ result: { address: alreadyGenerated.payment_address, _id: alreadyGenerated._id } });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send('Error generating new deposit: ' + error.message);
    }
};

// Function to transfer TRX to an address to cover gas fees
const transferTrxForGas = async (tronWebInstance,recipient, amount) => {
    const trxAmount = tronWebInstance.toSun(amount);
    return await tronWebInstance.trx.sendTransaction(recipient, trxAmount);
};

// Function to check if an account has enough TRX for gas fees
const accountHasEnoughTrx = async (tronWebInstance,address, requiredBalance) => {
    const balance = await tronWebInstance.trx.getBalance(address);
    return balance >= requiredBalance;
};

const trc20CheckAndTransferPayment = async (req,res) => {
    const { order_id } = req.body;

    console.log(req.body);
    
    if(!order_id) {
        return res.status(400).json({status: 'error', msg: 'No data to execute in body'});
    }

    try {
    const pendingPayment = await depositsModel.findOne({_id : order_id ,status: 'pending'});

    if (!pendingPayment) return  res.status(400).json({ status: 'error', message: 'Order not exists!.' });;

    const tronWebInstance = createTronWebInstance(pendingPayment.private_key);
    const usdtContract = await initializeUsdtContract(tronWebInstance);

        const usdtBalance = await usdtContract.methods.balanceOf(pendingPayment.payment_address).call();
        const balanceInSun = usdtBalance.toString();

        const balance = parseFloat(tronWebInstance.fromSun(balanceInSun));
        console.log('balance :',balance);

        if (balance >= pendingPayment.amount) {
            //-------------------------DB_Operations---------------------------//
            const proccessingPayment = await depositsModel.findOneAndUpdate(
                { _id : order_id},
                { $set : {
                    status: 'approved',
                    is_payment_recieved : true
                }},
                { new: true }
            );

            const userData = await userModel.findOne({ _id: proccessingPayment.user });
            if (!userData) {
                return res.status(402).json({message : 'user not found'});
            }
            
            const newUserTrasaction = new userTransactionModel({
                user: proccessingPayment.user,
                type: 'deposit',
                payment_mode : 'usdt',
                status: 'approved',
                amount: proccessingPayment.amount,
                related_transaction: proccessingPayment._id,
                transaction_type : 'deposits',
                description : 'USDT TRC-20 deposit',
                transaction_id : proccessingPayment.transaction_id
            });
            await newUserTrasaction.save()

            // Perform the update operation
            const updatedUserData = await userModel.findOneAndUpdate(
                { _id: userData._id },
                {
                    $inc: {
                        'my_wallets.main_wallet': pendingPayment.amount
                    }
                },
                { new: true ,select: '-password' }
            );

            // const updatedUserData = await userModel.findById(userData._id).select('-password');

            // // Retrieve the updated userData without the password field
            // const updatedUserData = await userModel.findById(userData._id).select('-password');

            // //----------------------------gas_management --------------------------------------------//
            // // Estimate the gas fee required
            // const estimatedGasFee = 28900000 //28.9 TRX
            
            // // Check if the pendingPayment address has enough TRX for gas fees
            // const hasEnoughTrx = await accountHasEnoughTrx(tronWebInstance,pendingPayment.address, estimatedGasFee);

            // if (!hasEnoughTrx) {
            //     // Transfer TRX to the pendingPayment address to cover gas fees
            //     const adminTronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
            //     await transferTrxForGas(adminTronWebInstance,proccessingPayment.address, tronWebInstance.fromSun(estimatedGasFee));
            // }
            
            // //------------------------------transaction_usdt------------------------------------------//
            // // Perform the USDT transfer
            // tronWebInstance.setPrivateKey(proccessingPayment.privateKey);
            // const transaction = await usdtContract.methods.transfer(process.env.DEPOSIT_ADDRESS, tronWebInstance.toSun(pendingPayment.amount)).send({
            //     feeLimit: estimatedGasFee // Adjust this based on gas fees
            // });
            
            return res.status(200).json({ 
                status: 'success' ,
                transaction_id: proccessingPayment.transaction_id,
                userData : updatedUserData
            });
        }
        return res.status(200).json({ status: 'failure', message: 'Payment not completed.' });
    } catch (error) {
        if (error.response) {   
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error request data:', error.request);
        } else {
            console.error('Error message:', error);
        }
        return res.status(500).json({ status: 'failure', message: 'server side error.' });
    }
};

const randomSixDigitNumber = Math.floor(100000 + Math.random() * 900000);
const sendOTP=async(req,res)=>{
    try {
        const {user_id} = req.query
        const userData = await userModel.findOne({_id:user_id})
        const OTP = randomSixDigitNumber
        try {
            await resend.emails.send({
                from: process.env.WEBSITE_MAIL,
                to: userData.email,
                subject:"Withdrawal Verification",
                html: withdrawalVerification(OTP,userData.first_name),
            });
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            return res
                .status(500)
                .json({ errMsg: "Failed to send verification email." });
        }
        return res.status(200).json({OTP,success: true,msg: "Otp sent successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error sending otp: ' + error.message);
    }
}

const withdrawFromMainWallet = async (req, res) => {
    let { user_id,recipient, amount, network_fee ,method} = req.body;
    console.log( req.body);

    // Ensure amount always has two decimal places
    amount = parseFloat(amount).toFixed(2);
    
    if (!recipient) {
        return res.status(400).json({ errMsg: 'Recipient is required.' });
    }

    if (amount === undefined || amount === null) {
        return res.status(400).json({ errMsg: 'Amount is required.' });
    }

    if (amount < 50 ) {
        return res.status(400).json({ errMsg: 'Min withdraw amount is 50 USDT.' });
    }

    if (network_fee === undefined || network_fee === null || network_fee < 0) {
        return res.status(400).json({ errMsg: 'Network fee is required' });
    }
    
    // const amount_to_withdraw = Number(amount) - Number(network_fee);

    try {
        const userData = await userModel.findOne({_id : user_id},{my_wallets:1})
        
        if (!userData) {
            return res.status(404).json({ errMsg: 'User not found.' });
        }

        if (userData.is_blocked) {
            return res.status(402).json({ errMsg : 'user blocked by admin!'});
        }
        
        if(userData.my_wallets.main_wallet < amount){
            return res.status(400).json({ errMsg : 'Insufficient balance in your wallet!'})
        }

        if(userData.my_wallets.main_wallet  < 20){
            return res.status(400).json({ errMsg : 'Insufficient balance in your wallet!'})
        }

        // const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
        // const usdtContract = await initializeUsdtContract(tronWebInstance);
    
        // if (!tronWebInstance.isAddress(recipient)) {
        //     return res.status(400).json({ errMsg : 'Invalid recipient address'})
        // }

        const newPendingWithdrawal = new withdrawalModel({
            user: userData._id,
            wallet_id: userData.my_wallets.main_wallet_id,
            payment_mode: method.toLowerCase(),
            amount,
            recipient_address : recipient,
        });

        // Store payment details
        await newPendingWithdrawal.save();

        const newUserTrasaction = new userTransactionModel({
            user: userData._id,
            type: 'withdrawal',
            payment_mode : method.toLowerCase(),
            amount: newPendingWithdrawal.amount,
            related_transaction: newPendingWithdrawal._id,
            transaction_type : 'withdrawals',
            description : 'withdraw from wallet',
            transaction_id : newPendingWithdrawal.transaction_id
        });
        await newUserTrasaction.save()
  
        let updatedUser = await userModel.findOneAndUpdate(
            { _id: user_id },
            { 
                $inc: { 'my_wallets.main_wallet': -amount }
            },
            { new: true ,select: '-password' }
        );

        // -------------------------Check sender's balance-------------------------------------------
        // const usdtBalance = await usdtContract.methods.balanceOf(process.env.MAIN_ADDRESS).call();

        // const balanceInSun = usdtBalance.toString();
        
        // const balance = parseFloat(tronWebInstance.fromSun(balanceInSun));
        
        // const amountInSun = tronWebInstance.toSun(amount_to_withdraw);
        
        // console.log('our balance : ' , balance);

        // if (balance < amount_to_withdraw) {
        //     return res.status(200).json({ result : { userData : updatedUser ,withdrawRequest : newPendingWithdrawal}});
        // }

        // //if more than 99 USDT make pending
        // if( amount >= 99 ){
        //     return res.status(200).json({ result : { userData : updatedUser,withdrawRequest : newPendingWithdrawal}});
        // }

        // Send transaction
        // tronWebInstance.setPrivateKey(process.env.PRIVATE_KEY);
        // const transaction = 'test----------------'
        // await usdtContract.methods.transfer(recipient, amountInSun).send({
        //     feeLimit: 28900000 // TRX
        // });

        // console.log('main wallet transaction :',transaction);

        // if(transaction){
        //     // Update withdrawal and transaction status to 'success'
        //         const withdraw =  await withdrawalModel.findByIdAndUpdate(
        //             {_id: newPendingWithdrawal._id}, 
        //             { status: 'approved' , crypto_txid : transaction},
        //             { new: true }
        //         );
            
        //     await userTransactionModel.findOneAndUpdate(
        //         { _id : newUserTrasaction._id},
        //         { $set: { status: 'approved' } },
        //         { new: true}
        //     );
        //     return res.status(200).json({ result : { userData : updatedUser ,withdrawRequest : withdraw}});
        // }else {
            return res.status(200).json({ result : { userData : updatedUser ,withdrawRequest: newPendingWithdrawal}});
        // }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error sending transaction: ' + error.message);
    }
};

//-----------------------------------------------------BEP20--------------------------------------------------------->>
const Web3 = require('web3');
const { ethers } = require("ethers");
const USDT_ADDRESS = "0x55d398326f99059ff775485246999027b3197955"; // BEP-20 USDT contract

const url = process.env.ANKR_API  

const web3 = new Web3(new Web3.providers.HttpProvider(url));

web3.eth.getBlockNumber((error, blockNumber) => {
    if(!error) {
        console.log(blockNumber);
    } else {
        console.log(error);
    }
});

const usdtContract = new web3.eth.Contract([
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    }
], USDT_ADDRESS);


const generateWallet = () => {
    const wallet = ethers.Wallet.createRandom(); // Generate a new wallet
    return {
        address: wallet.address,   // Public Address
        privateKey: wallet.privateKey // Private Key (Store securely)
    };
};

// Endpoint to generate a unique address and amount for payment
const bep20CreateDeposit = async (req, res) => {
    try {
        const { user_id, payment_mode, amount } = req.query;

        if (amount < 50) {
            return res.status(400).json({ errMsg: 'Invalid amount' });
        }

        const alreadyGenerated = await depositsModel.findOne({ user: user_id,payment_mode: "usdt-bep20", status: 'pending' });

        if (!alreadyGenerated) {
            const generatedWallet = generateWallet()

            const user = await userModel.findOne({ _id: user_id });
            if (!user) {
                return res.status(402).json({ errMsg: 'User not found' });
            }

            const newDeposit = new depositsModel({
                user: user._id,
                wallet_id: user.my_wallets.main_wallet_id,
                payment_mode: "usdt-bep20",
                amount,
                payment_address : generatedWallet.address,
                private_key: generatedWallet.privateKey,
            });

            // Store payment details
            const deposit = await newDeposit.save();
            return res.status(200).json({ result: { address: deposit.payment_address, _id: deposit._id } });
        } else {
            if (alreadyGenerated.amount !== amount) {
                await depositsModel.updateOne({ _id: alreadyGenerated._id }, { $set: { amount: amount } });
            }
            return res.status(200).json({ result: { address: alreadyGenerated.payment_address, _id: alreadyGenerated._id } });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send('Error generating new deposit: ' + error.message);
    }
};

// const getUSDTBalance = async (walletAddress) => {
//     try {
//         const balance = await usdtContract.methods.balanceOf(walletAddress).call();
//         return web3.utils.fromWei(balance, "ether"); // Convert to readable format
//     } catch (error) {
//         console.error("Error fetching balance:", error);
//         return "0";
//     }
// };

const getUSDTBEPBalance = async (walletAddress) => {
    try {
        const balance = await usdtContract.methods.balanceOf(walletAddress).call();
        return Number(balance) / 10 ** 18; // Convert using 18 decimal places
    } catch (error) {
        console.error("Error fetching balance:", error);
        return 0;
    }
};

// // Example Usage:
// (async () => {
//     const balance = await getUSDTBEPBalance(userWallet.address);
//     console.log(`USDT Balance: ${balance}`);
// })();

const bep20CheckAndTransferPayment = async (req,res) => {
    const { order_id } = req.body;

    console.log(req.body);
    
    if(!order_id) {
        return res.status(400).json({status: 'error', msg: 'No data to execute in body'});
    }

    const pendingPayment = await depositsModel.findOne({_id : order_id ,payment_mode : "usdt-bep20",status: 'pending'});

    if (!pendingPayment) return  res.status(400).json({ status: 'error', message: 'Order not exists!.' });;

    try {
        const balance = await getUSDTBEPBalance(pendingPayment.payment_address)
        console.log('balance :',balance);

        if (balance >= pendingPayment.amount) {
            //-------------------------DB_Operations---------------------------//
            const proccessingPayment = await depositsModel.findOneAndUpdate(
                { _id : order_id},
                { $set : {
                    status: 'approved',
                    is_payment_recieved : true
                }},
                { new: true }
            );

            const userData = await userModel.findOne({ _id: proccessingPayment.user });
            if (!userData) {
                return res.status(402).json({message : 'user not found'});
            }
            
            const newUserTrasaction = new userTransactionModel({
                user: proccessingPayment.user,
                type: 'deposit',
                payment_mode : 'usdt',
                status: 'approved',
                amount: proccessingPayment.amount,
                related_transaction: proccessingPayment._id,
                transaction_type : 'deposits',
                description : 'USDT BEP-20 deposit',
                transaction_id : proccessingPayment.transaction_id
            });
            await newUserTrasaction.save()

            // Perform the update operation
            const updatedUserData = await userModel.findOneAndUpdate(
                { _id: userData._id },
                {
                    $inc: {
                        'my_wallets.main_wallet': pendingPayment.amount
                    }
                },
                { new: true ,select: '-password' }
            );

            //trasfer to company wallet logic here--
            
            return res.status(200).json({ 
                status: 'success' ,
                transaction_id: proccessingPayment.transaction_id,
                userData : updatedUserData
            });
        }
        return res.status(200).json({ status: 'failure', message: 'Payment not completed.' });
    } catch (error) {
        if (error.response) {   
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error request data:', error.request);
        } else {
            console.error('Error message:', error);
        }
        return res.status(500).json({ status: 'failure', message: 'server side error.' });
    }
};

// // ✅ Wallets
// const PERSONAL_WALLET = "0xYourPersonalWalletAddress";
// const PERSONAL_PRIVATE_KEY = "0xYourPrivateKey"; // 🚨 Secure this!
// const USDT_ADDRESS = "0x64544969ed7EBf5f083679233325356EbE738930";

// // ✅ ABIs
// const usdtAbi = [
//     "function balanceOf(address owner) view returns (uint256)",
//     "function transfer(address to, uint256 value) public returns (bool)"
// ];

// // ✅ Create a Wallet for Sending Gas
// const personalWallet = new ethers.Wallet(PERSONAL_PRIVATE_KEY, provider);

// // ✅ Function to Check BNB Balance
// const getBNBBalance = async (walletAddress) => {
//     const balance = await provider.getBalance(walletAddress);
//     return ethers.formatUnits(balance, "ether"); // Convert to BNB
// };

// // ✅ Function to Send BNB for Gas
// const sendBNBForGas = async (toAddress) => {
//     try {
//         const gasAmount = ethers.parseUnits("0.002", "ether"); // Send 0.002 BNB for gas
//         const tx = await personalWallet.sendTransaction({
//             to: toAddress,
//             value: gasAmount
//         });
//         await tx.wait();
//         console.log(`✅ Sent 0.002 BNB for gas to ${toAddress}`);
//     } catch (error) {
//         console.error("❌ Error sending BNB for gas:", error);
//     }
// };

// // ✅ Function to Transfer USDT
// const transferUSDT = async (userPrivateKey) => {
//     try {
//         const userWallet = new ethers.Wallet(userPrivateKey, provider);
//         const userAddress = userWallet.address;
//         const contract = new ethers.Contract(USDT_ADDRESS, usdtAbi, userWallet);

//         // 🔹 Check User's BNB Balance for Gas
//         const bnbBalance = await getBNBBalance(userAddress);
//         if (parseFloat(bnbBalance) < 0.0005) {  // If BNB is too low, top up
//             await sendBNBForGas(userAddress);
//         }

//         // 🔹 Check User's USDT Balance
//         const balance = await contract.balanceOf(userAddress);
//         if (balance == 0) {
//             console.log("No USDT balance to transfer.");
//             return;
//         }

//         // 🔹 Convert balance and send USDT
//         const amountToSend = ethers.parseUnits(balance.toString(), 18);
//         const tx = await contract.transfer(PERSONAL_WALLET, amountToSend);
//         await tx.wait();
        
//         console.log(`✅ Transferred ${ethers.formatUnits(balance, 18)} USDT to ${PERSONAL_WALLET}`);
//     } catch (error) {
//         console.error("❌ Error transferring USDT:", error);
//     }
// };

// // ✅ Example Usage
// (async () => {
//     const userWallet = {
//         address: "0xUserDepositWallet",
//         privateKey: "0xUserPrivateKey"
//     };

//     await transferUSDT(userWallet.privateKey);
// })();

const fetchAddressBalance = async (req, res) => {
    try {
        const { _id } = req.query;
        const { payment_address, private_key, payment_mode } = await depositsModel.findOne({ _id });

        if (!payment_address || !private_key) {
            return res.status(400).send("Invalid payment ID");
        }

        let usdtBalance = "0"; 

        if (payment_mode == "usdt-trc20") {
            const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
            const usdtContract = await initializeUsdtContract(tronWebInstance);
            
            const balance = await usdtContract.methods.balanceOf(payment_address).call();
            usdtBalance = (BigInt(balance) / BigInt(1e6)).toString();

        } else if (payment_mode == "usdt-bep20") {
            usdtBalance = await getUSDTBEPBalance(payment_address);
        }

        // Check if balance is zero
        if (usdtBalance === "0") {
            return res.status(200).json({ balance: usdtBalance, msg: "No funds available",payment_address,private_key });
        }

        res.status(200).json({ balance: usdtBalance ,payment_address,private_key});
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: "Error fetching balance", error });
    }
};


module.exports = {
    //-------------TRC20-----------
    trc20CreateDeposit,
    trc20CheckAndTransferPayment, 


    sendOTP,
    withdrawFromMainWallet,
    // withdrawFromSecondWallet,
    // getAddressBalance

    //-------------BEP20----------
    bep20CreateDeposit,
    bep20CheckAndTransferPayment,

    //-------------MASTER---------
    fetchAddressBalance
};