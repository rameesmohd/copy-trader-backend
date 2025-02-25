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
    resetPassword
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
    trc20WithdrawFromMainWallet 
} = require('../controller/paymentController')

const upload = require('../config/multer');
const { fetchCountryList } = require('../controller/common/fetchCountryList');

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).send({ status: 'fail', message: 'No file uploaded' });
    }
    // The file URL from Cloudinary
    const fileUrl = req.file.path;
    
    // Send the Cloudinary URL back to the client
    res.send({ status: 'success', fileUrl: fileUrl });
});

router.route('/register')
    .post(registerUser)

router.route('/login')
    .post(login)

router.get('/countries',fetchCountryList)

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

router.route('/manager')
    .get(fetchManager)
    .post(makeDeposit)

router.get('/manager-orders',fetchManagerOrderHistory)    

router.get('/transactions',fetchInvestmentTransactions)

router.get('/transaction-history',fetchUserTransactions)

router.get('/rebate-history',fetchRebateTransactions)

router.get('/trades',fetchInvestmentTrades)

router.route('/ticket')
        .post( upload.array('upload'),submitTicket)
        .get(fetchTickets)

//----------------------kyc----------------------------------------

router.post('/kyc/otp',handleEmailVerificationOtp)

router.post('/kyc',handleKycProofSubmit)

//---------------------- wallet deposit & withdraws-------------------//

router.route('/deposit/usdt-trc20')
    .get(trc20CreateDeposit) 
    .post(trc20CheckAndTransferPayment)
    
router.route('/withdraw/usdt-trc-20')
    .post(trc20WithdrawFromMainWallet)



module.exports=router

