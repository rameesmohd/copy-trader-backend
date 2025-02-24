const express = require('express');
const { getManagerData,fetchMyInvesters } = require('../controller/manager/managerController');
const { addTradeToManager , getTrades ,rollOverTradeDistribution } = require('../controller/tradeController');
const  { intervalInvestmentHandle } = require('../controller/intervalController')
const {fetchInvestmentTransactions,fetchInvestmentTrades}=require('../controller/investmentController');
const { fetchUser } = require('../controller/user/userController');
const { fetchAllInvestmentTransactions } = require('../controller/investmentController')
const {login} = require('../controller/manager/managerController')
const router = express.Router();
const { verifyToken } = require('../middleware/managerAuth')

router.post('/login',login)

router.use(verifyToken)

router.route('/manager')
        .get(getManagerData)

router.route('/trade')
        .get(getTrades)
        .post(addTradeToManager)
        .patch(rollOverTradeDistribution)

router.route('/investments')
        .get(fetchMyInvesters)

router.route('/interval-test')
        .get(intervalInvestmentHandle)

router.get('/transactions',fetchInvestmentTransactions)
router.get('/trades',fetchInvestmentTrades)
router.get('/user',fetchUser)

router.route('/deposits')
        .get(fetchAllInvestmentTransactions)

module.exports= router

