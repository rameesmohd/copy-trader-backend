const express = require('express')
const router = express.Router();
const { 
    fetchUser,
    registerUser, 
    login ,
    fetchManager }=require('../controller/userController')
const {
    makeDeposit, 
    fetchMyInvestments,
    fetchInvestment,
    fetchTransactions,
    topUpInvestment,
    handleInvestmentWithdrawal }=require('../controller/investmentController')

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

router.route('/transactions')
    .get(fetchTransactions)

module.exports=router

