const { getPool, sql } = require('../config/database');

// Obtener todas las preguntas de la Guía I
const getPreguntas = async () => {
    const pool = getPool();
    const result = await pool.request()
        .query('SELECT * FROM PREGUNTA_GUIA_I ORDER BY numero');
    return result.recordset;
};

// Guardar respuestas de la Guía I
const saveRespuestas = async (id_evaluacion, respuestas) => {
    const pool = getPool();
    for (const { id_pregunta, respuesta } of respuestas) {
        await pool.request()
            .input('id_eval', sql.Int, id_evaluacion)
            .input('id_preg', sql.Int, id_pregunta)
            .input('resp', sql.Bit, respuesta)
            .query(`
                INSERT INTO RESPUESTA_GUIA_I (id_evaluacion, id_pregunta_guia_i, respuesta)
                VALUES (@id_eval, @id_preg, @resp)
            `);
    }
};

// Obtener respuestas de una evaluación
const getRespuestas = async (id_evaluacion) => {
    const pool = getPool();
    const result = await pool.request()
        .input('id_eval', sql.Int, id_evaluacion)
        .query(`
            SELECT r.id_pregunta_guia_i, r.respuesta, p.numero
            FROM RESPUESTA_GUIA_I r
            JOIN PREGUNTA_GUIA_I p ON r.id_pregunta_guia_i = p.id_pregunta_guia_i
            WHERE r.id_evaluacion = @id_eval
            ORDER BY p.numero
        `);
    return result.recordset;
};

module.exports = { getPreguntas, saveRespuestas, getRespuestas };