const BASE_URL = 'http://localhost:3000/api';
const EMAIL = 'upx@nom035.com';   // ⚠️ cambia por un usuario empleado real
const PASSWORD = '123456';              // ⚠️ cambia por su contraseña

// Lista de 72 respuestas crudas (0=Nunca, 1=Casi nunca, 2=Algunas veces, 3=Casi siempre, 4=Siempre)
const respuestasCrudas = [
  1, 0, 4, 2, 3,
  4, 0, 0, 4, 2,
  3, 4, 4, 3, 2,
  3, 4, 4, 2, 0,
  0, 4, 1, 1, 0,
  1, 1, 3, 1, 0,
  1, 2, 0, 3, 0,
  1, 0, 1, 0, 4,
  2, 0, 1, 4, 4,
  1, 0, 1, 2, 0,
  4, 3, 1, 4, 1,
  2, 0, 3, 4, 0,
  0, 2, 4, 1, 1,
  0, 4, 3, 1, 4,
  2, 0
];

if (respuestasCrudas.length !== 72) {
  console.error(`❌ La lista tiene ${respuestasCrudas.length} elementos, debe ser 72`);
  process.exit(1);
}

// Funciones de clasificación (copiadas del backend)
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

async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const config = { ...options, headers };
  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(`Error ${res.status}: ${data.error || JSON.stringify(data)}`);
  return data;
}

