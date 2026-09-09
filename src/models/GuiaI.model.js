const { getDB } = require('../config/database');

const getPreguntas = () => {
    const db = getDB();
    return db.prepare('SELECT * FROM PREGUNTA_GUIA_I ORDER BY numero').all();
};

const saveRespuestas = (id_evaluacion, respuestas) => {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO RESPUESTA_GUIA_I (id_evaluacion, id_pregunta_guia_i, respuesta)
        VALUES (?, ?, ?)
    `);

    const transaction = db.transaction((items) => {
        for (const { id_pregunta, respuesta } of items) {
            stmt.run(id_evaluacion, id_pregunta, respuesta ? 1 : 0);
        }
    });

    transaction(respuestas);
};

const getRespuestas = (id_evaluacion) => {
    const db = getDB();
    return db.prepare(`
        SELECT r.id_pregunta_guia_i, r.respuesta, p.numero
        FROM RESPUESTA_GUIA_I r
        JOIN PREGUNTA_GUIA_I p ON r.id_pregunta_guia_i = p.id_pregunta_guia_i
        WHERE r.id_evaluacion = ?
        ORDER BY p.numero
    `).all(id_evaluacion);
};

module.exports = { getPreguntas, saveRespuestas, getRespuestas };