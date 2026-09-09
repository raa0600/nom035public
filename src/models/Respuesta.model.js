const { getDB } = require('../config/database');

const save = async (id_evaluacion, id_pregunta, valor) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO RESPUESTA (id_evaluacion, id_pregunta, valor_escogido)
            VALUES (?, ?, ?)
            ON CONFLICT(id_evaluacion, id_pregunta)
            DO UPDATE SET valor_escogido = excluded.valor_escogido
        `, [id_evaluacion, id_pregunta, valor], function(err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
        });
    });
};

const getRespuestasByEvaluacion = async (id_evaluacion) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT r.id_pregunta, r.valor_escogido, p.tipo_puntaje
            FROM RESPUESTA r
            JOIN PREGUNTA p ON r.id_pregunta = p.id_pregunta
            WHERE r.id_evaluacion = ?
        `, [id_evaluacion], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

module.exports = { save, getRespuestasByEvaluacion };