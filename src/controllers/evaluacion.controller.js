const evaluacionModel = require('../models/Evaluacion.model');
const usuarioModel = require('../models/Usuario.model');
const respuestaModel = require('../models/Respuesta.model');
const guiaIModel = require('../models/GuiaI.model');
const { getDB } = require('../config/database');

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
            const db = getDB();
            await new Promise((resolve, reject) => {
                db.run('UPDATE EVALUACION SET requiere_canalizacion = 1 WHERE id_evaluacion = ?', [id], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
            await evaluacionModel.updateStatus(id, 'En_proceso');
            return res.json({
                message: 'Se detectó canalización. Continúe con el cuestionario principal.',
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
        const db = getDB();
        const userId = req.user.id;

        const user = await new Promise((resolve, reject) => {
            db.get('SELECT id_usuario, email, nombre, id_empleado FROM USUARIO WHERE id_usuario = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        let id_empleado = user.id_empleado;

        if (!id_empleado) {
            const empleadoExistente = await new Promise((resolve, reject) => {
                db.get('SELECT id_empleado FROM EMPLEADO WHERE email = ?', [user.email], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (empleadoExistente) {
                id_empleado = empleadoExistente.id_empleado;
            } else {
                id_empleado = await new Promise((resolve, reject) => {
                    db.run('INSERT INTO EMPLEADO (nombre, email) VALUES (?, ?)', [user.nombre, user.email], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                });
            }

            await new Promise((resolve, reject) => {
                db.run('UPDATE USUARIO SET id_empleado = ? WHERE id_usuario = ?', [id_empleado, userId], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
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
        1: [5, 9, 11, 14],
        2: [15, 30, 45, 60],
        3: [5, 7, 10, 13],
        4: [14, 29, 42, 58],
        5: [10, 14, 18, 23]
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
        1: [5, 9, 11, 14],
        2: [15, 21, 27, 37],
        3: [11, 16, 21, 25],
        4: [1, 2, 4, 6],
        5: [4, 6, 8, 10],
        6: [9, 12, 16, 20],
        7: [10, 13, 17, 21],
        8: [7, 10, 13, 16],
        9: [6, 10, 14, 18],
        10: [4, 6, 8, 10]
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
        const db = getDB();

        const respuestas = await respuestaModel.getRespuestasByEvaluacion(id);
        if (respuestas.length === 0) {
            return res.status(400).json({ error: 'No hay respuestas guardadas para esta evaluación.' });
        }

        const preguntas = await evaluacionModel.getPreguntasByEvaluacion(id);
        const preguntasMap = {};
        preguntas.forEach(p => { preguntasMap[p.id_pregunta] = p; });

        const respuestasMap = {};
        respuestas.forEach(r => { respuestasMap[r.id_pregunta] = r.valor_escogido; });

        const catPuntajes = {};
        const domPuntajes = {};
        let totalBruto = 0;
        let totalMaximo = 0;

        for (const [id_pregunta, valor] of Object.entries(respuestasMap)) {
            const pregunta = preguntasMap[id_pregunta];
            if (!pregunta) continue;

            const tipo = pregunta.tipo_puntaje.toLowerCase();
            let puntaje = valor;

            if (tipo === 'inverso' || tipo === 'inversa' || tipo === '0') {
                puntaje = 4 - valor;
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
        const db = getDB();
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT id_empleado FROM USUARIO WHERE id_usuario = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user?.id_empleado) {
            return res.json([]);
        }

        const evaluaciones = await evaluacionModel.getEvaluacionesByEmpleado(user.id_empleado);
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
        const db = getDB();
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT id_empleado FROM USUARIO WHERE id_usuario = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const id_empleado = user?.id_empleado;
        if (!id_empleado) return res.json(null);

        const evaluacion = await new Promise((resolve, reject) => {
            db.get(`
                SELECT id_evaluacion, estatus, fecha_aplicacion
                FROM EVALUACION
                WHERE id_empleado = ? AND estatus IN ('En_proceso', 'Completada')
                ORDER BY fecha_aplicacion DESC
                LIMIT 1
            `, [id_empleado], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.json(evaluacion || null);
    } catch (err) {
        next(err);
    }
};

// ============================================================
// REPORTES
// ============================================================

const getEvaluacionesCompletadas = async (req, res, next) => {
    try {
        const db = getDB();
        const result = await new Promise((resolve, reject) => {
            db.all(`
                SELECT e.id_evaluacion, emp.nombre, emp.departamento_seccion_area, e.fecha_aplicacion, e.estatus
                FROM EVALUACION e
                JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
                WHERE e.estatus = 'Completada'
                ORDER BY e.fecha_aplicacion DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        res.json(result);
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
        const db = getDB();

        const empleadoInfo = await new Promise((resolve, reject) => {
            db.get(`
                SELECT emp.nombre AS empleado_nombre, e.fecha_aplicacion
                FROM EVALUACION e
                JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
                WHERE e.id_evaluacion = ?
            `, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row || {});
            });
        });

        const global = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM RESULTADO_GLOBAL WHERE id_evaluacion = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });

        const categorias = await new Promise((resolve, reject) => {
            db.all(`
                SELECT rc.id_resultado_cat, rc.id_evaluacion, rc.id_categoria, c.nombre AS categoria_nombre,
                       rc.puntaje_bruto, rc.puntaje_maximo, rc.puntaje_porcentaje, rc.nivel_riesgo
                FROM RESULTADO_CATEGORIA rc
                JOIN CATEGORIA c ON rc.id_categoria = c.id_categoria
                WHERE rc.id_evaluacion = ?
                ORDER BY rc.id_categoria
            `, [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const dominios = await new Promise((resolve, reject) => {
            db.all(`
                SELECT rd.id_resultado_dom, rd.id_evaluacion, rd.id_dominio, d.nombre AS dominio_nombre,
                       rd.puntaje_bruto, rd.puntaje_maximo, rd.puntaje_porcentaje, rd.nivel_riesgo
                FROM RESULTADO_DOMINIO rd
                JOIN DOMINIO d ON rd.id_dominio = d.id_dominio
                WHERE rd.id_evaluacion = ?
                ORDER BY rd.id_dominio
            `, [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        res.json({
            global,
            categorias,
            dominios,
            empleado_nombre: empleadoInfo.empleado_nombre || 'No disponible',
            fecha_finalizacion: empleadoInfo.fecha_aplicacion ? new Date(empleadoInfo.fecha_aplicacion).toLocaleDateString() : 'No disponible'
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
        const db = getDB();
        const result = await new Promise((resolve, reject) => {
            db.all(`
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
                WHERE e.requiere_canalizacion = 1 AND e.estatus = 'Completada'
                ORDER BY e.fecha_aplicacion DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const deleteEvaluacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const evalRow = await new Promise((resolve, reject) => {
            db.get('SELECT requiere_canalizacion FROM EVALUACION WHERE id_evaluacion = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!evalRow) {
            return res.status(404).json({ error: 'Evaluación no encontrada' });
        }

        if (!evalRow.requiere_canalizacion) {
            return res.status(400).json({ error: 'Solo se pueden eliminar evaluaciones con canalización' });
        }

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM RESPUESTA_GUIA_I WHERE id_evaluacion = ?', [id], function(err) { if (err) reject(err); else resolve(); });
        });
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM RESPUESTA WHERE id_evaluacion = ?', [id], function(err) { if (err) reject(err); else resolve(); });
        });
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM RESULTADO_GLOBAL WHERE id_evaluacion = ?', [id], function(err) { if (err) reject(err); else resolve(); });
        });
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM RESULTADO_CATEGORIA WHERE id_evaluacion = ?', [id], function(err) { if (err) reject(err); else resolve(); });
        });
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM RESULTADO_DOMINIO WHERE id_evaluacion = ?', [id], function(err) { if (err) reject(err); else resolve(); });
        });
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM EVALUACION WHERE id_evaluacion = ?', [id], function(err) { if (err) reject(err); else resolve(); });
        });

        res.json({ message: 'Canalización eliminada correctamente' });
    } catch (err) {
        next(err);
    }
};

// ============================================================
// GRÁFICAS
// ============================================================
const getDatosGraficas = async (req, res, next) => {
    try {
        const db = getDB();

        const nivelesGlobal = await new Promise((resolve, reject) => {
            db.all(`
                SELECT rg.resultado_final, COUNT(*) AS total
                FROM RESULTADO_GLOBAL rg
                JOIN EVALUACION e ON rg.id_evaluacion = e.id_evaluacion
                WHERE e.estatus = 'Completada'
                GROUP BY rg.resultado_final
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const topCategorias = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.nombre AS nombre, AVG(rc.puntaje_porcentaje) AS promedio
                FROM RESULTADO_CATEGORIA rc
                JOIN CATEGORIA c ON rc.id_categoria = c.id_categoria
                JOIN EVALUACION e ON rc.id_evaluacion = e.id_evaluacion
                WHERE e.estatus = 'Completada'
                GROUP BY c.nombre
                ORDER BY promedio DESC
                LIMIT 10
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const topDominios = await new Promise((resolve, reject) => {
            db.all(`
                SELECT d.nombre AS nombre, AVG(rd.puntaje_porcentaje) AS promedio
                FROM RESULTADO_DOMINIO rd
                JOIN DOMINIO d ON rd.id_dominio = d.id_dominio
                JOIN EVALUACION e ON rd.id_evaluacion = e.id_evaluacion
                WHERE e.estatus = 'Completada'
                GROUP BY d.nombre
                ORDER BY promedio DESC
                LIMIT 10
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const reportes = await new Promise((resolve, reject) => {
            db.all(`
                SELECT e.id_evaluacion, emp.nombre, rg.puntaje_bruto, rg.resultado_final
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
                END, rg.puntaje_bruto DESC, e.fecha_aplicacion DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const canalizaciones = await new Promise((resolve, reject) => {
            db.all(`
                SELECT e.id_evaluacion, emp.nombre, e.fecha_aplicacion
                FROM EVALUACION e
                JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
                WHERE e.requiere_canalizacion = 1 AND e.estatus = 'Completada'
                ORDER BY e.fecha_aplicacion DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        res.json({
            nivelesGlobal,
            topCategorias,
            topDominios,
            reportes,
            canalizaciones
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