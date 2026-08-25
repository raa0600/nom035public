const evaluacionModel = require('../models/Evaluacion.model');
const usuarioModel = require('../models/Usuario.model');
const respuestaModel = require('../models/Respuesta.model');
const guiaIModel = require('../models/GuiaI.model');
const { getPool, sql } = require('../config/database');

// ============================================================
// GUÍA DE REFERENCIA I
// ============================================================

const getPreguntasGuiaI = async (req, res, next) => {
    try {
        const preguntas = await guiaIModel.getPreguntas();
        res.json(preguntas);
    } catch (err) {
        next(err);
    }
};

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

const iniciarEvaluacion = async (req, res, next) => {
    try {
        const pool = getPool();
        const userId = req.user.id;

        const userResult = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT id_usuario, email, nombre, id_empleado FROM USUARIO WHERE id_usuario = @id');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        let user = userResult.recordset[0];
        let id_empleado = user.id_empleado;

        if (!id_empleado) {
            const empleadoExistente = await pool.request()
                .input('email', sql.NVarChar, user.email)
                .query('SELECT id_empleado FROM EMPLEADO WHERE email = @email');

            if (empleadoExistente.recordset.length > 0) {
                id_empleado = empleadoExistente.recordset[0].id_empleado;
            } else {
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

            await pool.request()
                .input('id_usuario', sql.Int, userId)
                .input('id_empleado', sql.Int, id_empleado)
                .query('UPDATE USUARIO SET id_empleado = @id_empleado WHERE id_usuario = @id_usuario');
        }

        const id_evaluacion = await evaluacionModel.create(id_empleado);
        res.status(201).json({ id_evaluacion, message: 'Evaluación iniciada' });

    } catch (err) {
        next(err);
    }
};

const getPreguntas = async (req, res, next) => {
    try {
        const { id } = req.params;
        const preguntas = await evaluacionModel.getPreguntasByEvaluacion(id);
        res.json(preguntas);
    } catch (err) {
        next(err);
    }
};

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

// ============================================================
// FUNCIONES AUXILIARES PARA CLASIFICACIÓN
// ============================================================
function clasificarGlobal(puntaje) {
    if (puntaje < 50) return 'Nulo';
    if (puntaje < 75) return 'Bajo';
    if (puntaje < 99) return 'Medio';
    if (puntaje < 140) return 'Alto';
    return 'Muy Alto';
}

function clasificarCategoria(id_categoria, puntaje) {
    const umbrales = {
        1: [5, 9, 11, 14],      // Ambiente de trabajo
        2: [15, 30, 45, 60],    // Factores propios de la actividad
        3: [5, 7, 10, 13],      // Organización del tiempo de trabajo
        4: [14, 29, 42, 58],    // Liderazgo y relaciones en el trabajo
        5: [10, 14, 18, 23]     // Entorno organizacional
    };
    const u = umbrales[id_categoria];
    if (!u) return 'Nulo';
    if (puntaje < u[0]) return 'Nulo';
    if (puntaje < u[1]) return 'Bajo';
    if (puntaje < u[2]) return 'Medio';
    if (puntaje < u[3]) return 'Alto';
    return 'Muy Alto';
}

function clasificarDominio(id_dominio, puntaje) {
    const umbrales = {
        1: [5, 9, 11, 14],      // Condiciones en el ambiente de trabajo
        2: [15, 21, 27, 37],    // Carga de trabajo
        3: [11, 16, 21, 25],    // Falta de control sobre el trabajo
        4: [1, 2, 4, 6],        // Jornada de trabajo
        5: [4, 6, 8, 10],       // Interferencia en la relación trabajo-familia
        6: [9, 12, 16, 20],     // Liderazgo
        7: [10, 13, 17, 21],    // Relaciones en el trabajo
        8: [7, 10, 13, 16],     // Violencia
        9: [6, 10, 14, 18],     // Reconocimiento del desempeño
        10: [4, 6, 8, 10]       // Insuficiente sentido de pertenencia e inestabilidad
    };
    const u = umbrales[id_dominio];
    if (!u) return 'Nulo';
    if (puntaje < u[0]) return 'Nulo';
    if (puntaje < u[1]) return 'Bajo';
    if (puntaje < u[2]) return 'Medio';
    if (puntaje < u[3]) return 'Alto';
    return 'Muy Alto';
}

// ============================================================
// FINALIZAR EVALUACIÓN Y CALCULAR RESULTADOS
// ============================================================
const finalizarEvaluacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const respuestas = await respuestaModel.getRespuestasByEvaluacion(id);
        if (respuestas.length === 0) {
            return res.status(400).json({ error: 'No hay respuestas guardadas para esta evaluación.' });
        }

        const preguntas = await evaluacionModel.getPreguntasByEvaluacion(id);
        const preguntasMap = {};
        preguntas.forEach(p => {
            preguntasMap[p.id_pregunta] = p;
        });

        const respuestasMap = {};
        respuestas.forEach(r => {
            respuestasMap[r.id_pregunta] = r.valor_escogido;
        });

        const catPuntajes = {};
        const domPuntajes = {};
        let totalBruto = 0;
        let totalMaximo = 0;

        for (const [id_pregunta, valor] of Object.entries(respuestasMap)) {
            const pregunta = preguntasMap[id_pregunta];
            if (!pregunta) continue;

            // ============================================================
            // CAMBIO IMPORTANTE: compatible con INVERSO/DIRECTO y variantes
            // ============================================================
            const tipo = pregunta.tipo_puntaje.toLowerCase();
            let puntaje = valor;

            if (tipo === 'inverso' || tipo === 'inversa' || tipo === '0') {
                puntaje = 4 - valor;
            } else if (tipo === 'directo' || tipo === 'directa' || tipo === '1') {
                puntaje = valor;
            } else {
                puntaje = valor;
            }

            if (domPuntajes[pregunta.id_dominio]) {
                domPuntajes[pregunta.id_dominio].bruto += puntaje;
                domPuntajes[pregunta.id_dominio].maximo += 4;
            } else {
                domPuntajes[pregunta.id_dominio] = { bruto: puntaje, maximo: 4 };
            }

            if (catPuntajes[pregunta.id_categoria]) {
                catPuntajes[pregunta.id_categoria].bruto += puntaje;
                catPuntajes[pregunta.id_categoria].maximo += 4;
            } else {
                catPuntajes[pregunta.id_categoria] = { bruto: puntaje, maximo: 4 };
            }

            totalBruto += puntaje;
            totalMaximo += 4;
        }

        const globalNivel = clasificarGlobal(totalBruto);
        const globalPorcentaje = totalMaximo > 0 ? (totalBruto / totalMaximo) * 100 : 0;

        await evaluacionModel.insertResultadoGlobal(id, totalBruto, totalMaximo, globalPorcentaje, globalNivel);

        for (const [id_cat, datos] of Object.entries(catPuntajes)) {
            const nivel = clasificarCategoria(parseInt(id_cat), datos.bruto);
            const porcentaje = datos.maximo > 0 ? (datos.bruto / datos.maximo) * 100 : 0;
            await evaluacionModel.insertResultadoCategoria(id, parseInt(id_cat), datos.bruto, datos.maximo, porcentaje, nivel);
        }

        for (const [id_dom, datos] of Object.entries(domPuntajes)) {
            const nivel = clasificarDominio(parseInt(id_dom), datos.bruto);
            const porcentaje = datos.maximo > 0 ? (datos.bruto / datos.maximo) * 100 : 0;
            await evaluacionModel.insertResultadoDominio(id, parseInt(id_dom), datos.bruto, datos.maximo, porcentaje, nivel);
        }

        await evaluacionModel.updateStatus(id, 'Completada');

        res.json({
            message: 'Evaluación finalizada y resultados calculados.',
            resultado: {
                global: { puntaje: totalBruto, maximo: totalMaximo, porcentaje: globalPorcentaje, nivel: globalNivel },
                categorias: Object.keys(catPuntajes).map(id => ({ id_categoria: id, nivel: clasificarCategoria(parseInt(id), catPuntajes[id].bruto) })),
                dominios: Object.keys(domPuntajes).map(id => ({ id_dominio: id, nivel: clasificarDominio(parseInt(id), domPuntajes[id].bruto) }))
            }
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================
// FUNCIONES PARA PAUSA Y CONTINUACIÓN
// ============================================================

const getEvaluacionesEnCurso = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const pool = getPool();
        const userResult = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT id_empleado FROM USUARIO WHERE id_usuario = @id');

        if (!userResult.recordset[0]?.id_empleado) {
            return res.json([]);
        }
        const id_empleado = userResult.recordset[0].id_empleado;
        const evaluaciones = await evaluacionModel.getEvaluacionesByEmpleado(id_empleado);
        const enCurso = evaluaciones.filter(e => e.estatus === 'En_proceso');
        res.json(enCurso);
    } catch (err) {
        next(err);
    }
};

const getProgresoEvaluacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const respuestas = await respuestaModel.getRespuestasByEvaluacion(id);
        const preguntas = await evaluacionModel.getPreguntasByEvaluacion(id);
        res.json({ respuestas, preguntas });
    } catch (err) {
        next(err);
    }
};

const pausarEvaluacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        await evaluacionModel.updateStatus(id, 'En_proceso');
        res.json({ message: 'Evaluación pausada correctamente.' });
    } catch (err) {
        next(err);
    }
};

// ============================================================
// ESTADO ACTUAL PARA INICIAR EVALUACIÓN
// ============================================================
const getEstadoActual = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const pool = getPool();
        const userResult = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT id_empleado FROM USUARIO WHERE id_usuario = @id');
        const id_empleado = userResult.recordset[0]?.id_empleado;
        if (!id_empleado) {
            return res.json(null);
        }
        const evalResult = await pool.request()
            .input('id_empleado', sql.Int, id_empleado)
            .query(`
                SELECT TOP 1 id_evaluacion, estatus, fecha_aplicacion
                FROM EVALUACION
                WHERE id_empleado = @id_empleado AND estatus IN ('En_proceso', 'Canalizacion_requerida', 'Completada')
                ORDER BY fecha_aplicacion DESC
            `);
        res.json(evalResult.recordset[0] || null);
    } catch (err) {
        next(err);
    }
};

// ============================================================
// REPORTES
// ============================================================

const getEvaluacionesCompletadas = async (req, res, next) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
            SELECT e.id_evaluacion, emp.nombre, emp.departamento_seccion_area, e.fecha_aplicacion, e.estatus
            FROM EVALUACION e
            JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
            WHERE e.estatus = 'Completada'
            ORDER BY e.fecha_aplicacion DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
};

