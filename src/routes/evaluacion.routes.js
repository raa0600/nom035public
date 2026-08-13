const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacion.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============================================================
// GUÍA DE REFERENCIA I (Filtro traumático)
// ============================================================
router.get('/guia-i/preguntas', evaluacionController.getPreguntasGuiaI);
router.post('/:id/guia-i', evaluacionController.guardarGuiaI);

// ============================================================
// GUÍA DE REFERENCIA III (Cuestionario principal)
// ============================================================
router.post('/iniciar', evaluacionController.iniciarEvaluacion);
router.get('/:id/preguntas', evaluacionController.getPreguntas);
router.post('/:id/respuesta', evaluacionController.guardarRespuesta);
router.post('/:id/finalizar', evaluacionController.finalizarEvaluacion);
router.get('/:id/resultados', evaluacionController.getResultados);

module.exports = router;