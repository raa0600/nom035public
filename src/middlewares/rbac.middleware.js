const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // Verificar que el usuario esté autenticado
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const userRole = req.user.rol;

        // Si es administrador (rol 1), permitir todo
        if (userRole === 1) {
            return next();
        }

        // Verificar si el rol del usuario está en la lista de roles permitidos
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: 'Acceso denegado. No tienes permiso para realizar esta acción.' });
        }

        next();
    };
};

module.exports = { authorize };