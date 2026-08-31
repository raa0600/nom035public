const BASE_URL = 'http://localhost:3000/api';

async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const config = { ...options, headers };
  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(`Error ${res.status}: ${data.error || JSON.stringify(data)}`);
  return data;
}

function calcularPuntajeEsperado(preguntas, valoresCrudos) {
  const mapaTipo = {};
  preguntas.forEach(p => { mapaTipo[p.numero] = p.tipo_puntaje; });

  let total = 0;
  for (let num = 1; num <= 64; num++) {
    const tipo = mapaTipo[num] || 'DIRECTO';
    const valorCrudo = valoresCrudos[num - 1];
    total += (tipo === 'INVERSO') ? (4 - valorCrudo) : valorCrudo;
  }
  return total;
}

async function ejecutarEscenario(nombre, valoresCrudos) {
  console.log(`\n--- Escenario: ${nombre} ---`);
  const email = `prueba_${Date.now()}_${Math.floor(Math.random()*1000)}@test.com`;
  const password = '123456';

  await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre: `Prueba ${nombre}`, email, password, departamento: 'Pruebas' })
  });

  const login = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const token = login.token;

  const iniciar = await apiFetch('/evaluacion/iniciar', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const idEvaluacion = iniciar.id_evaluacion;

  const preguntasGuiaI = await apiFetch('/evaluacion/guia-i/preguntas', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const respuestasGuiaI = preguntasGuiaI.map(p => ({ id_pregunta: p.id_pregunta_guia_i, respuesta: false }));
  await apiFetch(`/evaluacion/${idEvaluacion}/guia-i`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ respuestas: respuestasGuiaI })
  });

  const preguntasIII = await apiFetch(`/evaluacion/${idEvaluacion}/preguntas`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  for (let i = 0; i < 64; i++) {
    const numero = i + 1;
    const pregunta = preguntasIII.find(p => p.numero === numero);
    if (!pregunta) continue;
    await apiFetch(`/evaluacion/${idEvaluacion}/respuesta`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ id_pregunta: pregunta.id_pregunta, valor: valoresCrudos[i] })
    });
  }

  const puntajeEsperado = calcularPuntajeEsperado(preguntasIII, valoresCrudos);
  console.log(`Puntaje esperado: ${puntajeEsperado}`);

  await apiFetch(`/evaluacion/${idEvaluacion}/finalizar`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });

  const resultados = await apiFetch(`/evaluacion/${idEvaluacion}/resultados`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  const global = resultados.global;
  console.log(`Resultado API: ${global.puntaje_bruto} (${global.resultado_final})`);

  if (global.puntaje_bruto === puntajeEsperado) {
    console.log('✅ El puntaje coincide exactamente con lo esperado.');
  } else {
    console.log('❌ DIFERENCIA en el puntaje. Revisar lógica de cálculo.');
  }
}

// Listas de preguntas inversas y directas (según la tabla proporcionada)
const inversos = [1,4,23,24,25,26,27,28,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,55,56,57];
const directos = [2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,29,54,58,59,60,61,62,63,64];

(async () => {
  // Escenario Nulo: directas = 0, inversas = 4
  const valoresNulo = new Array(64).fill(0);
  inversos.forEach(num => valoresNulo[num-1] = 4);
  directos.forEach(num => valoresNulo[num-1] = 0);

  await ejecutarEscenario('Nulo', valoresNulo);

  // Escenario Muy Alto: directas = 4, inversas = 0
  const valoresMuyAlto = new Array(64).fill(0);
  directos.forEach(num => valoresMuyAlto[num-1] = 4);
  inversos.forEach(num => valoresMuyAlto[num-1] = 0);

  await ejecutarEscenario('Muy Alto', valoresMuyAlto);
})();