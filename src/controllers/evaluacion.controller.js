const evaluacionModel = require('../models/Evaluacion.model');
const usuarioModel = require('../models/Usuario.model');
const respuestaModel = require('../models/Respuesta.model');
const guiaIModel = require('../models/GuiaI.model');
const { getPool, sql } = require('../config/database');

// ============================================================
// GUÍA DE REFERENCIA I
// ============================================================

// Obtener preguntas de la Guía I
const getPreguntasGuiaI = async (req, res, next) => {
    try {
        const preguntas = await guiaIModel.getPreguntas();
        res.json(preguntas);
    } catch (err) {
        next(err);
    }
};

// Guardar respuestas de la Guía I
const guardarGuiaI = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { respuestas } = req.body;

        await guiaIModel.saveRespuestas(id, respuestas);
        const resultado = await evaluarGuiaI(id);

        if (resultado.requiereCanalizacion) {
            await evaluacionModel.updateStatus(id, 'Canalizacion_requerida');
            return res.json({
                message: 'Guía I completada. Se requiere canalización a atención clínica.',
                requiereCanalizacion: true,
                detalle: resultado.detalle
            });
        }

        await evaluacionModel.updateStatus(id, 'En_proceso');
        res.json({
            message: 'Guía I completada. Puede continuar con la Guía III.',
            requiereCanalizacion: false
        });
    } catch (err) {
        next(err);
    }
};

// Evaluar Guía I (lógica de canalización)
const evaluarGuiaI = async (id_evaluacion) => {
    const respuestas = await guiaIModel.getRespuestas(id_evaluacion);
    const respMap = {};
    respuestas.forEach(r => {
        respMap[r.numero] = r.respuesta;
    });

    const seccionI = [1,2,3,4,5,6].some(num => respMap[num] === true);
    if (!seccionI) return { requiereCanalizacion: false };

    const seccionII = [7,8].some(num => respMap[num] === true);
    const seccionIII = [9,10,11,12,13,14,15].filter(num => respMap[num] === true).length >= 3;
    const seccionIV = [16,17,18,19,20].filter(num => respMap[num] === true).length >= 2;

    const requiereCanalizacion = seccionII || seccionIII || seccionIV;

    return {
        requiereCanalizacion,
        detalle: {
            seccionI: seccionI ? 'Sí (hubo al menos un evento traumático)' : 'No',
            seccionII: seccionII ? 'Sí (al menos una pregunta positiva)' : 'No',
            seccionIII: seccionIII ? 'Sí (3 o más positivas)' : 'No',
            seccionIV: seccionIV ? 'Sí (2 o más positivas)' : 'No'
        }
    };
};

// ============================================================
// GUÍA DE REFERENCIA III (Cuestionario principal)
// ============================================================

// Iniciar evaluación
const iniciarEvaluacion = async (req, res, next) => {
    try {
        const pool = getPool();
        const userId = req.user.id;

        // 1. Obtener el usuario con su id_empleado
        const userResult = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT id_usuario, email, nombre, id_empleado FROM USUARIO WHERE id_usuario = @id');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        let user = userResult.recordset[0];
        let id_empleado = user.id_empleado;

        // 2. Si no tiene empleado, crearlo
        if (!id_empleado) {
            // Buscar si ya existe empleado con ese email
            const empleadoExistente = await pool.request()
                .input('email', sql.NVarChar, user.email)
                .query('SELECT id_empleado FROM EMPLEADO WHERE email = @email');

            if (empleadoExistente.recordset.length > 0) {
                id_empleado = empleadoExistente.recordset[0].id_empleado;
            } else {
                // Crear nuevo empleado
                const resultEmpleado = await pool.request()
                    .input('nombre', sql.NVarChar, user.nombre)
                    .input('email', sql.NVarChar, user.email)
                    .query(`
                        INSERT INTO EMPLEADO (nombre, email)
                        VALUES (@nombre, @email);
                        SELECT SCOPE_IDENTITY() AS id;
                    `);
                id_empleado = resultEmpleado.recordset[0].id;
            }

            // Vincular usuario con empleado
            await pool.request()
                .input('id_usuario', sql.Int, userId)
                .input('id_empleado', sql.Int, id_empleado)
                .query('UPDATE USUARIO SET id_empleado = @id_empleado WHERE id_usuario = @id_usuario');
        }

        // 3. Crear la evaluación
        const id_evaluacion = await evaluacionModel.create(id_empleado);
        res.status(201).json({ id_evaluacion, message: 'Evaluación iniciada' });

    } catch (err) {
        next(err);
    }
};

// Obtener preguntas de una evaluación
const getPreguntas = async (req, res, next) => {
    try {
        const { id } = req.params;
        const preguntas = await evaluacionModel.getPreguntasByEvaluacion(id);
        res.json(preguntas);
    } catch (err) {
        next(err);
    }
};

// Guardar respuesta de una pregunta
const guardarRespuesta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id_pregunta, valor } = req.body;
        if (valor < 0 || valor > 4) {
            return res.status(400).json({ error: 'Valor debe estar entre 0 y 4' });
        }
        await respuestaModel.save(id, id_pregunta, valor);
        res.json({ message: 'Respuesta guardada' });
    } catch (err) {
        next(err);
    }
};

// Finalizar evaluación y calcular resultados
const finalizarEvaluacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Aquí implementaremos la lógica de cálculo más adelante
        // Por ahora solo cambiamos el estado
        await evaluacionModel.updateStatus(id, 'Completada');
        res.json({ message: 'Evaluación finalizada. Próximamente los resultados.' });
    } catch (err) {
        next(err);
    }
};

// Obtener resultados de una evaluación
const getResultados = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        const global = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM RESULTADO_GLOBAL WHERE id_evaluacion = @id');
        const categorias = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM RESULTADO_CATEGORIA WHERE id_evaluacion = @id');
        const dominios = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM RESULTADO_DOMINIO WHERE id_evaluacion = @id');
        res.json({
            global: global.recordset[0] || null,
            categorias: categorias.recordset || [],
            dominios: dominios.recordset || []
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPreguntasGuiaI,
    guardarGuiaI,
    evaluarGuiaI,
    iniciarEvaluacion,
    getPreguntas,
    guardarRespuesta,
    finalizarEvaluacion,
    getResultados
};