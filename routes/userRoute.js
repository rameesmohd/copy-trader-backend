const express = require('express')
const router = express.Router();
const { fetchUser,
        registerUser, 
        login ,
        fetchManager ,
        makeDeposit, 
        fetchMyInvestments,
        fetchInvestment }=require('../controller/userController')

router.route('/register')
    .get(fetchUser)
    .post(registerUser)

router.route('/login')
    .post(login)

router.route('/my-investments')
    .get(fetchMyInvestments)

router.route('/investment')
    .get(fetchInvestment)

router.route('/manager')
    .get(fetchManager)
    .post(makeDeposit)

module.exports=router

