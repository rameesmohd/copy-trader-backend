const express = require('express')
const router = express.Router();
const { fetchUser, registerUser, login }=require('../controller/userController')

router.route('/register')
    .get(fetchUser)
    .post(registerUser)

router.route('/login')
    .post(login)

module.exports=router

