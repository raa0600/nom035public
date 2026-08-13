const express = require('express');
const authRoutes = require('./auth.routes');
const usuarioRoutes = require('./usuario.routes');
const evaluacionRoutes = require('./evaluacion.routes'); // <-- Agregar esta línea

const router = express.Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de gestión de usuarios
router.use('/usuarios', usuarioRoutes);

// Rutas de evaluación (Guía I y Guía III)
router.use('/evaluacion', evaluacionRoutes); // <-- Agregar esta línea

// Ruta de prueba
router.get('/ping', (req, res) => {
    res.json({ message: '🏓 Pong! API funcionando' });
});

module.exports = router;