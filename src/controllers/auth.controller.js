const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('📩 Email recibido:', email);
        console.log('🔑 Password recibido:', password);
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña requeridos' });
        }

        const pool = getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM USUARIO WHERE email = @email');

        if (result.recordset.length === 0) {
            console.log('❌ Usuario no encontrado:', email);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.recordset[0];
        console.log('✅ Usuario encontrado:', user.email);
        console.log('🔑 Hash almacenado:', user.contraseña_hash);

        const isValid = await bcrypt.compare(password, user.contraseña_hash);
        console.log('🔐 ¿Contraseña válida?', isValid);

        if (!isValid) {
            console.log('❌ Contraseña incorrecta para:', email);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id_usuario, email: user.email, rol: user.id_rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id_usuario,
                email: user.email,
                nombre: user.nombre,
                departamento: user.departamento,
                rol: user.id_rol
            }
        });
    } catch (err) {
        next(err);
    }
};

const register = async (req, res, next) => {
    try {
        const { nombre, email, password, departamento } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' });
        }

        const pool = getPool();
        const existCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id_usuario FROM USUARIO WHERE email = @email');

        if (existCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .input('departamento', sql.NVarChar, departamento || null)
            .input('rol', sql.Int, 3)
            .query(`
                INSERT INTO USUARIO (nombre, email, contraseña_hash, departamento, id_rol)
                VALUES (@nombre, @email, @password, @departamento, @rol)
            `);

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (err) {
        next(err);
    }
};

// ============================================================
// EXPORTAR CORRECTAMENTE
// ============================================================
module.exports = { login, register };