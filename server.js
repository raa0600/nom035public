require('dotenv').config();
console.log('🔍 Variables de entorno cargadas');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('INSTANCE_NAME:', process.env.INSTANCE_NAME);

const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

console.log('🔄 Intentando conectar a la base de datos...');

connectDB()
    .then(() => {
        console.log('✅ Conexión exitosa, iniciando servidor...');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log('📡 API disponible en /api');
        });
    })
    .catch(err => {
        console.error('❌ Error al conectar a la base de datos:', err);
        process.exit(1);
    });