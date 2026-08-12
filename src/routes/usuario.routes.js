const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Perfil propio (cualquier usuario autenticado)
router.get('/perfil', usuarioController.getPerfil);

// Rutas solo para Administradores (rol = 1)
router.get('/', authorize([1]), usuarioController.getUsuarios);
router.post('/', authorize([1]), usuarioController.createUsuario);
router.put('/:id/rol', authorize([1]), usuarioController.updateRol);
router.put('/:id', authorize([1]), usuarioController.updateUsuario);
router.put('/:id/reset-password', authorize([1]), usuarioController.resetPassword); // <-- NUEVA
router.delete('/:id', authorize([1]), usuarioController.deleteUsuario);

module.exports = router;