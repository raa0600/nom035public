const { getPool, sql } = require('../config/database');

const findByEmail = async (email) => {
    const pool = getPool();
    const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT * FROM USUARIO WHERE email = @email');
    return result.recordset[0] || null;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
            SELECT 
                u.*, 
                r.nombre_rol as rol_nombre,
                e.id_empleado,
                e.nombre AS empleado_nombre,
                e.sexo,
                e.edad,
                e.estado_civil,
                e.nivel_estudios,
                e.ocupacion_profesion_puesto,
                e.departamento_seccion_area,
                e.tipo_puesto,
                e.tipo_contratacion,
                e.tipo_personal,
                e.tipo_jornada,
                e.rotacion_turno,
                e.tiempo_exp_puesto,
                e.tiempo_exp_laboral,
                e.email AS empleado_email
            FROM USUARIO u
            LEFT JOIN ROL r ON u.id_rol = r.id_rol
            LEFT JOIN EMPLEADO e ON u.id_empleado = e.id_empleado
            WHERE u.id_usuario = @id
        `);
    return result.recordset[0] || null;
};

const findAll = async () => {
    const pool = getPool();
    const result = await pool.request()
        .query(`
            SELECT u.*, r.nombre_rol as rol_nombre 
            FROM USUARIO u
            LEFT JOIN ROL r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario
        `);
    return result.recordset;
};

const create = async ({ nombre, email, contraseña_hash, departamento, id_rol }) => {
    const pool = getPool();
    const result = await pool.request()
        .input('nombre', sql.NVarChar, nombre)
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, contraseña_hash)
        .input('departamento', sql.NVarChar, departamento || null)
        .input('rol', sql.Int, id_rol || 3)
        .query(`
            INSERT INTO USUARIO (nombre, email, contraseña_hash, departamento, id_rol)
            VALUES (@nombre, @email, @password, @departamento, @rol);
            SELECT SCOPE_IDENTITY() AS id;
        `);
    const newId = result.recordset[0].id;
    return findById(newId);
};

const updateRole = async (id_usuario, id_rol) => {
    const pool = getPool();
    await pool.request()
        .input('id', sql.Int, id_usuario)
        .input('rol', sql.Int, id_rol)
        .query('UPDATE USUARIO SET id_rol = @rol WHERE id_usuario = @id');
    return findById(id_usuario);
};

const remove = async (id_usuario) => {
    const pool = getPool();
    await pool.request()
        .input('id', sql.Int, id_usuario)
        .query('DELETE FROM USUARIO WHERE id_usuario = @id');
};

const existsEmail = async (email) => {
    const pool = getPool();
    const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT id_usuario FROM USUARIO WHERE email = @email');
    return result.recordset.length > 0;
};

// ============================================================
// UPDATE DINÁMICO - solo actualiza los campos proporcionados
// ============================================================
const update = async (id_usuario, fields) => {
    const pool = getPool();

    // Construir dinámicamente la parte SET de la consulta
    const setClauses = [];
    const paramNames = [];

    // Mapeo de campos permitidos
    const allowedFields = ['nombre', 'email', 'departamento', 'contraseña_hash', 'id_rol'];

    for (const [key, value] of Object.entries(fields)) {
        if (allowedFields.includes(key) && value !== undefined && value !== null) {
            const paramName = `p${setClauses.length}`;
            setClauses.push(`${key} = @${paramName}`);
            paramNames.push({ name: paramName, value, type: key === 'id_rol' ? sql.Int : sql.NVarChar });
        }
    }

    if (setClauses.length === 0) {
        throw new Error('No hay campos para actualizar');
    }

    const query = `UPDATE USUARIO SET ${setClauses.join(', ')} WHERE id_usuario = @id`;
    const request = pool.request();
    paramNames.forEach(({ name, value, type }) => {
        request.input(name, type, value);
    });
    request.input('id', sql.Int, id_usuario);

    await request.query(query);
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