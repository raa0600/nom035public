const { getDB } = require('../config/database');

const create = (id_empleado) => {
    const db = getDB();
    const result = db.prepare(`
        INSERT INTO EVALUACION (id_empleado, estatus, fecha_aplicacion)
        VALUES (?, 'En_proceso', datetime('now'))
    `).run(id_empleado);
    return result.lastInsertRowid;
};

const findById = (id_evaluacion) => {
    const db = getDB();
    return db.prepare(`
        SELECT e.*, emp.nombre AS empleado_nombre
        FROM EVALUACION e
        JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE e.id_evaluacion = ?
    `).get(id_evaluacion);
};

const updateStatus = (id_evaluacion, status) => {
    const db = getDB();
    const info = db.prepare('UPDATE EVALUACION SET estatus = ? WHERE id_evaluacion = ?').run(status, id_evaluacion);
    return info.changes > 0;
};

const getPreguntasByEvaluacion = (id_evaluacion) => {
    const db = getDB();
    return db.prepare(`
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
    `).all(id_evaluacion);
};

const getEvaluacionesByEmpleado = (id_empleado) => {
    const db = getDB();
    return db.prepare(`
        SELECT id_evaluacion, fecha_aplicacion, estatus, requiere_canalizacion
        FROM EVALUACION
        WHERE id_empleado = ?
        ORDER BY fecha_aplicacion DESC
    `).all(id_empleado);
};

const insertResultadoGlobal = (id_evaluacion, puntaje_bruto, puntaje_maximo, porcentaje, resultado_final) => {
    const db = getDB();
    const result = db.prepare(`
        INSERT INTO RESULTADO_GLOBAL (id_evaluacion, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, resultado_final)
        VALUES (?, ?, ?, ?, ?)
    `).run(id_evaluacion, puntaje_bruto, puntaje_maximo, porcentaje, resultado_final);
    return result.lastInsertRowid;
};

const insertResultadoCategoria = (id_evaluacion, id_categoria, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo) => {
    const db = getDB();
    const result = db.prepare(`
        INSERT INTO RESULTADO_CATEGORIA (id_evaluacion, id_categoria, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, nivel_riesgo)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id_evaluacion, id_categoria, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo);
    return result.lastInsertRowid;
};

const insertResultadoDominio = (id_evaluacion, id_dominio, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo) => {
    const db = getDB();
    const result = db.prepare(`
        INSERT INTO RESULTADO_DOMINIO (id_evaluacion, id_dominio, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, nivel_riesgo)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id_evaluacion, id_dominio, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo);
    return result.lastInsertRowid;
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