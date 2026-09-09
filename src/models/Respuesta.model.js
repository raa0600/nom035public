const { getDB } = require('../config/database');

const save = (id_evaluacion, id_pregunta, valor) => {
    const db = getDB();
    const info = db.prepare(`
        INSERT INTO RESPUESTA (id_evaluacion, id_pregunta, valor_escogido)
        VALUES (?, ?, ?)
        ON CONFLICT(id_evaluacion, id_pregunta)
        DO UPDATE SET valor_escogido = excluded.valor_escogido
    `).run(id_evaluacion, id_pregunta, valor);
    return info.changes > 0;
};

const getRespuestasByEvaluacion = (id_evaluacion) => {
    const db = getDB();
    return db.prepare(`
        SELECT r.id_pregunta, r.valor_escogido, p.tipo_puntaje
        FROM RESPUESTA r
        JOIN PREGUNTA p ON r.id_pregunta = p.id_pregunta
        WHERE r.id_evaluacion = ?
    `).all(id_evaluacion);
};

module.exports = { save, getRespuestasByEvaluacion };