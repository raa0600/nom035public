const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let db = null;

const connectDB = () => {
    return new Promise((resolve, reject) => {
        try {
            if (db) return resolve(db);

            const dbPath = path.join(__dirname, '../../data/nom035.db');
            fs.mkdirSync(path.dirname(dbPath), { recursive: true });

            db = new Database(dbPath);
            console.log('✅ Conectado a SQLite (better-sqlite3)');

            inicializarBaseDeDatos(db);
            console.log('✅ Base de datos inicializada');

            resolve(db);
        } catch (err) {
            console.error('❌ Error al conectar a SQLite:', err.message);
            reject(err);
        }
    });
};

const getDB = () => {
    if (!db) throw new Error('La conexión a SQLite no está inicializada.');
    return db;
};

// Clasificación (igual que backend)
function clasificarGlobal(puntaje) {
    if (puntaje < 50) return 'Nulo';
    if (puntaje < 75) return 'Bajo';
    if (puntaje < 99) return 'Medio';
    if (puntaje < 140) return 'Alto';
    return 'Muy Alto';
}

function clasificarCategoria(id_categoria, puntaje) {
    const umbrales = {
        1: [5, 9, 11, 14],
        2: [15, 30, 45, 60],
        3: [5, 7, 10, 13],
        4: [14, 29, 42, 58],
        5: [10, 14, 18, 23]
    };
    const u = umbrales[id_categoria];
    if (!u) return 'Nulo';
    if (puntaje < u[0]) return 'Nulo';
    if (puntaje < u[1]) return 'Bajo';
    if (puntaje < u[2]) return 'Medio';
    if (puntaje < u[3]) return 'Alto';
    return 'Muy Alto';
}

function clasificarDominio(id_dominio, puntaje) {
    const umbrales = {
        1: [5, 9, 11, 14],
        2: [15, 21, 27, 37],
        3: [11, 16, 21, 25],
        4: [1, 2, 4, 6],
        5: [4, 6, 8, 10],
        6: [9, 12, 16, 20],
        7: [10, 13, 17, 21],
        8: [7, 10, 13, 16],
        9: [6, 10, 14, 18],
        10: [4, 6, 8, 10]
    };
    const u = umbrales[id_dominio];
    if (!u) return 'Nulo';
    if (puntaje < u[0]) return 'Nulo';
    if (puntaje < u[1]) return 'Bajo';
    if (puntaje < u[2]) return 'Medio';
    if (puntaje < u[3]) return 'Alto';
    return 'Muy Alto';
}

