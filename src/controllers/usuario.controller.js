const usuarioModel = require('../models/Usuario.model');
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

// ---------- CREAR USUARIO ----------
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

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await usuarioModel.create({
            nombre,
            email,
            contraseña_hash: hashedPassword,
            departamento: departamento || null,
            id_rol: id_rol || 3
        });

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

        await usuarioModel.remove(parseInt(id));
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

        // Generar contraseña aleatoria de 8 caracteres
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