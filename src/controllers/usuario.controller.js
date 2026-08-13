const usuarioModel = require('../models/Usuario.model');
const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

// ---------- OBTENER TODOS LOS USUARIOS ----------
const getUsuarios = async (req, res, next) => {
    try {
        const usuarios = await usuarioModel.findAll();
        const sanitized = usuarios.map(u => {
            const { contraseña_hash, ...rest } = u;
            return rest;
        });
        res.json(sanitized);
    } catch (err) {
        next(err);
    }
};

// ---------- OBTENER PERFIL PROPIO ----------
const getPerfil = async (req, res, next) => {
    try {
        const user = await usuarioModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const { contraseña_hash, ...rest } = user;
        res.json(rest);
    } catch (err) {
        next(err);
    }
};

// ---------- CREAR USUARIO (con empleado automático) ----------
const createUsuario = async (req, res, next) => {
    try {
        const { nombre, email, password, departamento, id_rol } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
        }

        const exists = await usuarioModel.existsEmail(email);
        if (exists) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const pool = getPool();
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Insertar en USUARIO
        const resultUser = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .input('departamento', sql.NVarChar, departamento || null)
            .input('rol', sql.Int, id_rol || 3)
            .query(`
                INSERT INTO USUARIO (nombre, email, contraseña_hash, departamento, id_rol)
                VALUES (@nombre, @email, @password, @departamento, @rol);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        const id_usuario = resultUser.recordset[0].id;

        // 2. Insertar en EMPLEADO
        const resultEmpleado = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, email)
            .input('departamento', sql.NVarChar, departamento || null)
            .query(`
                INSERT INTO EMPLEADO (nombre, email, departamento_seccion_area)
                VALUES (@nombre, @email, @departamento);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        const id_empleado = resultEmpleado.recordset[0].id;

        // 3. Vincular USUARIO con EMPLEADO
        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_empleado', sql.Int, id_empleado)
            .query('UPDATE USUARIO SET id_empleado = @id_empleado WHERE id_usuario = @id_usuario');

        // 4. Obtener usuario completo
        const newUser = await usuarioModel.findById(id_usuario);
        const { contraseña_hash, ...rest } = newUser;
        res.status(201).json(rest);
    } catch (err) {
        next(err);
    }
};

// ---------- ACTUALIZAR ROL ----------
const updateRol = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id_rol } = req.body;

        if (!id_rol) {
            return res.status(400).json({ error: 'id_rol es requerido' });
        }

        const user = await usuarioModel.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const updated = await usuarioModel.updateRole(parseInt(id), id_rol);
        const { contraseña_hash, ...rest } = updated;
        res.json(rest);
    } catch (err) {
        next(err);
    }
};

// ---------- ELIMINAR USUARIO ----------
const deleteUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
        }

        const user = await usuarioModel.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Eliminar también el empleado asociado (opcional)
        const pool = getPool();
        await pool.request()
            .input('id_usuario', sql.Int, id)
            .query('DELETE FROM USUARIO WHERE id_usuario = @id_usuario');
        // Si quieres eliminar el empleado, puedes hacerlo con una consulta adicional

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
        next(err);
    }
};

// ---------- ACTUALIZAR USUARIO COMPLETO ----------
const updateUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, email, password, id_rol } = req.body;

        const user = await usuarioModel.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const updateData = {
            nombre: nombre || user.nombre,
            email: email || user.email,
            id_rol: id_rol !== undefined ? id_rol : user.id_rol
        };

        if (password && password.trim() !== '') {
            updateData.contraseña_hash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await usuarioModel.update(parseInt(id), updateData);
        const { contraseña_hash, ...rest } = updatedUser;
        res.json(rest);
    } catch (err) {
        next(err);
    }
};

// ---------- RESTABLECER CONTRASEÑA ----------
const resetPassword = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await usuarioModel.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nuevaContraseña = '';
        for (let i = 0; i < 8; i++) {
            nuevaContraseña += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);
        await usuarioModel.update(parseInt(id), { contraseña_hash: hashedPassword });

        res.json({ nueva_contraseña: nuevaContraseña });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getUsuarios,
    getPerfil,
    createUsuario,
    updateRol,
    deleteUsuario,
    updateUsuario,
    resetPassword
};