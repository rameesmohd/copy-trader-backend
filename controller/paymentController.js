const TronWeb = require('tronweb');
const paymentModel = require('../models/paymentSchema');
const userModel = require('../models/user');
const dotenv = require('dotenv');
const withdrawModel = require('../models/payments');
const crypto = require('crypto');
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
const generatePayment = async (req, res) => {
    try {
        const paymentId = generateUniqueCode(); // Generate a random payment ID
        const amount = parseFloat(req.query.boostAmount); // Assume amount is passed as query parameter
        const userId = req?.decodedUser.user_id || 'null';
        if(amount <30){
            return res.status(400).json({message : 'invalid amount'});
        }

        const alreadyGenerated = await paymentModel.findOne({userId,status: 'pending'});

        if (!alreadyGenerated) {
            const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY)
            const account = await tronWebInstance.createAccount(); // Create a new TRX account for this payment
            const paymentAddress = account.address.base58;
            const privateKey = account.privateKey;
            
            const userData = await userModel.findOne({ userId });
            if (!userData) {
                return res.status(402).json({message : 'user not found'});
            }
            const user_Object_id = userData ? userData._id : null;

            const newPendingPayment = new paymentModel({
                userId: userId,
                date: new Date(),
                payment_id: paymentId,
                address: paymentAddress,
                privateKey: privateKey,
                amount: amount,
                user_Object_id: user_Object_id,
            });

            // Store payment details
            await newPendingPayment.save();
            
            return res.status(200).json({
                paymentId,
                address: paymentAddress,
                amount
            });
        } else { 
            if (alreadyGenerated.amount !== amount) {
                await paymentModel.updateOne({_id: alreadyGenerated._id}, {$set: {amount: amount}});
            }
            return res.status(200).json({
                paymentId: alreadyGenerated.payment_id,
                address: alreadyGenerated.address,
                amount
            });
        }
    } catch (error) {
        return res.status(500).send('Error generating payment address: ' + error.message);
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

const checkAndTransferPayment = async (paymentId, userId) => {
    const pendingPayment = await paymentModel.findOne({payment_id: paymentId, userId: userId ,status: 'pending'});

    if (!pendingPayment) return false;

    const tronWebInstance = createTronWebInstance(pendingPayment.privateKey);
    const usdtContract = await initializeUsdtContract(tronWebInstance);

    try {
        const usdtBalance = await usdtContract.methods.balanceOf(pendingPayment.address).call();
        const balanceInSun = usdtBalance.toString();

        const balance = parseFloat(tronWebInstance.fromSun(balanceInSun));
        console.log('balance :',balance);

        if (balance >= pendingPayment.amount) {
            //-------------------------DB_Operations---------------------------//
            const proccessingPayment = await paymentModel.findOneAndUpdate(
                {payment_id: paymentId, userId: userId},
                {$set : {status: 'success'}},
                { new: true }
            );

            const userData = await userModel.findOne({ userId, _id: proccessingPayment.user_Object_id });
            if (!userData) {
                return res.status(402).json({message : 'user not found'});
            }
            const startMiningDate = new Date(userData.mining_start_date);
            const currentDateTime = Date.now();
            const currGh = userData.mining_hash;
            const mainOn_1Gh_800millisec = 0.00000111105; // on 1 ghz
            const mainOn_currentGh_800millisec = mainOn_1Gh_800millisec * currGh;
            const elapsedTime = currentDateTime - startMiningDate.getTime();
            const intervals = elapsedTime / 800;
            const totalMinedCoins = intervals * mainOn_currentGh_800millisec;
            const newHash = currGh + (proccessingPayment.amount / 2.5);
            
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
            
            const newHashIncrease = {
                date: Date.now(),
                amount: proccessingPayment.amount / 2.5,
                expires_at: expiresAt,
                payment_id:paymentId
            };

            const bonusReward = 10

            const new_trasaction = {
                date: Date.now(),
                type: 'upgrade',
                coin: 'main',
                status: 'success',
                amount: proccessingPayment.amount,
                payment_id:paymentId
            };
            
            const third_wall_bonus = proccessingPayment.amount / 2.5
            const third_wallet_bonus = {
                date: Date.now(),
                type: 'bonus',
                coin: 'third',
                status: 'success',
                amount: third_wall_bonus
            }

            let first_boost_bonus_transaction = { amount : 0 }
            
            const transactionsToPush = [new_trasaction,third_wallet_bonus];

            if (userData.missions.first_power_upgrade == false) {
                first_boost_bonus_transaction = {
                    date: Date.now(),
                    type: 'bonus',
                    coin: 'second',
                    status: 'success',
                    amount: bonusReward
                };
                transactionsToPush.push(first_boost_bonus_transaction);
            }

            if(userData.inviter_user_id != 'no inviter' && userData.missions.first_power_upgrade === false){

                const firstUpgradeThirdWalletReward = 100
                const newInviteThirdWalletPurchaseCommission = {
                    join_date:Date.now(),
                    user_Object_id: userData._id,
                    first_name: userData.first_name,
                    reward : firstUpgradeThirdWalletReward,
                    coin : 'third',
                    type : 'reward'
                }

                const newInvitePurchaseCommission = {
                    join_date:Date.now(),
                    user_Object_id: userData._id,
                    first_name: userData.first_name,
                    reward : bonusReward,
                    coin : 'second',
                    type : 'commission'
                }

                await userModel.findOneAndUpdate(
                    { userId: userData.inviter_user_id },
                    {
                        $push: { my_invites: { $each: [newInvitePurchaseCommission,newInviteThirdWalletPurchaseCommission]}},
                        $inc: { 
                            second_wallet: bonusReward,
                            third_wallet : firstUpgradeThirdWalletReward
                         },
                        $set: { 'missions.invitee_first_upgrade': true },
                    }
                );
            }  

            await userModel.updateOne(
                { _id: userData._id },
                {
                    $set: {
                        mining_start_date: Date.now(),
                        mining_wallet: totalMinedCoins,
                        mining_hash: newHash,
                        'missions.first_power_upgrade': true
                    },
                    $push: {
                        hash_increases: newHashIncrease,
                        my_transactions: { $each: transactionsToPush }
                    },
                    $inc : {
                        second_wallet : first_boost_bonus_transaction.amount,
                        third_wallet : third_wall_bonus
                    }
                }
            );

            //----------------------------gas_management --------------------------------------------//
            // Estimate the gas fee required
            const estimatedGasFee = 28900000 //28.9 TRX
            
            // Check if the pendingPayment address has enough TRX for gas fees
            const hasEnoughTrx = await accountHasEnoughTrx(tronWebInstance,pendingPayment.address, estimatedGasFee);

            if (!hasEnoughTrx) {
                // Transfer TRX to the pendingPayment address to cover gas fees
                const adminTronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
                await transferTrxForGas(adminTronWebInstance,proccessingPayment.address, tronWebInstance.fromSun(estimatedGasFee));
            }
            
            //------------------------------transaction_usdt------------------------------------------//
            // Perform the USDT transfer
            tronWebInstance.setPrivateKey(proccessingPayment.privateKey);
            const transaction = await usdtContract.methods.transfer(process.env.DEPOSIT_ADDRESS, tronWebInstance.toSun(pendingPayment.amount)).send({
                feeLimit: estimatedGasFee // Adjust this based on gas fees
            });
            
            console.log('transaction : '+transaction);
            
            return { success: true, transaction };
        }
        return { success: false, transaction: null };
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
        return { success: false, transaction: null };
    }
};

const getUserData = async (user_id) => {
    const strUserId = user_id.toString();
    const [updatedUser] = await userModel.aggregate([
      { $match: { userId: strUserId } },
      {
        $project: {
          userId: 1,
          username: 1,
          first_name: 1,
          inviter_user_id: 1,
          inviter_first_name: 1,
          join_date: 1,
          mining_start_date: 1,
          mining_hash: 1,
          mining_wallet: 1,
          main_wallet: 1,
          second_wallet: 1,
          third_wallet: 1,
          my_transactions: { $slice: ["$my_transactions", -20] },
          my_invites: { $slice: ["$my_invites", -20] },
          is_blocked: 1,
          missions: 1,
        },
      },
    ]);
    return updatedUser;
  };

const checkPayment = async (req, res) => {
    const { paymentId, address, amount } = req.body;
    const userId = req.decodedUser.user_id || 'null';

    if(!paymentId || !address || !amount) {
        return res.status(400).json({status: 'error', message: 'No data to execute in body'});
    }

    try {
        const result = await checkAndTransferPayment(paymentId, userId);
        if (result.success) {
            console.log('Transferred successfully');
            const updatedUser = await getUserData(userId);
            return res.status(200).json({ status: 'success' ,data : updatedUser,transaction :result.transaction});
        } else {
            return res.status(400).json({ status: 'failure', message: 'Payment not completed.' });
        }
    } catch (error) {
        return res.status(500).json({ status: 'failure', message: 'server side error.' });
    }
};

const withdrawFromMainWallet = async (req, res) => {
    const { recipient, amount, network_fee } = req.body;

    if (!recipient) {
        return res.status(400).json({ error: 'Recipient is required' });
    }

    if (amount === undefined || amount === null) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    if (network_fee === undefined || network_fee === null || network_fee < 3) {
        return res.status(400).json({ error: 'Network fee is required' });
    }
    
    const userId = req.decodedUser.user_id;
    const paymentId = generateUniqueCode();
    const amount_to_withdraw = amount - network_fee;

    try {
        const userData = await userModel.findOne({userId},{main_wallet:1})
        
        if (!userData) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (userData.is_blocked) {
            return res.status(402).json({ error : 'user blocked by admin'});
        }
        
        if(userData.main_wallet < amount){
            return res.status(400).send('Insufficient balance in your wallet!');
        }

        if(userData.main_wallet < 20){
            return res.status(400).send('Insufficient balance in your wallet!');
        }

        const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
        const usdtContract = await initializeUsdtContract(tronWebInstance);
    
        if (!tronWebInstance.isAddress(recipient)) {
            return res.status(400).send('Invalid recipient address');
        }

        // Check sender's balance
        const usdtBalance = await usdtContract.methods.balanceOf(process.env.MAIN_ADDRESS).call();
        const balanceInSun = usdtBalance.toString();
        
        const balance = parseFloat(tronWebInstance.fromSun(balanceInSun));
        
        const amountInSun = tronWebInstance.toSun(amount_to_withdraw);
        
        const newPendingWithdrawal = new withdrawModel({
            userId: userId,
            date: new Date(),
            payment_id: paymentId,
            to_address: recipient,
            wallet : 'main_wallet',
            amount: amount,
            status : 'pending',
            user_Object_id: userData._id,
        });

        // Store payment details
        await newPendingWithdrawal.save();

        const newTransaction = {
            date: Date.now(),
            payment_id : paymentId,
            type: 'withdraw',
            coin: 'main',
            status: 'pending',
            amount: amount
        };

        const updatedUser = await userModel.findOneAndUpdate(
            { userId },
            { 
                $push: { my_transactions: newTransaction },
                $inc: { main_wallet: - amount }
            },
            { new: true }
        );

        if (balance < amount_to_withdraw) {
            const UpdatedUser = await getUserData(userId);
            return res.status(200).json({ data : UpdatedUser});
        }

        //if more than 99 USDT make pending
        if( amount >= 1 ){
            const UpdatedUser = await getUserData(userId);
            return res.status(200).json({ data : UpdatedUser});
        }

        // Retrieve the newTransaction ID
        const transactionId = updatedUser.my_transactions[updatedUser.my_transactions.length - 1]._id;


        // Send transaction
        tronWebInstance.setPrivateKey(process.env.PRIVATE_KEY);
        const transaction = await usdtContract.methods.transfer(recipient, amountInSun).send({
            feeLimit: 28900000 // TRX
        });

        console.log('main wallet transaction :',transaction);
        if(transaction){
            // Update withdrawal and transaction status to 'success'
            await withdrawModel.findByIdAndUpdate(newPendingWithdrawal._id, { status: 'success' });
            
            await userModel.findOneAndUpdate(
                { userId, 'my_transactions._id': transactionId },
                { $set: { 'my_transactions.$.status': 'success' } },
                { new: true}
            );
            const userData = await getUserData(userId);
            res.status(200).json({transaction,data :userData});
        }else {
            const userData = await getUserData(userId);
            res.status(200).json({data :userData});
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error sending transaction: ' + error.message);
    }
};

const withdrawFromSecondWallet = async (req, res) => {
    const { recipient, amount, network_fee } = req.body;

    if (!recipient) {
        return res.status(400).json({ error: 'Recipient is required' });
    }

    if (amount === undefined || amount === null) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    if (network_fee === undefined || network_fee === null || network_fee < 2) {
        return res.status(400).json({ error: 'Network fee is required' });
    }

    const userId = req.decodedUser.user_id;
    const paymentId = generateUniqueCode()
    const amount_to_withdraw = amount - network_fee;
    
    
    try {
        let userData = await userModel.findOne({userId},{second_wallet:1})
        
        if (!userData) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (userData.is_blocked) {
            return res.status(402).json({ error : 'user blocked by admin'});
        }

        if(userData.second_wallet < amount){
            return res.status(400).send('Insufficient balance in your wallet!');
        }

        const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);

        if (!tronWebInstance.isAddress(recipient)) {
            return res.status(400).send('Invalid recipient address');
        }

        const newPendingWithdrawal = new withdrawModel({
            userId: userId,
            date: new Date(),
            payment_id: paymentId,
            to_address: recipient,
            wallet : 'second_wallet',
            amount: amount,
            status : 'pending',
            user_Object_id: userData._id,
        });

        // Store payment details
        const savedNewPendingWithdrawal= await newPendingWithdrawal.save();

        const newTransaction = {
            date: Date.now(),
            payment_id : paymentId,
            type: 'withdraw',
            coin: 'second',
            status: 'pending',
            amount: amount
        };

        const updatedUser = await userModel.findOneAndUpdate(
            { userId },
            { 
                $push: { my_transactions: newTransaction },
                $inc: { second_wallet: -amount }
            },
            { new: true}
        );


        if( amount >= 1 ){
            const userData = await getUserData(userId);
            return res.status(200).json({ data : userData});
        }

        // Retrieve the newTransaction ID
        const transactionId = updatedUser.my_transactions[updatedUser.my_transactions.length - 1]._id;

        // Check sender's balance
        const balance = await tronWebInstance.trx.getBalance(process.env.MAIN_ADDRESS);
        const amountInSun = await tronWebInstance.toSun(amount_to_withdraw);


        if (balance < amountInSun) {
            const userData = await getUserData(userId);
            return res.status(200).json({ data : userData});
        }

        // // Send transaction
        tronWebInstance.setPrivateKey(process.env.PRIVATE_KEY);
        const transaction = await tronWebInstance.trx.sendTransaction(recipient, amountInSun);

        console.log('second wallet transaction :',transaction);
        if(transaction){
            await userModel.findOneAndUpdate(
                { userId, 'my_transactions._id': transactionId },
                { $set: { 'my_transactions.$.status': 'success' } },
                { new: true}
            );
            const txid = transaction.txid || null;
            // Update withdrawal and transaction status to 'success'
            await withdrawModel.findByIdAndUpdate(savedNewPendingWithdrawal._id, 
                { status: 'success' , txid : txid}
            );
            
            const updatedUserData = await getUserData(userId);
            res.status(200).json({ transaction ,data :updatedUserData});  
        }else{
            const updatedUserData = await getUserData(userId);
            res.status(200).json({ transaction ,data :updatedUserData});  
        } 
    } catch (error) {
        console.log('Error sending transaction:',error);
        res.status(500).send('Error sending transaction:'+error);
    }
};

//----------For Admin------------------------
const getAddressBalance=async(req,res)=>{
    try {
        const { payment_id} = req.query 
        const { address } = await paymentModel.findOne({payment_id},{address : 1})
        if(!address){
            return res.status(400).send('Invalid payment id')
        }
        
        const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
        const usdtContract = await initializeUsdtContract(tronWebInstance);
    
         const balance = await usdtContract.methods.balanceOf(address).call();
         if(balance){
             const usdtBalance = (BigInt(balance) / BigInt(1e6)).toString();
             res.status(200).json({balance : usdtBalance})
        }else {
            res.status(400).send('Invalid address')
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "Server side error!"})
    }
}

module.exports = {
    generatePayment,
    checkPayment, 
    withdrawFromMainWallet,
    withdrawFromSecondWallet,
    getAddressBalance
};