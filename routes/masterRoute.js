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
        approveKycDocs,
        approveKyc,
        handleWithdraw,
        addToWallet
    } =require('../controller/master/masterController')
const { fetchAddressBalance } = require('../controller/paymentController')
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
router.get('/fetch-address',fetchAddressBalance)

router.route('/withdrawals')
    .get(fetchWithdrawals)
    .patch(handleWithdraw)

router.route('/kyc-requests')
    .get(getPendingKYCRequests)
    .patch(approveKycDocs)
    .post(approveKyc)

router.post('/add-to-wallet',addToWallet)

module.exports= router

