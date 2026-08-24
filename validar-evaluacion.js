const BASE_URL = 'http://localhost:3000/api';
const EMAIL = 'efg@nom035.com';   // ⚠️ cambiar
const PASSWORD = '123456';              // ⚠️ cambiar

// Lista de respuestas (S=4, CS=3, AV=2, CN=1, N=0)
const respuestas = [
  4, 3, 1, 0, 4,      // 1-5
  3, 4, 0, 0, 4,      // 6-10
  0, 4, 4, 0, 4,      // 11-15
  4, 0, 0, 0, 0,      // 16-20
  4, 0, 4, 0, 0,      // 21-25
  4, 4, 0, 4, 0,      // 26-30
  3, 0, 4, 4, 4,      // 31-35
  0, 4, 1, 4, 0,      // 36-40
  4, 0, 4, 1, 0,      // 41-45
  4, 4, 0, 3, 0,      // 46-50
  0, 0, 4, 4, 4,      // 51-55
  4, 4, 1, 4, 0,      // 56-60
  4, 4, 4, 4, 0,      // 61-65
  0, 4, 1, 4, 0,      // 66-70
  0, 0               // 71-72
];

if (respuestas.length !== 72) {
  console.error(`❌ La lista tiene ${respuestas.length} elementos, debe ser 72`);
  process.exit(1);
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

    // 4. Obtener preguntas Guía III
    const preguntasIII = await apiFetch(`/evaluacion/${idEvaluacion}/preguntas`, {
      headers: { 'Authorization': 'Bearer ' + token },
    });

    const preguntaPorNumero = {};
    preguntasIII.forEach(p => { preguntaPorNumero[p.numero] = p; });

    // 5. Enviar respuestas
    for (let i = 0; i < 72; i++) {
      const numero = i + 1;
      const pregunta = preguntaPorNumero[numero];
      if (!pregunta) {
        console.warn(`⚠️ No se encontró la pregunta ${numero}`);
        continue;
      }
      await apiFetch(`/evaluacion/${idEvaluacion}/respuesta`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ id_pregunta: pregunta.id_pregunta, valor: respuestas[i] }),
      });
    }
    console.log('✅ 72 respuestas enviadas');

    // 6. Finalizar evaluación
    await apiFetch(`/evaluacion/${idEvaluacion}/finalizar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    console.log('✅ Evaluación finalizada');

    // 7. Obtener resultados
    const resultados = await apiFetch(`/evaluacion/${idEvaluacion}/resultados`, {
      headers: { 'Authorization': 'Bearer ' + token },
    });

    // 8. Mostrar resultados
    console.log('\n========== RESULTADOS ==========');
    if (resultados.global) {
      console.log(`Global: ${resultados.global.puntaje_bruto}/${resultados.global.puntaje_maximo} (${resultados.global.resultado_final})`);
    }
    console.log('\nCategorías:');
    resultados.categorias.forEach(c => {
      console.log(`- ${c.categoria_nombre}: ${c.puntaje_bruto}/${c.puntaje_maximo} (${c.nivel_riesgo})`);
    });
    console.log('\nDominios:');
    resultados.dominios.forEach(d => {
      console.log(`- ${d.dominio_nombre}: ${d.puntaje_bruto}/${d.puntaje_maximo} (${d.nivel_riesgo})`);
    });
    console.log('================================\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();