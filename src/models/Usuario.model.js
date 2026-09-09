const { getDB } = require('../config/database');

const findByEmail = (email) => {
    const db = getDB();
    return db.prepare('SELECT * FROM USUARIO WHERE email = ?').get(email);
};

const findById = (id) => {
    const db = getDB();
    return db.prepare(`
        SELECT u.*, r.nombre_rol, e.*
        FROM USUARIO u
        LEFT JOIN ROL r ON u.id_rol = r.id_rol
        LEFT JOIN EMPLEADO e ON u.id_empleado = e.id_empleado
        WHERE u.id_usuario = ?
    `).get(id);
};

const findAll = () => {
    const db = getDB();
    return db.prepare(`
        SELECT u.*, r.nombre_rol 
        FROM USUARIO u
        LEFT JOIN ROL r ON u.id_rol = r.id_rol
    `).all();
};

const create = ({ nombre, email, contraseña_hash, departamento, id_rol }) => {
    const db = getDB();
    const result = db.prepare(`
        INSERT INTO USUARIO (nombre, email, contraseña_hash, departamento, id_rol)
        VALUES (?, ?, ?, ?, ?)
    `).run(nombre, email, contraseña_hash, departamento, id_rol || 3);
    return result.lastInsertRowid;
};

const updateRole = (id_usuario, id_rol) => {
    const db = getDB();
    db.prepare('UPDATE USUARIO SET id_rol = ? WHERE id_usuario = ?').run(id_rol, id_usuario);
    return findById(id_usuario);
};

const remove = (id_usuario) => {
    const db = getDB();
    const info = db.prepare('DELETE FROM USUARIO WHERE id_usuario = ?').run(id_usuario);
    return info.changes > 0;
};

const existsEmail = (email) => {
    const db = getDB();
    const row = db.prepare('SELECT id_usuario FROM USUARIO WHERE email = ?').get(email);
    return !!row;
};

const update = (id_usuario, fields) => {
    const db = getDB();
    const allowed = ['nombre', 'email', 'departamento', 'contraseña_hash', 'id_rol'];
    const setClauses = [];
    const values = [];

    for (const key of allowed) {
        if (fields[key] !== undefined && fields[key] !== null) {
            setClauses.push(`${key} = ?`);
            values.push(fields[key]);
        }
    }

    if (setClauses.length === 0) throw new Error('No hay campos para actualizar');

    values.push(id_usuario);
    const sql = `UPDATE USUARIO SET ${setClauses.join(', ')} WHERE id_usuario = ?`;
    db.prepare(sql).run(...values);
    return findById(id_usuario);
};

module.exports = {
    findByEmail,
    findById,
    findAll,
    create,
    updateRole,
    remove,
    existsEmail,
    update
};