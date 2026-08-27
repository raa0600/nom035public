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
// ---------- CREAR USUARIO (con empleado automático) ----------
const createUsuario = async (req, res, next) => {
    try {
        const {
            nombre,
            email,
            password,
            departamento,
            id_rol,
            sexo = null,
            edad = null,
            estado_civil = null,
            nivel_estudios = null,
            ocupacion_profesion_puesto = null,
            tipo_puesto = null,
            tipo_contratacion = null,
            tipo_personal = null,
            tipo_jornada = null,
            rotacion_turno = null,
            tiempo_exp_puesto = null,
            tiempo_exp_laboral = null
        } = req.body;

        // Validaciones básicas
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

        // 2. Insertar en EMPLEADO con todos los campos
        const resultEmpleado = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, email)
            .input('departamento', sql.NVarChar, departamento || null)
            .input('sexo', sql.NVarChar, sexo)
            .input('edad', sql.Int, edad)
            .input('estado_civil', sql.NVarChar, estado_civil)
            .input('nivel_estudios', sql.NVarChar, nivel_estudios)
            .input('ocupacion', sql.NVarChar, ocupacion_profesion_puesto)
            .input('tipo_puesto', sql.NVarChar, tipo_puesto)
            .input('tipo_contratacion', sql.NVarChar, tipo_contratacion)
            .input('tipo_personal', sql.NVarChar, tipo_personal)
            .input('tipo_jornada', sql.NVarChar, tipo_jornada)
            .input('rotacion', sql.Bit, rotacion_turno)
            .input('exp_puesto', sql.Int, tiempo_exp_puesto)
            .input('exp_laboral', sql.Int, tiempo_exp_laboral)
            .query(`
                INSERT INTO EMPLEADO (
                    nombre, email, departamento_seccion_area,
                    sexo, edad, estado_civil, nivel_estudios,
                    ocupacion_profesion_puesto, tipo_puesto, tipo_contratacion,
                    tipo_personal, tipo_jornada, rotacion_turno,
                    tiempo_exp_puesto, tiempo_exp_laboral
                )
                VALUES (
                    @nombre, @email, @departamento,
                    @sexo, @edad, @estado_civil, @nivel_estudios,
                    @ocupacion, @tipo_puesto, @tipo_contratacion,
                    @tipo_personal, @tipo_jornada, @rotacion,
                    @exp_puesto, @exp_laboral
                );
                SELECT SCOPE_IDENTITY() AS id;
            `);
        const id_empleado = resultEmpleado.recordset[0].id;

        // 3. Vincular USUARIO con EMPLEADO
        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_empleado', sql.Int, id_empleado)
            .query('UPDATE USUARIO SET id_empleado = @id_empleado WHERE id_usuario = @id_usuario');

        // 4. Obtener usuario completo (sin contraseña)
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

// ---------- ELIMINAR USUARIO (con eliminación manual en cascada) ----------
// ---------- ELIMINAR USUARIO (con eliminación manual en cascada) ----------
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

        const pool = getPool();

        // 1. Obtener id_empleado del usuario
        const empleadoResult = await pool.request()
            .input('id_usuario', sql.Int, id)
            .query('SELECT id_empleado FROM USUARIO WHERE id_usuario = @id_usuario');
        
        const id_empleado = empleadoResult.recordset[0]?.id_empleado;

        // 2. Eliminar el usuario (rompe la FK con EMPLEADO)
        await usuarioModel.remove(parseInt(id));

        // 3. Si el usuario tenía empleado, eliminar sus datos
        if (id_empleado) {
            // Eliminar respuestas de Guía I
            await pool.request()
                .input('id_empleado', sql.Int, id_empleado)
                .query(`
                    DELETE FROM RESPUESTA_GUIA_I 
                    WHERE id_evaluacion IN (SELECT id_evaluacion FROM EVALUACION WHERE id_empleado = @id_empleado)
                `);

            // Eliminar respuestas de Guía III
            await pool.request()
                .input('id_empleado', sql.Int, id_empleado)
                .query(`
                    DELETE FROM RESPUESTA 
                    WHERE id_evaluacion IN (SELECT id_evaluacion FROM EVALUACION WHERE id_empleado = @id_empleado)
                `);

            // Eliminar resultados globales
            await pool.request()
                .input('id_empleado', sql.Int, id_empleado)
                .query(`
                    DELETE FROM RESULTADO_GLOBAL 
                    WHERE id_evaluacion IN (SELECT id_evaluacion FROM EVALUACION WHERE id_empleado = @id_empleado)
                `);

            // Eliminar resultados por categoría
            await pool.request()
                .input('id_empleado', sql.Int, id_empleado)
                .query(`
                    DELETE FROM RESULTADO_CATEGORIA 
                    WHERE id_evaluacion IN (SELECT id_evaluacion FROM EVALUACION WHERE id_empleado = @id_empleado)
                `);

            // Eliminar resultados por dominio
            await pool.request()
                .input('id_empleado', sql.Int, id_empleado)
                .query(`
                    DELETE FROM RESULTADO_DOMINIO 
                    WHERE id_evaluacion IN (SELECT id_evaluacion FROM EVALUACION WHERE id_empleado = @id_empleado)
                `);

            // Eliminar evaluaciones
            await pool.request()
                .input('id_empleado', sql.Int, id_empleado)
                .query('DELETE FROM EVALUACION WHERE id_empleado = @id_empleado');

            // Eliminar empleado
            await pool.request()
                .input('id_empleado', sql.Int, id_empleado)
                .query('DELETE FROM EMPLEADO WHERE id_empleado = @id_empleado');
        }

        res.json({ message: 'Usuario y todos sus datos eliminados correctamente' });
    } catch (err) {
        next(err);
    }
};

// ---------- ACTUALIZAR USUARIO COMPLETO (incluye departamento) ----------
const updateUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, email, password, departamento, id_rol } = req.body;

        const user = await usuarioModel.findById(parseInt(id));
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const updateData = {
            nombre: nombre || user.nombre,
            email: email || user.email,
            departamento: departamento !== undefined ? departamento : user.departamento,
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