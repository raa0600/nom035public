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

const getEvaluacionesByEmpleado = async (id_empleado) => {
    const pool = getPool();
    const result = await pool.request()
        .input('id_empleado', sql.Int, id_empleado)
        .query(`
            SELECT id_evaluacion, fecha_aplicacion, estatus, requiere_canalizacion
            FROM EVALUACION
            WHERE id_empleado = @id_empleado
            ORDER BY fecha_aplicacion DESC
        `);
    return result.recordset;
};

const insertResultadoGlobal = async (id_evaluacion, puntaje_bruto, puntaje_maximo, porcentaje, resultado_final) => {
    const pool = getPool();
    await pool.request()
        .input('id_eval', sql.Int, id_evaluacion)
        .input('bruto', sql.Int, puntaje_bruto)
        .input('max', sql.Int, puntaje_maximo)
        .input('porc', sql.Decimal(5, 2), porcentaje)
        .input('final', sql.NVarChar(30), resultado_final)
        .query(`
            INSERT INTO RESULTADO_GLOBAL (id_evaluacion, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, resultado_final)
            VALUES (@id_eval, @bruto, @max, @porc, @final)
        `);
};

const insertResultadoCategoria = async (id_evaluacion, id_categoria, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo) => {
    const pool = getPool();
    await pool.request()
        .input('id_eval', sql.Int, id_evaluacion)
        .input('id_cat', sql.Int, id_categoria)
        .input('bruto', sql.Int, puntaje_bruto)
        .input('max', sql.Int, puntaje_maximo)
        .input('porc', sql.Decimal(5, 2), porcentaje)
        .input('nivel', sql.NVarChar(20), nivel_riesgo)
        .query(`
            INSERT INTO RESULTADO_CATEGORIA (id_evaluacion, id_categoria, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, nivel_riesgo)
            VALUES (@id_eval, @id_cat, @bruto, @max, @porc, @nivel)
        `);
};

const insertResultadoDominio = async (id_evaluacion, id_dominio, puntaje_bruto, puntaje_maximo, porcentaje, nivel_riesgo) => {
    const pool = getPool();
    await pool.request()
        .input('id_eval', sql.Int, id_evaluacion)
        .input('id_dom', sql.Int, id_dominio)
        .input('bruto', sql.Int, puntaje_bruto)
        .input('max', sql.Int, puntaje_maximo)
        .input('porc', sql.Decimal(5, 2), porcentaje)
        .input('nivel', sql.NVarChar(20), nivel_riesgo)
        .query(`
            INSERT INTO RESULTADO_DOMINIO (id_evaluacion, id_dominio, puntaje_bruto, puntaje_maximo, puntaje_porcentaje, nivel_riesgo)
            VALUES (@id_eval, @id_dom, @bruto, @max, @porc, @nivel)
        `);
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