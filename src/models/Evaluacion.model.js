const { getPool, sql } = require('../config/database');

const create = async (id_empleado) => {
    const pool = getPool();
    const result = await pool.request()
        .input('id_empleado', sql.Int, id_empleado)
        .query(`
            INSERT INTO EVALUACION (id_empleado, estatus, fecha_aplicacion)
            VALUES (@id_empleado, 'Pendiente', GETDATE());
            SELECT SCOPE_IDENTITY() AS id;
        `);
    return result.recordset[0].id;
};

const findById = async (id_evaluacion) => {
    const pool = getPool();
    const result = await pool.request()
        .input('id', sql.Int, id_evaluacion)
        .query(`
            SELECT e.*, emp.nombre AS empleado_nombre
            FROM EVALUACION e
            JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
            WHERE e.id_evaluacion = @id
        `);
    return result.recordset[0];
};

const updateStatus = async (id_evaluacion, status) => {
    const pool = getPool();
    await pool.request()
        .input('id', sql.Int, id_evaluacion)
        .input('status', sql.NVarChar, status)
        .query('UPDATE EVALUACION SET estatus = @status WHERE id_evaluacion = @id');
};

const getPreguntasByEvaluacion = async (id_evaluacion) => {
    const pool = getPool();
    const result = await pool.request()
        .input('id_eval', sql.Int, id_evaluacion)
        .query(`
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
                ISNULL(r.valor_escogido, -1) AS valor_guardado
            FROM PREGUNTA p
            JOIN DIMENSION d ON p.id_dimension = d.id_dimension
            JOIN DOMINIO dom ON d.id_dominio = dom.id_dominio
            JOIN CATEGORIA cat ON dom.id_categoria = cat.id_categoria
            LEFT JOIN RESPUESTA r ON r.id_pregunta = p.id_pregunta AND r.id_evaluacion = @id_eval
            ORDER BY cat.id_categoria, dom.id_dominio, d.id_dimension, p.numero
        `);
    return result.recordset;
};

module.exports = { create, findById, updateStatus, getPreguntasByEvaluacion };