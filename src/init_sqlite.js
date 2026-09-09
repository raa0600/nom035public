const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let db = null;

const connectDB = () => {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);

        const dbPath = path.join(__dirname, '../data/nom035.db');
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });

        db = new sqlite3.Database(dbPath, async (err) => {
            if (err) {
                console.error('❌ Error al conectar a SQLite:', err.message);
                return reject(err);
            }
            console.log('✅ Conectado a SQLite');
            try {
                await inicializarBaseDeDatos(db);
                console.log('✅ Base de datos inicializada con tablas y datos');
                resolve(db);
            } catch (initErr) {
                console.error('❌ Error al inicializar la base:', initErr.message);
                reject(initErr);
            }
        });
    });
};

const getDB = () => {
    if (!db) throw new Error('La conexión a SQLite no está inicializada.');
    return db;
};

async function inicializarBaseDeDatos(db) {
    // ========== CREAR TABLAS ==========
    const createTables = `
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
    `;

    await new Promise((resolve, reject) => {
        db.exec(createTables, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    // ========== DATOS SEMILLA ==========
    const insert = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    };

    // Roles
    await insert(`INSERT OR IGNORE INTO ROL (id_rol, nombre_rol) VALUES (1, 'Administrador')`);
    await insert(`INSERT OR IGNORE INTO ROL (id_rol, nombre_rol) VALUES (2, 'Supervisor')`);
    await insert(`INSERT OR IGNORE INTO ROL (id_rol, nombre_rol) VALUES (3, 'Empleado')`);

    // Categorías
    const categorias = [
        [1, 'Ambiente de trabajo'],
        [2, 'Factores propios de la actividad'],
        [3, 'Organización del tiempo de trabajo'],
        [4, 'Liderazgo y relaciones en el trabajo'],
        [5, 'Entorno organizacional']
    ];
    for (const c of categorias) {
        await insert(`INSERT OR IGNORE INTO CATEGORIA (id_categoria, nombre) VALUES (?, ?)`, c);
    }

    // Dominios
    const dominios = [
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
    ];
    for (const d of dominios) {
        await insert(`INSERT OR IGNORE INTO DOMINIO (id_dominio, id_categoria, nombre) VALUES (?, ?, ?)`, d);
    }

    // Dimensiones
    const dimensiones = [
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
    ];
    for (const d of dimensiones) {
        await insert(`INSERT OR IGNORE INTO DIMENSION (id_dimension, id_dominio, nombre) VALUES (?, ?, ?)`, d);
    }

    // Preguntas Guía I
    const preguntasGuiaI = [
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
    ];
    for (const p of preguntasGuiaI) {
        await insert(`INSERT OR IGNORE INTO PREGUNTA_GUIA_I (numero, texto) VALUES (?, ?)`, p);
    }

    // Preguntas Guía III (72 ítems)
    const preguntasIII = [
        [1, 1, 'El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica', 'INVERSO'],
        [2, 1, 'Mi trabajo me exige hacer mucho esfuerzo físico', 'DIRECTO'],
        [3, 1, 'Me preocupa sufrir un accidente en mi trabajo', 'DIRECTO'],
        [4, 2, 'Considero que en mi trabajo se aplican las normas de seguridad y salud en el trabajo', 'INVERSO'],
        [5, 3, 'Considero que las actividades que realizo son peligrosas', 'DIRECTO'],
        [6, 4, 'Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno', 'DIRECTO'],
        [7, 5, 'Por la cantidad de trabajo que tengo debo trabajar sin parar', 'DIRECTO'],
        [8, 5, 'Considero que es necesario mantener un ritmo de trabajo acelerado', 'DIRECTO'],
        [9, 6, 'Mi trabajo exige que esté muy concentrado', 'DIRECTO'],
        [10, 6, 'Mi trabajo requiere que memorice mucha información', 'DIRECTO'],
        [11, 6, 'En mi trabajo tengo que tomar decisiones difíciles muy rápido', 'DIRECTO'],
        [12, 4, 'Mi trabajo exige que atienda varios asuntos al mismo tiempo', 'DIRECTO'],
        [13, 8, 'En mi trabajo soy responsable de cosas de mucho valor', 'DIRECTO'],
        [14, 8, 'Respondo ante mi jefe por los resultados de toda mi área de trabajo', 'DIRECTO'],
        [15, 9, 'En el trabajo me dan órdenes contradictorias', 'DIRECTO'],
        [16, 9, 'Considero que en mi trabajo me piden hacer cosas innecesarias', 'DIRECTO'],
        [17, 14, 'Trabajo horas extras más de tres veces a la semana', 'DIRECTO'],
        [18, 14, 'Mi trabajo me exige laborar en días de descanso, festivos o fines de semana', 'DIRECTO'],
        [19, 15, 'Considero que el tiempo en el trabajo es mucho y perjudica mis actividades familiares o personales', 'DIRECTO'],
        [20, 15, 'Debo atender asuntos de trabajo cuando estoy en casa', 'DIRECTO'],
        [21, 16, 'Pienso en las actividades familiares o personales cuando estoy en mi trabajo', 'DIRECTO'],
        [22, 16, 'Pienso que mis responsabilidades familiares afectan mi trabajo', 'DIRECTO'],
        [23, 11, 'Mi trabajo permite que desarrolle nuevas habilidades', 'INVERSO'],
        [24, 11, 'En mi trabajo puedo aspirar a un mejor puesto', 'INVERSO'],
        [25, 10, 'Durante mi jornada de trabajo puedo tomar pausas cuando las necesito', 'INVERSO'],
        [26, 10, 'Puedo decidir cuánto trabajo realizo durante la jornada laboral', 'INVERSO'],
        [27, 10, 'Puedo decidir la velocidad a la que realizo mis actividades en mi trabajo', 'INVERSO'],
        [28, 10, 'Puedo cambiar el orden de las actividades que realizo en mi trabajo', 'INVERSO'],
        [29, 12, 'Los cambios que se presentan en mi trabajo dificultan mi labor', 'DIRECTO'],
        [30, 12, 'Cuando se presentan cambios en mi trabajo se tienen en cuenta mis ideas o aportaciones', 'INVERSO'],
        [31, 17, 'Me informan con claridad cuáles son mis funciones', 'INVERSO'],
        [32, 17, 'Me explican claramente los resultados que debo obtener en mi trabajo', 'INVERSO'],
        [33, 17, 'Me explican claramente los objetivos de mi trabajo', 'INVERSO'],
        [34, 17, 'Me informan con quién puedo resolver problemas o asuntos de trabajo', 'INVERSO'],
        [35, 13, 'Me permiten asistir a capacitaciones relacionadas con mi trabajo', 'INVERSO'],
        [36, 13, 'Recibo capacitación útil para hacer mi trabajo', 'INVERSO'],
        [37, 18, 'Mi jefe ayuda a organizar mejor el trabajo', 'INVERSO'],
        [38, 18, 'Mi jefe tiene en cuenta mis puntos de vista y opiniones', 'INVERSO'],
        [39, 18, 'Mi jefe me comunica a tiempo la información relacionada con el trabajo', 'INVERSO'],
        [40, 18, 'La orientación que me da mi jefe me ayuda a realizar mejor mi trabajo', 'INVERSO'],
        [41, 18, 'Mi jefe ayuda a solucionar los problemas que se presentan en el trabajo', 'INVERSO'],
        [42, 19, 'Puedo confiar en mis compañeros de trabajo', 'INVERSO'],
        [43, 19, 'Entre compañeros solucionamos los problemas de trabajo de forma respetuosa', 'INVERSO'],
        [44, 19, 'En mi trabajo me hacen sentir parte del grupo', 'INVERSO'],
        [45, 19, 'Cuando tenemos que realizar trabajo de equipo los compañeros colaboran', 'INVERSO'],
        [46, 19, 'Mis compañeros de trabajo me ayudan cuando tengo dificultades', 'INVERSO'],
        [47, 22, 'Me informan sobre lo que hago bien en mi trabajo', 'INVERSO'],
        [48, 22, 'La forma como evalúan mi trabajo en mi centro de trabajo me ayuda a mejorar mi desempeño', 'INVERSO'],
        [49, 23, 'En mi centro de trabajo me pagan a tiempo mi salario', 'INVERSO'],
        [50, 23, 'El pago que recibo es el que merezco por el trabajo que realizo', 'INVERSO'],
        [51, 23, 'Si obtengo los resultados esperados en mi trabajo me recompensan o reconocen', 'INVERSO'],
        [52, 23, 'Las personas que hacen bien el trabajo pueden crecer laboralmente', 'INVERSO'],
        [53, 25, 'Considero que mi trabajo es estable', 'INVERSO'],
        [54, 25, 'En mi trabajo existe continua rotación de personal', 'DIRECTO'],
        [55, 24, 'Siento orgullo de laborar en este centro de trabajo', 'INVERSO'],
        [56, 24, 'Me siento comprometido con mi trabajo', 'INVERSO'],
        [57, 21, 'En mi trabajo puedo expresarme libremente sin interrupciones', 'INVERSO'],
        [58, 21, 'Recibo críticas constantes a mi persona y/o trabajo', 'DIRECTO'],
        [59, 21, 'Recibo burlas, calumnias, difamaciones, humillaciones o ridiculizaciones', 'DIRECTO'],
        [60, 21, 'Se ignora mi presencia o se me excluye de las reuniones de trabajo y en la toma de decisiones', 'DIRECTO'],
        [61, 21, 'Se manipulan las situaciones de trabajo para hacerme parecer un mal trabajador', 'DIRECTO'],
        [62, 21, 'Se ignoran mis éxitos laborales y se atribuyen a otros trabajadores', 'DIRECTO'],
        [63, 21, 'Me bloquean o impiden las oportunidades que tengo para obtener ascenso o mejora en mi trabajo', 'DIRECTO'],
        [64, 21, 'He presenciado actos de violencia en mi centro de trabajo', 'DIRECTO'],
        [65, 7, 'Atiendo clientes o usuarios muy enojados', 'DIRECTO'],
        [66, 7, 'Mi trabajo me exige atender personas muy necesitadas de ayuda o enfermas', 'DIRECTO'],
        [67, 7, 'Para hacer mi trabajo debo demostrar sentimientos distintos a los míos', 'DIRECTO'],
        [68, 7, 'Mi trabajo me exige atender situaciones de violencia', 'DIRECTO'],
        [69, 20, 'Comunican tarde los asuntos de trabajo', 'DIRECTO'],
        [70, 20, 'Dificultan el logro de los resultados del trabajo', 'DIRECTO'],
        [71, 20, 'Cooperan poco cuando se necesita', 'DIRECTO'],
        [72, 20, 'Ignoran las sugerencias para mejorar su trabajo', 'DIRECTO']
    ];
    for (const p of preguntasIII) {
        await insert(`INSERT OR IGNORE INTO PREGUNTA (id_dimension, numero, texto, tipo_puntaje) VALUES (?, ?, ?, ?)`, p);
    }

    // Usuario admin
    const hash = await bcrypt.hash('admin123', 10);
    await insert(`INSERT OR IGNORE INTO USUARIO (nombre, email, contraseña_hash, departamento, id_rol) VALUES ('Administrador', 'admin@nom035.com', ?, 'Sistemas', 1)`, [hash]);
}

module.exports = { connectDB, getDB };