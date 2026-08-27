const BASE_URL = 'http://localhost:3000/api';

// Función para retrasar (evitar saturación)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para hacer fetch con manejo de errores
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const config = { ...options, headers };
  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(`Error ${res.status}: ${data.error || JSON.stringify(data)}`);
  return data;
}

// Genera un array de 72 valores crudos (0-4) que, al aplicar la inversión según tipo_puntaje,
// suman exactamente `totalPuntajes`.
function generarRespuestasParaTotal(totalPuntajes, tipoPorNumero) {
  const rawValues = new Array(72).fill(0);
  const puntajes = new Array(72).fill(0);
  let suma = 0;

  // Asignar aleatoriamente puntajes iniciales (0-4) a cada pregunta
  for (let i = 0; i < 72; i++) {
    puntajes[i] = Math.floor(Math.random() * 5); // 0-4
    suma += puntajes[i];
  }

  // Ajustar la suma al total objetivo
  while (suma !== totalPuntajes) {
    const idx = Math.floor(Math.random() * 72);
    if (suma < totalPuntajes && puntajes[idx] < 4) {
      puntajes[idx]++;
      suma++;
    } else if (suma > totalPuntajes && puntajes[idx] > 0) {
      puntajes[idx]--;
      suma--;
    }
  }

  // Convertir puntajes a valores crudos según tipo_puntaje
  for (let i = 0; i < 72; i++) {
    const numero = i + 1;
    const tipo = tipoPorNumero[numero] || 'DIRECTO'; // por defecto directo
    if (tipo === 'INVERSO') {
      rawValues[i] = 4 - puntajes[i]; // inverso: crudo = 4 - puntaje
    } else {
      rawValues[i] = puntajes[i]; // directo: crudo = puntaje
    }
  }

  return rawValues;
}

// Crea un usuario y completa su evaluación con un total de puntaje específico.
async function crearYEvaluarUsuario(indice, nivel, totalPuntajes) {
  const email = `test${indice}@nom035.com`;
  const password = '123456';
  const nombre = `Usuario ${nivel} ${indice}`;
  const departamento = `Dept ${indice % 5 + 1}`;

  try {
    console.log(`[${indice}] Registrando ${email} (nivel: ${nivel})...`);
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, password, departamento }),
    });

    const loginData = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const token = loginData.token;

    const iniciarData = await apiFetch('/evaluacion/iniciar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const idEvaluacion = iniciarData.id_evaluacion;

    // Guía I: todas "No"
    const guiaIPreguntas = await apiFetch('/evaluacion/guia-i/preguntas', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const respuestasGuiaI = guiaIPreguntas.map(p => ({
      id_pregunta: p.id_pregunta_guia_i,
      respuesta: false,
    }));
    await apiFetch(`/evaluacion/${idEvaluacion}/guia-i`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ respuestas: respuestasGuiaI }),
    });

    // Obtener preguntas III (para conocer tipo_puntaje por número)
    const preguntasIII = await apiFetch(`/evaluacion/${idEvaluacion}/preguntas`, {
      headers: { 'Authorization': 'Bearer ' + token },
    });

    const tipoPorNumero = {};
    const preguntaPorNumero = {};
    preguntasIII.forEach(p => {
      tipoPorNumero[p.numero] = p.tipo_puntaje;
      preguntaPorNumero[p.numero] = p;
    });

    // Generar respuestas crudas que produzcan el total deseado
    const rawValues = generarRespuestasParaTotal(totalPuntajes, tipoPorNumero);

    // Enviar respuestas
    for (let i = 0; i < 72; i++) {
      const numero = i + 1;
      const pregunta = preguntaPorNumero[numero];
      if (!pregunta) continue;
      await apiFetch(`/evaluacion/${idEvaluacion}/respuesta`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ id_pregunta: pregunta.id_pregunta, valor: rawValues[i] }),
      });
    }

    // Finalizar
    await apiFetch(`/evaluacion/${idEvaluacion}/finalizar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
    });

    console.log(`[${indice}] Evaluación finalizada. Total esperado: ${totalPuntajes}`);
  } catch (err) {
    console.error(`[${indice}] ❌ Error: ${err.message}`);
  }
}

// Distribución: 20 por nivel (ajusta si quieres otra proporción)
async function main() {
  const niveles = [
    { nombre: 'Nulo', min: 0, max: 49 },
    { nombre: 'Bajo', min: 50, max: 74 },
    { nombre: 'Medio', min: 75, max: 98 },
    { nombre: 'Alto', min: 99, max: 139 },
    { nombre: 'Muy Alto', min: 140, max: 288 },
  ];

  const usuariosPorNivel = 20; // total 100
  let contador = 1;

  for (const nivel of niveles) {
    for (let i = 0; i < usuariosPorNivel; i++) {
      const total = Math.floor(Math.random() * (nivel.max - nivel.min + 1)) + nivel.min;
      await crearYEvaluarUsuario(contador, nivel.nombre, total);
      contador++;
      await delay(200); // pausa breve
    }
  }

  console.log('\n✅ 100 evaluaciones generadas con todos los niveles de riesgo.');
}

main();