// ============================================================
// RESULTADOS DE UNA EVALUACIÓN
// ============================================================
const getResultados = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const global = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM RESULTADO_GLOBAL WHERE id_evaluacion = @id');

        const categorias = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT rc.id_resultado_cat, rc.id_evaluacion, rc.id_categoria, c.nombre AS categoria_nombre,
                       rc.puntaje_bruto, rc.puntaje_maximo, rc.puntaje_porcentaje, rc.nivel_riesgo
                FROM RESULTADO_CATEGORIA rc
                JOIN CATEGORIA c ON rc.id_categoria = c.id_categoria
                WHERE rc.id_evaluacion = @id
                ORDER BY rc.id_categoria
            `);

        const dominios = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT rd.id_resultado_dom, rd.id_evaluacion, rd.id_dominio, d.nombre AS dominio_nombre,
                       rd.puntaje_bruto, rd.puntaje_maximo, rd.puntaje_porcentaje, rd.nivel_riesgo
                FROM RESULTADO_DOMINIO rd
                JOIN DOMINIO d ON rd.id_dominio = d.id_dominio
                WHERE rd.id_evaluacion = @id
                ORDER BY rd.id_dominio
            `);

        res.json({
            global: global.recordset[0] || null,
            categorias: categorias.recordset || [],
            dominios: dominios.recordset || []
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================
// CANALIZACIONES
// ============================================================
const getCanalizaciones = async (req, res, next) => {
    try {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT 
                    e.id_evaluacion,
                    u.id_usuario,
                    emp.id_empleado,
                    emp.nombre AS empleado_nombre,
                    emp.email AS empleado_email,
                    emp.departamento_seccion_area,
                    e.fecha_aplicacion,
                    e.estatus
                FROM EVALUACION e
                JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
                JOIN USUARIO u ON u.id_empleado = emp.id_empleado
                WHERE e.estatus = 'Canalizacion_requerida'
                ORDER BY e.fecha_aplicacion DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
};

const deleteEvaluacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const evalResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT estatus FROM EVALUACION WHERE id_evaluacion = @id');

        if (evalResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        const estatus = evalResult.recordset[0].estatus;
        if (estatus !== 'Canalizacion_requerida') {
            return res.status(400).json({ error: 'Solo se pueden eliminar evaluaciones en estado de canalización' });
        }

        await pool.request().input('id', sql.Int, id).query('DELETE FROM RESPUESTA_GUIA_I WHERE id_evaluacion = @id');
        await pool.request().input('id', sql.Int, id).query('DELETE FROM RESPUESTA WHERE id_evaluacion = @id');
        await pool.request().input('id', sql.Int, id).query('DELETE FROM RESULTADO_GLOBAL WHERE id_evaluacion = @id');
        await pool.request().input('id', sql.Int, id).query('DELETE FROM RESULTADO_CATEGORIA WHERE id_evaluacion = @id');
        await pool.request().input('id', sql.Int, id).query('DELETE FROM RESULTADO_DOMINIO WHERE id_evaluacion = @id');
        await pool.request().input('id', sql.Int, id).query('DELETE FROM EVALUACION WHERE id_evaluacion = @id');

        res.json({ message: 'Canalización eliminada correctamente' });
    } catch (err) {
        next(err);
    }
};

const getDatosGraficas = async (req, res, next) => {
    try {
        const pool = getPool();

        // Distribución de niveles de riesgo global
        const nivelesGlobal = await pool.request().query(`
            SELECT rg.resultado_final, COUNT(*) AS total
            FROM RESULTADO_GLOBAL rg
            JOIN EVALUACION e ON rg.id_evaluacion = e.id_evaluacion
            WHERE e.estatus = 'Completada'
            GROUP BY rg.resultado_final
        `);

        // Top 10 categorías por promedio de puntaje porcentual
        const topCategorias = await pool.request().query(`
            SELECT TOP 10 c.nombre AS nombre, AVG(rc.puntaje_porcentaje) AS promedio
            FROM RESULTADO_CATEGORIA rc
            JOIN CATEGORIA c ON rc.id_categoria = c.id_categoria
            JOIN EVALUACION e ON rc.id_evaluacion = e.id_evaluacion
            WHERE e.estatus = 'Completada'
            GROUP BY c.nombre
            ORDER BY promedio DESC
        `);

        // Top 10 dominios por promedio de puntaje porcentual
        const topDominios = await pool.request().query(`
            SELECT TOP 10 d.nombre AS nombre, AVG(rd.puntaje_porcentaje) AS promedio
            FROM RESULTADO_DOMINIO rd
            JOIN DOMINIO d ON rd.id_dominio = d.id_dominio
            JOIN EVALUACION e ON rd.id_evaluacion = e.id_evaluacion
            WHERE e.estatus = 'Completada'
            GROUP BY d.nombre
            ORDER BY promedio DESC
        `);

        // Reportes completados ordenados por riesgo (alto a bajo)
        const reportes = await pool.request().query(`
            SELECT TOP 20 e.id_evaluacion, emp.nombre, rg.puntaje_bruto, rg.resultado_final
            FROM EVALUACION e
            JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
            JOIN RESULTADO_GLOBAL rg ON rg.id_evaluacion = e.id_evaluacion
            WHERE e.estatus = 'Completada'
            ORDER BY CASE rg.resultado_final
                WHEN 'Muy Alto' THEN 1
                WHEN 'Alto' THEN 2
                WHEN 'Medio' THEN 3
                WHEN 'Bajo' THEN 4
                ELSE 5
            END, rg.puntaje_bruto DESC
        `);

        // Canalizaciones ordenadas por fecha (más recientes primero)
        const canalizaciones = await pool.request().query(`
            SELECT TOP 20 e.id_evaluacion, emp.nombre, e.fecha_aplicacion
            FROM EVALUACION e
            JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
            WHERE e.estatus = 'Canalizacion_requerida'
            ORDER BY e.fecha_aplicacion DESC
        `);

        res.json({
            nivelesGlobal: nivelesGlobal.recordset,
            topCategorias: topCategorias.recordset,
            topDominios: topDominios.recordset,
            reportes: reportes.recordset,
            canalizaciones: canalizaciones.recordset
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
    getResultados,
    getCanalizaciones,
    deleteEvaluacion,
    getEvaluacionesEnCurso,
    getProgresoEvaluacion,
    pausarEvaluacion,
    getEvaluacionesCompletadas,
    getEstadoActual,
    getDatosGraficas
};