(async () => {
  try {
    // 1. Login
    const loginData = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const token = loginData.token;
    console.log('✅ Login exitoso');

    // 2. Iniciar evaluación
    const iniciarData = await apiFetch('/evaluacion/iniciar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const idEvaluacion = iniciarData.id_evaluacion;
    console.log(`✅ Evaluación iniciada: ${idEvaluacion}`);

    // 3. Guardar Guía I (todas "No")
    const guiaIPreguntas = await apiFetch('/evaluacion/guia-i/preguntas', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const respuestasGuiaI = guiaIPreguntas.map(p => ({ id_pregunta: p.id_pregunta_guia_i, respuesta: false }));
    await apiFetch(`/evaluacion/${idEvaluacion}/guia-i`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ respuestas: respuestasGuiaI }),
    });
    console.log('✅ Guía I guardada');

    // 4. Obtener preguntas de Guía III
    const preguntasIII = await apiFetch(`/evaluacion/${idEvaluacion}/preguntas`, {
      headers: { 'Authorization': 'Bearer ' + token },
    });

    // 5. Enviar respuestas crudas
    const preguntaPorNumero = {};
    preguntasIII.forEach(p => { preguntaPorNumero[p.numero] = p; });

    for (let i = 0; i < 72; i++) {
      const numero = i + 1;
      const pregunta = preguntaPorNumero[numero];
      if (!pregunta) {
        console.warn(`⚠️ No se encontró la pregunta ${numero}`);
        continue;
      }
      const valor = respuestasCrudas[i];
      await apiFetch(`/evaluacion/${idEvaluacion}/respuesta`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ id_pregunta: pregunta.id_pregunta, valor }),
      });
    }
    console.log('✅ 72 respuestas enviadas');

    // 6. Finalizar evaluación
    await apiFetch(`/evaluacion/${idEvaluacion}/finalizar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    console.log('✅ Evaluación finalizada');

    // 7. Obtener resultados reales
    const resultados = await apiFetch(`/evaluacion/${idEvaluacion}/resultados`, {
      headers: { 'Authorization': 'Bearer ' + token },
    });

    // 8. Calcular resultados esperados a partir de las mismas respuestas y tipos
    const totalRespuestas = {};
    respuestasCrudas.forEach((valor, idx) => {
      const pregunta = preguntaPorNumero[idx + 1];
      if (!pregunta) return;
      const tipo = pregunta.tipo_puntaje.toLowerCase();
      let puntaje = valor;
      if (tipo === 'inverso' || tipo === 'inversa' || tipo === '0') {
        puntaje = 4 - valor;
      } else if (tipo === 'directo' || tipo === 'directa' || tipo === '1') {
        puntaje = valor;
      }
      totalRespuestas[pregunta.id_pregunta] = {
        puntaje,
        id_categoria: pregunta.id_categoria,
        id_dominio: pregunta.id_dominio
      };
    });

    let totalBruto = 0;
    let totalMaximo = 0;
    const catPuntajes = {};
    const domPuntajes = {};

    for (const idPregunta of Object.keys(totalRespuestas)) {
      const { puntaje, id_categoria, id_dominio } = totalRespuestas[idPregunta];
      totalBruto += puntaje;
      totalMaximo += 4;

      catPuntajes[id_categoria] = catPuntajes[id_categoria] || { bruto: 0, maximo: 0 };
      catPuntajes[id_categoria].bruto += puntaje;
      catPuntajes[id_categoria].maximo += 4;

      domPuntajes[id_dominio] = domPuntajes[id_dominio] || { bruto: 0, maximo: 0 };
      domPuntajes[id_dominio].bruto += puntaje;
      domPuntajes[id_dominio].maximo += 4;
    }

    const globalNivel = clasificarGlobal(totalBruto);
    const catEsperadas = Object.entries(catPuntajes).map(([id_cat, datos]) => ({
      id_categoria: parseInt(id_cat),
      bruto: datos.bruto,
      maximo: datos.maximo,
      nivel: clasificarCategoria(parseInt(id_cat), datos.bruto)
    }));
    const domEsperadas = Object.entries(domPuntajes).map(([id_dom, datos]) => ({
      id_dominio: parseInt(id_dom),
      bruto: datos.bruto,
      maximo: datos.maximo,
      nivel: clasificarDominio(parseInt(id_dom), datos.bruto)
    }));

    // 9. Comparar
    let todoOk = true;
    console.log('\n===== COMPARACIÓN =====');
    if (resultados.global.puntaje_bruto !== totalBruto) {
      console.warn(`⚠️ Global: esperado ${totalBruto}/${totalMaximo}, obtenido ${resultados.global.puntaje_bruto}/${resultados.global.puntaje_maximo}`);
      todoOk = false;
    } else {
      console.log(`✅ Global: ${totalBruto}/${totalMaximo} (${globalNivel})`);
    }

    for (const esperado of catEsperadas) {
      const real = resultados.categorias.find(c => c.id_categoria === esperado.id_categoria);
      if (!real || real.puntaje_bruto !== esperado.bruto) {
        console.warn(`⚠️ Categoría ${esperado.id_categoria}: esperado ${esperado.bruto}/${esperado.maximo}, obtenido ${real ? `${real.puntaje_bruto}/${real.puntaje_maximo}` : 'N/A'}`);
        todoOk = false;
      } else {
        console.log(`✅ Categoría ${esperado.id_categoria}: ${esperado.bruto}/${esperado.maximo} (${esperado.nivel})`);
      }
    }

    for (const esperado of domEsperadas) {
      const real = resultados.dominios.find(d => d.id_dominio === esperado.id_dominio);
      if (!real || real.puntaje_bruto !== esperado.bruto) {
        console.warn(`⚠️ Dominio ${esperado.id_dominio}: esperado ${esperado.bruto}/${esperado.maximo}, obtenido ${real ? `${real.puntaje_bruto}/${real.puntaje_maximo}` : 'N/A'}`);
        todoOk = false;
      } else {
        console.log(`✅ Dominio ${esperado.id_dominio}: ${esperado.bruto}/${esperado.maximo} (${esperado.nivel})`);
      }
    }

    console.log('=======================\n');
    if (todoOk) {
      console.log('🎉 Validación exitosa: el backend calcula correctamente los puntajes.');
    } else {
      console.log('❌ Se encontraron diferencias entre lo esperado y lo devuelto.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();