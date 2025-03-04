const express = require('express')
const router = express.Router();
const { 
        fetchUser,
        addManager ,
        fetchManagers,
        updateManager,
        masterLogin,
        fetchDeposits,
        fetchWithdrawals,
        getPendingKYCRequests,
        approveKycDocs
    } =require('../controller/master/masterController')
const {verifyToken} = require('../middleware/masterAuth')

router.post('/login',masterLogin)

router.use(verifyToken)

router.route('/users')
    .get(fetchUser)

router.route('/manager')
    .get(fetchManagers)
    .post(addManager)
    .patch(updateManager)

router.route('/deposits')
    .get(fetchDeposits)

router.route('/withdrawals')
    .get(fetchWithdrawals)

router.route('/kyc-requests')
    .get(getPendingKYCRequests)
    .patch(approveKycDocs)

module.exports= router

