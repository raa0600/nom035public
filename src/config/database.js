const sql = require('mssql');

let pool = null;

const getConfig = () => {
    const config = {
        server: process.env.DB_SERVER || '127.0.0.1',
        database: process.env.DB_DATABASE,
        port: 46428, 
        options: {
            encrypt: true,
            trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };

    if (process.env.DB_USER && process.env.DB_PASSWORD) {
        config.user = process.env.DB_USER;
        config.password = process.env.DB_PASSWORD;
    } else if (process.env.DB_TRUSTED_CONNECTION === 'true') {
        config.integratedSecurity = true;
    }

    return config;
};

const connectDB = async () => {
    try {
        if (!pool) {
            const config = getConfig();
            console.log('🔌 Conectando a SQL Server con configuración:', {
                server: config.server,
                database: config.database,
                port: config.port,
                user: config.user || 'Trusted Connection'
            });
            pool = await sql.connect(config);
            console.log('✅ Conectado a SQL Server');
        }
        return pool;
    } catch (err) {
        console.error('❌ Error al conectar a SQL Server:', err.message);
        if (err.originalError) {
            console.error('Detalle original:', err.originalError.message);
        }
        throw err;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('La conexión a la base de datos no está inicializada.');
    }
    return pool;
};

module.exports = { connectDB, getPool, sql };