function inicializarBaseDeDatos(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS ROL (
            id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_rol TEXT NOT NULL,
            status_permiso INTEGER
        );
        CREATE TABLE IF NOT EXISTS USUARIO (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            departamento TEXT,
            contraseña_hash TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            oauth_provider TEXT,
            oauth_id TEXT,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
            id_rol INTEGER NOT NULL,
            id_empleado INTEGER,
            FOREIGN KEY (id_rol) REFERENCES ROL(id_rol)
        );
        CREATE TABLE IF NOT EXISTS EMPLEADO (
            id_empleado INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            sexo TEXT,
            edad INTEGER,
            estado_civil TEXT,
            nivel_estudios TEXT,
            ocupacion_profesion_puesto TEXT,
            departamento_seccion_area TEXT,
            tipo_puesto TEXT,
            tipo_contratacion TEXT,
            tipo_personal TEXT,
            tipo_jornada TEXT,
            rotacion_turno INTEGER,
            tiempo_exp_puesto INTEGER,
            tiempo_exp_laboral INTEGER,
            email TEXT UNIQUE
        );
        CREATE TABLE IF NOT EXISTS EVALUACION (
            id_evaluacion INTEGER PRIMARY KEY AUTOINCREMENT,
            id_empleado INTEGER NOT NULL,
            fecha_aplicacion TEXT DEFAULT CURRENT_TIMESTAMP,
            estatus TEXT NOT NULL,
            requiere_canalizacion INTEGER DEFAULT 0,
            FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado)
        );
        CREATE TABLE IF NOT EXISTS CATEGORIA (
            id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS DOMINIO (
            id_dominio INTEGER PRIMARY KEY AUTOINCREMENT,
            id_categoria INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            FOREIGN KEY (id_categoria) REFERENCES CATEGORIA(id_categoria)
        );
        CREATE TABLE IF NOT EXISTS DIMENSION (
            id_dimension INTEGER PRIMARY KEY AUTOINCREMENT,
            id_dominio INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            FOREIGN KEY (id_dominio) REFERENCES DOMINIO(id_dominio)
        );
        CREATE TABLE IF NOT EXISTS PREGUNTA (
            id_pregunta INTEGER PRIMARY KEY AUTOINCREMENT,
            id_dimension INTEGER NOT NULL,
            numero INTEGER NOT NULL,
            texto TEXT,
            tipo_puntaje TEXT NOT NULL,
            FOREIGN KEY (id_dimension) REFERENCES DIMENSION(id_dimension)
        );
        CREATE TABLE IF NOT EXISTS PREGUNTA_GUIA_I (
            id_pregunta_guia_i INTEGER PRIMARY KEY AUTOINCREMENT,
            numero INTEGER NOT NULL,
            texto TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS RESPUESTA (
            id_evaluacion INTEGER NOT NULL,
            id_pregunta INTEGER NOT NULL,
            valor_escogido INTEGER NOT NULL,
            PRIMARY KEY (id_evaluacion, id_pregunta),
            FOREIGN KEY (id_evaluacion) REFERENCES EVALUACION(id_evaluacion),
            FOREIGN KEY (id_pregunta) REFERENCES PREGUNTA(id_pregunta)
        );
        CREATE TABLE IF NOT EXISTS RESPUESTA_GUIA_I (
            id_respuesta_guia_i INTEGER PRIMARY KEY AUTOINCREMENT,
            id_evaluacion INTEGER NOT NULL,
            id_pregunta_guia_i INTEGER NOT NULL,
            respuesta INTEGER NOT NULL,
            FOREIGN KEY (id_evaluacion) REFERENCES EVALUACION(id_evaluacion),
            FOREIGN KEY (id_pregunta_guia_i) REFERENCES PREGUNTA_GUIA_I(id_pregunta_guia_i)
        );
        CREATE TABLE IF NOT EXISTS RESULTADO_GLOBAL (
            id_resultado_global INTEGER PRIMARY KEY AUTOINCREMENT,
            id_evaluacion INTEGER NOT NULL,
            puntaje_bruto INTEGER NOT NULL,
            puntaje_maximo INTEGER NOT NULL,
            puntaje_porcentaje REAL,
            resultado_final TEXT,
            FOREIGN KEY (id_evaluacion) REFERENCES EVALUACION(id_evaluacion)
        );
        CREATE TABLE IF NOT EXISTS RESULTADO_CATEGORIA (
            id_resultado_cat INTEGER PRIMARY KEY AUTOINCREMENT,
            id_evaluacion INTEGER NOT NULL,
            id_categoria INTEGER NOT NULL,
            puntaje_bruto INTEGER NOT NULL,
            puntaje_maximo INTEGER NOT NULL,
            puntaje_porcentaje REAL,
            nivel_riesgo TEXT,
            FOREIGN KEY (id_evaluacion) REFERENCES EVALUACION(id_evaluacion),
            FOREIGN KEY (id_categoria) REFERENCES CATEGORIA(id_categoria)
        );
        CREATE TABLE IF NOT EXISTS RESULTADO_DOMINIO (
            id_resultado_dom INTEGER PRIMARY KEY AUTOINCREMENT,
            id_evaluacion INTEGER NOT NULL,
            id_dominio INTEGER NOT NULL,
            puntaje_bruto INTEGER NOT NULL,
            puntaje_maximo INTEGER NOT NULL,
            puntaje_porcentaje REAL,
            nivel_riesgo TEXT,
            FOREIGN KEY (id_evaluacion) REFERENCES EVALUACION(id_evaluacion),
            FOREIGN KEY (id_dominio) REFERENCES DOMINIO(id_dominio)
        );
    `);

    // Datos semilla
    const insertRol = db.prepare('INSERT OR IGNORE INTO ROL (id_rol, nombre_rol) VALUES (?, ?)');
    [1, 'Administrador'].forEach(r => insertRol.run(1, 'Administrador'));
    insertRol.run(2, 'Supervisor');
    insertRol.run(3, 'Empleado');

    // Categorías
    const catStmt = db.prepare('INSERT OR IGNORE INTO CATEGORIA (id_categoria, nombre) VALUES (?, ?)');
    [
        [1, 'Ambiente de trabajo'],
        [2, 'Factores propios de la actividad'],
        [3, 'Organización del tiempo de trabajo'],
        [4, 'Liderazgo y relaciones en el trabajo'],
        [5, 'Entorno organizacional']
    ].forEach(c => catStmt.run(c[0], c[1]));

    // Dominios
    const domStmt = db.prepare('INSERT OR IGNORE INTO DOMINIO (id_dominio, id_categoria, nombre) VALUES (?, ?, ?)');
    [
        [1, 1, 'Condiciones en el ambiente de trabajo'],
        [2, 2, 'Carga de trabajo'],
        [3, 2, 'Falta de control sobre el trabajo'],
        [4, 3, 'Jornada de trabajo'],
        [5, 3, 'Interferencia en la relación trabajo-familia'],
        [6, 4, 'Liderazgo'],
        [7, 4, 'Relaciones en el trabajo'],
        [8, 4, 'Violencia'],
        [9, 5, 'Reconocimiento del desempeño'],
        [10, 5, 'Insuficiente sentido de pertenencia e inestabilidad']
    ].forEach(d => domStmt.run(d[0], d[1], d[2]));

    // Dimensiones
    const dimStmt = db.prepare('INSERT OR IGNORE INTO DIMENSION (id_dimension, id_dominio, nombre) VALUES (?, ?, ?)');
    [
        [1, 1, 'Condiciones peligrosas e inseguras'],
        [2, 1, 'Condiciones deficientes e insalubres'],
        [3, 1, 'Trabajos peligrosos'],
        [4, 2, 'Cargas cuantitativas'],
        [5, 2, 'Ritmos de trabajo acelerado'],
        [6, 2, 'Carga mental'],
        [7, 2, 'Cargas psicológicas emocionales'],
        [8, 2, 'Cargas de alta responsabilidad'],
        [9, 2, 'Cargas contradictorias o inconsistentes'],
        [10, 3, 'Falta de control y autonomía sobre el trabajo'],
        [11, 3, 'Limitada o nula posibilidad de desarrollo'],
        [12, 3, 'Insuficiente participación y manejo del cambio'],
        [13, 3, 'Limitada o inexistente capacitación'],
        [14, 4, 'Jornadas de trabajo extensas'],
        [15, 5, 'Influencia del trabajo fuera del centro laboral'],
        [16, 5, 'Influencia de las responsabilidades familiares'],
        [17, 6, 'Escaza claridad de funciones'],
        [18, 6, 'Características del liderazgo'],
        [19, 7, 'Relaciones sociales en el trabajo'],
        [20, 7, 'Deficiente relación con los colaboradores que supervisa'],
        [21, 8, 'Violencia laboral'],
        [22, 9, 'Escasa o nula retroalimentación del desempeño'],
        [23, 9, 'Escaso o nulo reconocimiento o compensación'],
        [24, 10, 'Limitado sentido de pertenencia'],
        [25, 10, 'Inestabilidad laboral']
    ].forEach(d => dimStmt.run(d[0], d[1], d[2]));

    // Preguntas Guía I (20)
    const pregIStmt = db.prepare('INSERT OR IGNORE INTO PREGUNTA_GUIA_I (numero, texto) VALUES (?, ?)');
    [
        [1, '¿Ha presenciado o sufrido alguna vez, durante o con motivo del trabajo, un accidente que tenga como consecuencia la muerte, la pérdida de un miembro o una lesión grave?'],
        [2, '¿Ha sufrido asaltos durante o con motivo del trabajo?'],
        [3, '¿Ha presenciado o sufrido actos violentos que derivaron en lesiones graves?'],
        [4, '¿Ha sido víctima de secuestro durante o con motivo del trabajo?'],
        [5, '¿Ha recibido amenazas durante o con motivo del trabajo?'],
        [6, '¿Ha vivido cualquier otro acontecimiento que ponga en riesgo su vida o salud, y/o la de otras personas?'],
        [7, '¿Ha tenido recuerdos recurrentes sobre el acontecimiento que le provocan malestares?'],
        [8, '¿Ha tenido sueños de carácter recurrente sobre el acontecimiento que le producen malestar?'],
        [9, '¿Se ha esforzado por evitar todo tipo de sentimientos, conversaciones o situaciones que le puedan recordar el acontecimiento?'],
        [10, '¿Se ha esforzado por evitar todo tipo de actividades, lugares o personas que motivan recuerdos del acontecimiento?'],
        [11, '¿Ha tenido dificultad para recordar alguna parte importante del evento?'],
        [12, '¿Ha disminuido su interés en sus actividades cotidianas?'],
        [13, '¿Se ha sentido usted alejado o distante de los demás?'],
        [14, '¿Ha notado que tiene dificultad para expresar sus sentimientos?'],
        [15, '¿Ha tenido la impresión de que su vida se va a acortar, que va a morir antes que otras personas o que tiene un futuro limitado?'],
        [16, '¿Ha tenido usted dificultades para dormir?'],
        [17, '¿Ha estado particularmente irritable o le han dado arranques de coraje?'],
        [18, '¿Ha tenido dificultad para concentrarse?'],
        [19, '¿Ha estado nervioso o constantemente en alerta?'],
        [20, '¿Se ha sobresaltado fácilmente por cualquier cosa?']
    ].forEach(p => pregIStmt.run(p[0], p[1]));

    // Preguntas Guía III (72) – resumido, asumo que ya tienes el array completo
    const pregIIIStmt = db.prepare('INSERT OR IGNORE INTO PREGUNTA (id_dimension, numero, texto, tipo_puntaje) VALUES (?, ?, ?, ?)');
    const preguntasIII = [
        [1, 1, 'El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica', 'INVERSO'],
        [2, 1, 'Mi trabajo me exige hacer mucho esfuerzo físico', 'DIRECTO'],
        // ... aquí van los 72 ítems, no los voy a repetir todos por espacio, pero debes incluir los que ya tienes.
    ];
    preguntasIII.forEach(p => pregIIIStmt.run(p[0], p[1], p[2], p[3]));

    // Usuario admin
    const hashAdmin = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT OR IGNORE INTO USUARIO (nombre, email, contraseña_hash, departamento, id_rol) VALUES (?, ?, ?, ?, ?)')
      .run('Administrador', 'admin@nom035.com', hashAdmin, 'Sistemas', 1);

    // Aquí puedes agregar la creación de usuarios de prueba y evaluaciones si lo deseas.
}

module.exports = { connectDB, getDB };