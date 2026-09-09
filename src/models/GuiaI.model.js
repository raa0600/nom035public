const { getDB } = require('../config/database');

const getPreguntas = async () => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM PREGUNTA_GUIA_I ORDER BY numero', (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

const saveRespuestas = async (id_evaluacion, respuestas) => {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO RESPUESTA_GUIA_I (id_evaluacion, id_pregunta_guia_i, respuesta)
        VALUES (?, ?, ?)
    `);

    for (const { id_pregunta, respuesta } of respuestas) {
        await new Promise((resolve, reject) => {
            stmt.run(id_evaluacion, id_pregunta, respuesta ? 1 : 0, function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    stmt.finalize();
};

const getRespuestas = async (id_evaluacion) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT r.id_pregunta_guia_i, r.respuesta, p.numero
            FROM RESPUESTA_GUIA_I r
            JOIN PREGUNTA_GUIA_I p ON r.id_pregunta_guia_i = p.id_pregunta_guia_i
            WHERE r.id_evaluacion = ?
            ORDER BY p.numero
        `, [id_evaluacion], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

module.exports = { getPreguntas, saveRespuestas, getRespuestas };