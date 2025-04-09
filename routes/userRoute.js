const express = require('express')
const router = express.Router();
const { verifyToken }=require('../middleware/userAuth')
const { 
    fetchUser,
    registerUser, 
    login ,
    fetchManager,
    fetchUserTransactions,
    handleEmailVerificationOtp,
    handleKycProofSubmit, 
    submitTicket,
    fetchTickets,
    fetchRebateTransactions,
    fetchManagerOrderHistory,
    forgetPassGenerateOTP,
    validateForgetOTP,
    resetPassword,
    callbackRequestSubmit,
    registerProvider
}=require('../controller/user/userController')
const {
    makeDeposit, 
    fetchMyInvestments,
    fetchInvestment,
    fetchInvestmentTransactions,
    topUpInvestment,
    handleInvestmentWithdrawal,
    fetchInvestmentTrades ,
    
}=require('../controller/investmentController')

// const { fetchOrderHistory } = require('../controller/manager/managerController')
const { 
    trc20CreateDeposit,
    trc20CheckAndTransferPayment,
    withdrawFromMainWallet, 
    bep20CreateDeposit,
    bep20CheckAndTransferPayment,
    sendOTP
} = require('../controller/paymentController')

const upload = require('../config/multer');
const { fetchCountryList } = require('../controller/common/fetchCountryList');

router.route('/register')
    .post(registerUser)

router.route('/login')
    .post(login)

router.get('/countries',fetchCountryList)
router.post('/callback-request',callbackRequestSubmit)
router.post('/register-provider',registerProvider)

router.route('/forget-password')
    .get(forgetPassGenerateOTP)
    .post(validateForgetOTP)
    .patch(resetPassword)

//<<-----------Auth middleware----------->>
router.use(verifyToken)

router.route('/user')
    .get(fetchUser)

router.route('/my-investments')
    .get(fetchMyInvestments)

router.route('/investment')
    .get(fetchInvestment)
    .post(topUpInvestment)
    .patch(handleInvestmentWithdrawal)

router.route('/find-manager')
    .get(fetchManager)
    .post(makeDeposit)

router.get('/manager-orders',fetchManagerOrderHistory)    

router.get('/transactions',fetchInvestmentTransactions)

router.get('/transaction-history',fetchUserTransactions)

router.get('/rebate-history',fetchRebateTransactions)

router.get('/trades',fetchInvestmentTrades)

router.route('/ticket')
        .post(upload.array('upload',5),submitTicket)
        .get(fetchTickets)

//----------------------kyc----------------------------------------

router.post('/kyc/otp',handleEmailVerificationOtp)

router.post('/kyc-identity',upload.array("identityProof", 5),handleKycProofSubmit)
router.post('/kyc-residential',upload.array("residentialProof", 5),handleKycProofSubmit)


//---------------------- wallet deposit & withdraws-------------------//

router.route('/deposit/usdt-trc20')
    .get(trc20CreateDeposit) 
    .post(trc20CheckAndTransferPayment)

router.route('/deposit/usdt-bep20')
    .get(bep20CreateDeposit) 
    .post(bep20CheckAndTransferPayment)
    
router.route('/withdraw')
    .get(sendOTP)
    .post(withdrawFromMainWallet)

module.exports=router

