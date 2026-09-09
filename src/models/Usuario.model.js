const { getDB } = require('../config/database');

const findByEmail = async (email) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM USUARIO WHERE email = ?', [email], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const findById = async (id) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT u.*, r.nombre_rol, e.*
            FROM USUARIO u
            LEFT JOIN ROL r ON u.id_rol = r.id_rol
            LEFT JOIN EMPLEADO e ON u.id_empleado = e.id_empleado
            WHERE u.id_usuario = ?
        `, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const findAll = async () => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT u.*, r.nombre_rol 
            FROM USUARIO u
            LEFT JOIN ROL r ON u.id_rol = r.id_rol
        `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const create = async ({ nombre, email, contraseña_hash, departamento, id_rol }) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO USUARIO (nombre, email, contraseña_hash, departamento, id_rol)
            VALUES (?, ?, ?, ?, ?)
        `, [nombre, email, contraseña_hash, departamento, id_rol || 3], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

const updateRole = async (id_usuario, id_rol) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run('UPDATE USUARIO SET id_rol = ? WHERE id_usuario = ?', [id_rol, id_usuario], function(err) {
            if (err) reject(err);
            else resolve(findById(id_usuario));
        });
    });
};

const remove = async (id_usuario) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM USUARIO WHERE id_usuario = ?', [id_usuario], function(err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
        });
    });
};

const existsEmail = async (email) => {
    const db = getDB();
    return new Promise((resolve, reject) => {
        db.get('SELECT id_usuario FROM USUARIO WHERE email = ?', [email], (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
        });
    });
};

const update = async (id_usuario, fields) => {
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

    return new Promise((resolve, reject) => {
        db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve(findById(id_usuario));
        });
    });
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