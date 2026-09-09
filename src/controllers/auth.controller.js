const { getDB } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña requeridos' });
        }

        const db = getDB();
        const user = db.prepare('SELECT * FROM USUARIO WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const isValid = await bcrypt.compare(password, user.contraseña_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id_usuario, email: user.email, rol: user.id_rol },
            process.env.JWT_SECRET || 'clave_temporal_para_demo',
            { expiresIn: '7d' }
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

        const db = getDB();
        const existCheck = db.prepare('SELECT id_usuario FROM USUARIO WHERE email = ?').get(email);
        if (existCheck) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare(`
            INSERT INTO USUARIO (nombre, email, contraseña_hash, departamento, id_rol)
            VALUES (?, ?, ?, ?, 3)
        `).run(nombre, email, hashedPassword, departamento);

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (err) {
        next(err);
    }
};

module.exports = { login, register };