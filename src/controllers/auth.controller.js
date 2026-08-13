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

        // Buscar usuario
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM USUARIO WHERE email = @email');

        if (result.recordset.length === 0) {
            console.log('❌ Usuario no encontrado:', email);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.recordset[0];
        console.log('✅ Usuario encontrado:', user.email);

        // Verificar contraseña
        const isValid = await bcrypt.compare(password, user.contraseña_hash);
        console.log('🔐 ¿Contraseña válida?', isValid);

        if (!isValid) {
            console.log('❌ Contraseña incorrecta para:', email);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // ---------- NUEVO: Verificar y crear empleado si no existe ----------
        if (!user.id_empleado) {
            console.log('🔄 Usuario sin empleado asociado. Creando...');
            
            // Buscar si ya existe un empleado con ese email
            const empleadoExistente = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT id_empleado FROM EMPLEADO WHERE email = @email');

            let id_empleado;
            if (empleadoExistente.recordset.length > 0) {
                id_empleado = empleadoExistente.recordset[0].id_empleado;
                console.log('✅ Empleado encontrado por email');
            } else {
                // Crear nuevo empleado
                const resultEmpleado = await pool.request()
                    .input('nombre', sql.NVarChar, user.nombre)
                    .input('email', sql.NVarChar, user.email)
                    .input('departamento', sql.NVarChar, user.departamento || null)
                    .query(`
                        INSERT INTO EMPLEADO (nombre, email, departamento_seccion_area)
                        VALUES (@nombre, @email, @departamento);
                        SELECT SCOPE_IDENTITY() AS id;
                    `);
                id_empleado = resultEmpleado.recordset[0].id;
                console.log('✅ Nuevo empleado creado');
            }

            // Vincular usuario con empleado
            await pool.request()
                .input('id_usuario', sql.Int, user.id_usuario)
                .input('id_empleado', sql.Int, id_empleado)
                .query('UPDATE USUARIO SET id_empleado = @id_empleado WHERE id_usuario = @id_usuario');

            // Actualizar objeto user
            user.id_empleado = id_empleado;
        }

        // Generar token
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

module.exports = { login, register };