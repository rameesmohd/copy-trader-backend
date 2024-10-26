const express = require('express');
const { getManagerData } = require('../controller/managerController');
const router = express.Router();

router.route('/manager')
        .get(getManagerData)

module.exports= router

