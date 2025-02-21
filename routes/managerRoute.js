const express = require('express');
const { getManagerData,fetchMyInvesters } = require('../controller/manager/managerController');
const { addTradeToManager , getTrades ,rollOverTradeDistribution } = require('../controller/tradeController');
const  { intervalInvestmentHandle } = require('../controller/intervalController')

const router = express.Router();

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

module.exports= router

