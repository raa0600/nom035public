const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Verifica que authController no sea undefined
console.log('🔍 authController:', authController);

router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;