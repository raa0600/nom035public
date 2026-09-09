const { getDB } = require('../config/database');

const create = async (id_empleado) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO EVALUACION (id_empleado, estatus, fecha_aplicacion)
            VALUES (?, 'En_proceso', datetime('now'))
        `, [id_empleado], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

const findById = async (id_evaluacion) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT e.*, emp.nombre AS empleado_nombre
            FROM EVALUACION e
            JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
            WHERE e.id_evaluacion = ?
        `, [id_evaluacion], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const updateStatus = async (id_evaluacion, status) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run('UPDATE EVALUACION SET estatus = ? WHERE id_evaluacion = ?', [status, id_evaluacion], function(err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
        });
    });
};

const getPreguntasByEvaluacion = async (id_evaluacion) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                p.id_pregunta,
                p.numero,
                p.texto,
                p.tipo_puntaje,
                d.id_dimension,
                d.nombre AS dimension_nombre,
                dom.id_dominio,
                dom.nombre AS dominio_nombre,
                cat.id_categoria,
                cat.nombre AS categoria_nombre,
                COALESCE(r.valor_escogido, -1) AS valor_guardado
            FROM PREGUNTA p
            JOIN DIMENSION d ON p.id_dimension = d.id_dimension
            JOIN DOMINIO dom ON d.id_dominio = dom.id_dominio
            JOIN CATEGORIA cat ON dom.id_categoria = cat.id_categoria
            LEFT JOIN RESPUESTA r ON r.id_pregunta = p.id_pregunta AND r.id_evaluacion = ?
            ORDER BY cat.id_categoria, dom.id_dominio, d.id_dimension, p.numero
        `, [id_evaluacion], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

const getEvaluacionesByEmpleado = async (id_empleado) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT id_evaluacion, fecha_aplicacion, estatus, requiere_canalizacion
            FROM EVALUACION
            WHERE id_empleado = ?
            ORDER BY fecha_aplicacion DESC
        `, [id_empleado], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

const insertResultadoGlobal = async (id_evaluacion, puntaje_bruto, puntaje_maximo, porcentaje, resultado_final) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO RESULTADO_GLOBAL (id_evaluacion, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, resultado_final)
            VALUES (?, ?, ?, ?, ?)
        `, [id_evaluacion, puntaje_bruto, puntaje_maximo, porcentaje, resultado_final], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

const insertResultadoCategoria = async (id_evaluacion, id_categoria, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO RESULTADO_CATEGORIA (id_evaluacion, id_categoria, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, nivel_riesgo)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [id_evaluacion, id_categoria, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

const insertResultadoDominio = async (id_evaluacion, id_dominio, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO RESULTADO_DOMINIO (id_evaluacion, id_dominio, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, nivel_riesgo)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [id_evaluacion, id_dominio, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

module.exports = {
    create,
    findById,
    updateStatus,
    getPreguntasByEvaluacion,
    getEvaluacionesByEmpleado,
    insertResultadoGlobal,
    insertResultadoCategoria,
    insertResultadoDominio
};