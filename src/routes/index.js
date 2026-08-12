const express = require('express');
const authRoutes = require('./auth.routes');
const usuarioRoutes = require('./usuario.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);

router.get('/ping', (req, res) => {
    res.json({ message: '🏓 Pong! API funcionando' });
});

module.exports = router;