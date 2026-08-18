const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacion.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============================================================
// ESTADO ACTUAL (antes de iniciar nueva evaluación)
// ============================================================
router.get('/estado-actual', evaluacionController.getEstadoActual);

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

// ============================================================
// PAUSA Y CONTINUACIÓN
// ============================================================
router.get('/en-curso', evaluacionController.getEvaluacionesEnCurso);
router.get('/:id/progreso', evaluacionController.getProgresoEvaluacion);
router.post('/:id/pausar', evaluacionController.pausarEvaluacion);

// ============================================================
// REPORTES (solo admin y supervisor)
// ============================================================
router.get('/completadas', authorize([1, 2]), evaluacionController.getEvaluacionesCompletadas);

// ============================================================
// CANALIZACIONES (solo admin y supervisor)
// ============================================================
router.get('/canalizacion', authorize([1, 2]), evaluacionController.getCanalizaciones);
router.delete('/:id', authorize([1]), evaluacionController.deleteEvaluacion);

module.exports = router;