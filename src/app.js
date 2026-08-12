const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middlewares de seguridad
// app.use(helmet());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
        },
    },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir archivos estáticos desde la carpeta 'frontend'
app.use(express.static('frontend')); // <-- Cambiado a 'frontend'

// Limitar peticiones
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Demasiadas peticiones, intente de nuevo en 1 minuto.'
});
app.use('/api', limiter);

// Rutas de la API
app.use('/api', routes);

// Manejador de errores global (siempre al final)
app.use(errorHandler);

module.exports = app;