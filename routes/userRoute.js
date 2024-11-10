const express = require('express')
const router = express.Router();
const { verifyToken }=require('../middleware/userAuth')
const { 
    fetchUser,
    registerUser, 
    login ,
    fetchManager,
    fetchUserTransactions,
}=require('../controller/userController')
const {
    makeDeposit, 
    fetchMyInvestments,
    fetchInvestment,
    fetchInvestmentTransactions,
    topUpInvestment,
    handleInvestmentWithdrawal,
    fetchInvestmentTrades 
}=require('../controller/investmentController')

const { fetchOrderHistory } = require('../controller/managerController')
const { createDeposit,checkAndTransferPayment,withdrawFromMainWallet } = require('../controller/paymentController')


router.route('/register')
    .post(registerUser)

router.route('/login')
    .post(login)

router.use(verifyToken)

router.route('/user')
    .get(fetchUser)

router.route('/my-investments')
    .get(fetchMyInvestments)

router.route('/investment')
    .get(fetchInvestment)
    .post(topUpInvestment)
    .patch(handleInvestmentWithdrawal)

router.route('/manager')
    .get(fetchManager)
    .post(makeDeposit)

router.get('/manager-orders',fetchOrderHistory)    

router.get('/transactions',fetchInvestmentTransactions)

router.get('/transaction-history',fetchUserTransactions)

router.route('/trades')
    .get(fetchInvestmentTrades)

//---------------------- wallet deposit & withdraws-------------------//

router.route('/deposit/usdt-trc20')
    .get(createDeposit) 
    .post(checkAndTransferPayment)
    
router.route('/withdraw/usdt-trc-20')
    .post(withdrawFromMainWallet)

module.exports=router

