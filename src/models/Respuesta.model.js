const { getPool, sql } = require('../config/database');

const save = async (id_evaluacion, id_pregunta, valor) => {
    const pool = getPool();
    await pool.request()
        .input('id_eval', sql.Int, id_evaluacion)
        .input('id_preg', sql.Int, id_pregunta)
        .input('valor', sql.Int, valor)
        .query(`
            IF EXISTS (SELECT 1 FROM RESPUESTA WHERE id_evaluacion = @id_eval AND id_pregunta = @id_preg)
                UPDATE RESPUESTA SET valor_escogido = @valor WHERE id_evaluacion = @id_eval AND id_pregunta = @id_preg
            ELSE
                INSERT INTO RESPUESTA (id_evaluacion, id_pregunta, valor_escogido)
                VALUES (@id_eval, @id_preg, @valor)
        `);
};

const getRespuestasByEvaluacion = async (id_evaluacion) => {
    const pool = getPool();
    const result = await pool.request()
        .input('id_eval', sql.Int, id_evaluacion)
        .query(`
            SELECT r.id_pregunta, r.valor_escogido, p.tipo_puntaje
            FROM RESPUESTA r
            JOIN PREGUNTA p ON r.id_pregunta = p.id_pregunta
            WHERE r.id_evaluacion = @id_eval
        `);
    return result.recordset;
};

module.exports = { save, getRespuestasByEvaluacion };