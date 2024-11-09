const express = require('express')
const router = express.Router();
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
    fetchInvestmentTrades }=require('../controller/investmentController')

const { fetchOrderHistory } = require('../controller/managerController')
const { createDeposit } = require('../controller/paymentController')


router.route('/register')
    .post(registerUser)

router.route('/login')
    .post(login)

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

router.route('/deposit_mainwallet')
    .get(createDeposit) 

module.exports=router

