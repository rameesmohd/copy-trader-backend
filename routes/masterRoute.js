const express = require('express')
const router = express.Router();
const { 
        fetchUser,
        addProvider ,
        fetchProviders,
        updateProvider
    } =require('../controller/masterController')

router.route('/users')
    .get(fetchUser)

router.route('/providers')
    .get(fetchProviders)
    .post(addProvider)
    .patch(updateProvider)


module.exports= router

