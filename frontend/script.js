// ---------- AUTENTICACIÓN ----------
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const loginBtn = document.getElementById('login-btn');
const authError = document.getElementById('auth-error');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

function showAuthError(msg) {
    const lowerMsg = msg.charAt(0).toLowerCase() + msg.slice(1);
    authError.textContent = lowerMsg;
    authError.style.display = 'block';
}

async function authenticate(endpoint) {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    console.log('📤 Enviando:', { email, password });

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en la autenticación');
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userRol', data.user.rol);
        showApp();
    } catch (err) {
        showAuthError(err.message);
    }
}

loginBtn.addEventListener('click', () => authenticate('/api/auth/login'));

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRol');
    showAuth();
});

function showApp() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    userEmailSpan.textContent = localStorage.getItem('userEmail');

    const userRol = localStorage.getItem('userRol');
    const isAdmin = userRol === '1';

    const nuevaCard = document.querySelector('.card[data-type="nueva"]');
    const continuarCard = document.querySelector('.card[data-type="continuar"]');
    const reportCard = document.querySelector('.card[data-type="reportes"]');
    const usuariosCard = document.querySelector('.card[data-type="usuarios"]');

    if (nuevaCard) nuevaCard.style.display = 'flex';
    if (continuarCard) continuarCard.style.display = 'flex';

    if (isAdmin) {
        if (reportCard) reportCard.style.display = 'flex';
        if (usuariosCard) usuariosCard.style.display = 'flex';
    } else {
        if (reportCard) reportCard.style.display = 'none';
        if (usuariosCard) usuariosCard.style.display = 'none';
    }
}

function showAuth() {
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
    authError.style.display = 'none';
}

if (localStorage.getItem('token')) {
    showApp();
} else {
    showAuth();
}

// ---------- NAVEGACIÓN ----------
const homeScreen = document.getElementById('home-screen');
const typeSelection = document.getElementById('type-selection');
const formContainer = document.getElementById('form-container');
const reportContainer = document.getElementById('report-container');

document.getElementById('open-menu').addEventListener('click', () => {
    homeScreen.classList.add('hidden');
    typeSelection.classList.remove('hidden');
});

typeSelection.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const type = card.dataset.type;
    typeSelection.classList.add('hidden');

    if (type === 'nueva') {
        iniciarEvaluacion();
    } else if (type === 'continuar') {
        continuarEvaluacion();
    } else if (type === 'reportes') {
        mostrarMensaje(' Reportes', 'Próximamente podrás ver reportes de evaluaciones.', 'reportes');
    } else if (type === 'usuarios') {
        mostrarGestionUsuarios();
    }
});

function mostrarMensaje(titulo, mensaje, tipo) {
    let iconClass = '';
    if (tipo === 'nueva') iconClass = 'icono-nueva';
    else if (tipo === 'continuar') iconClass = 'icono-continuar';
    else if (tipo === 'reportes') iconClass = 'icono-reportes';

    formContainer.innerHTML = `
        <button type="button" class="back-btn" id="back-btn">← Atrás</button>
        <div style="color:white; text-align:center; padding:2rem;">
            <h2 class="form-title" style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                ${iconClass ? `<span class="${iconClass}"></span>` : ''}
                ${titulo}
            </h2>
            <p>${mensaje}</p>
<p class="mensaje-estado">
    <span class="icono-check"></span>
    Backend funcionando correctamente
</p>
        </div>
    `;
    formContainer.classList.remove('hidden');
    reportContainer.classList.add('hidden');
    document.getElementById('back-btn').addEventListener('click', goBack);
}

function mostrarMensajeError(titulo, mensaje) {
    reportContainer.innerHTML = `
        <button type="button" class="back-btn" id="back-btn-report">← Atrás</button>
        <div style="color:white; text-align:center; padding:2rem;">
            <h2 style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                <span class="icono-candado"></span>
                ${titulo}
            </h2>
            <p>${mensaje}</p>
            <p style="margin-top:1rem; font-size:0.8rem; opacity:0.7;">Acceso restringido</p>
        </div>
    `;
    reportContainer.classList.remove('hidden');
    document.getElementById('back-btn-report').addEventListener('click', goBack);
}

// ============================================================
// GESTIÓN DE USUARIOS (CRUD completo + reset password)
// ============================================================

async function mostrarGestionUsuarios() {
    const token = localStorage.getItem('token');

    let usuarios = [];
    try {
        const res = await fetch('/api/usuarios', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            usuarios = await res.json();
        }
    } catch (err) {
        console.error('Error al cargar usuarios:', err);
    }

    let html = `
        <button type="button" class="back-btn" id="back-btn-usuarios">← Atrás</button>
        <div style="color:white; padding:1rem; text-align:center;">
            <h2 class="form-title" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; margin-bottom:1.5rem;">
                <span class="icono-gestion"></span>
                Gestión de usuarios
            </h2>

            <div id="tabla-usuarios">
                <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px; overflow:hidden; margin:0 auto; text-align:left;">
                    <tr style="background:rgba(255,255,255,0.2);">
                        <th style="padding:10px 14px;">ID</th>
                        <th style="padding:10px 14px;">Nombre</th>
                        <th style="padding:10px 14px;">Email</th>
                        <th style="padding:10px 14px;">Rol</th>
                        <th style="padding:10px 14px;">Acciones</th>
                    </tr>
                    ${usuarios.map(u => `
                        <tr>
                            <td style="padding:10px 14px;">${u.id_usuario}</td>
                            <td style="padding:10px 14px;">${u.nombre}</td>
                            <td style="padding:10px 14px;">${u.email}</td>
                            <td style="padding:10px 14px;">${u.rol_nombre || u.id_rol}</td>
                            <td style="padding:10px 14px; white-space:nowrap;">
                                <button class="btn-accion editar-usuario" title="Actualizar" data-id="${u.id_usuario}" data-nombre="${u.nombre}" data-email="${u.email}" data-rol="${u.id_rol}">
                                    <span class="icono-editar"></span>
                                </button>
                                <button class="btn-accion reset-password" title="Generar nueva contraseña" data-id="${u.id_usuario}">
                                    <span class="icono-candado"></span>
                                </button>
                                <button class="btn-accion eliminar-usuario" title="Eliminar" data-id="${u.id_usuario}">
                                    <span class="icono-eliminar"></span>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>

            <div id="crear-usuario-card" class="crear-usuario-card" style="margin-top:1.5rem; padding:0.8rem 1.2rem; background:rgba(255,255,255,0.1); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.2); border-radius:16px; cursor:pointer; transition: all 0.3s ease; display:flex; align-items:center; justify-content:center; gap:0.8rem; max-width:300px; margin-left:auto; margin-right:auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <span style="font-size:1.5rem; font-weight:300;">+</span>
                <span style="font-size:1rem; font-weight:500;">Crear nuevo usuario</span>
            </div>

            <div id="form-creacion-container" style="display:none; margin-top:1.5rem;">
                <form id="form-crear-usuario" style="max-width:420px; margin:0 auto; padding:1rem 0;">
                    <label>Nombre completo</label>
                    <input type="text" id="nombre-usuario" class="campo-gestion" placeholder="Ej. Juan Pérez" required>

                    <label>Email</label>
                    <input type="email" id="email-usuario" class="campo-gestion" placeholder="usuario@empresa.com" required>

                    <label>Contraseña</label>
                    <input type="password" id="password-usuario" class="campo-gestion" placeholder="Mínimo 6 caracteres" minlength="6" required>

                    <label>Rol</label>
                    <select id="rol-usuario" class="campo-gestion">
                        <option value="1">Administrador</option>
                        <option value="2">Supervisor</option>
                        <option value="3" selected>Empleado</option>
                    </select>

                    <div style="display:flex; flex-direction:column; gap:0.8rem; width:100%; align-items:center; margin-top:0.5rem;">
                        <button type="submit" class="campo-gestion" style="margin:0;">Crear usuario</button>
                        <button type="button" id="cancelar-creacion" class="campo-gestion" style="margin:0; background:transparent; border:1px solid rgba(255,255,255,0.3); border-radius:30px; color:#fff; font-size:1.1rem; padding:12px; cursor:pointer; transition:0.3s; width:100%; max-width:400px;">
                            Cancelar
                        </button>
                    </div>
                </form>
                <div id="mensaje-creacion" style="margin-top:0.5rem; text-align:center;"></div>
            </div>
        </div>
    `;

    reportContainer.innerHTML = html;
    reportContainer.classList.remove('hidden');
    formContainer.classList.add('hidden');
    document.getElementById('back-btn-usuarios').addEventListener('click', goBack);

    document.getElementById('crear-usuario-card').addEventListener('click', () => {
        mostrarFormularioCreacion();
    });

    document.getElementById('cancelar-creacion')?.addEventListener('click', () => {
        ocultarFormularioCreacion();
    });

    document.getElementById('form-crear-usuario')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombre-usuario').value.trim();
        const email = document.getElementById('email-usuario').value.trim();
        const password = document.getElementById('password-usuario').value.trim();
        const id_rol = parseInt(document.getElementById('rol-usuario').value);

        const mensajeDiv = document.getElementById('mensaje-creacion');
        mensajeDiv.innerHTML = `<p class="mensaje-estado" style="color:#facf29;">
    <span class="icono-loader-amarillo"></span> Creando usuario...
</p>`;

        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ nombre, email, password, id_rol })
            });
            const data = await res.json();

            if (!res.ok) {
                mensajeDiv.innerHTML = `<p class="mensaje-estado" style="color:#FFA500;">❌ ${data.error || 'Error al crear usuario'}</p>`;
                return;
            }

// Mostrar mensaje de éxito sin nombre/email
mensajeDiv.innerHTML = `
    <p class="mensaje-estado" style="color:#facf29;">
        <span class="icono-check-amarillo"></span>
        Usuario creado exitosamente.
    </p>
`;
// Limpiar campos
document.getElementById('nombre-usuario').value = '';
document.getElementById('email-usuario').value = '';
document.getElementById('password-usuario').value = '';
// Ocultar formulario y recargar la tabla después de 1.5 segundos
setTimeout(() => {
    ocultarFormularioCreacion();
    mostrarGestionUsuarios();
}, 1500);
        } catch (err) {
            mensajeDiv.innerHTML = `<p style="color:#FF6B6B;">❌ Error de conexión: ${err.message}</p>`;
        }
    });

    document.querySelectorAll('.editar-usuario').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const nombre = btn.dataset.nombre;
            const email = btn.dataset.email;
            const rol = btn.dataset.rol;
            mostrarFormularioEdicion(id, nombre, email, rol);
        });
    });

    document.querySelectorAll('.reset-password').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            await resetPassword(id);
        });
    });

    document.querySelectorAll('.eliminar-usuario').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (confirm('¿Eliminar usuario?')) {
                await eliminarUsuario(id);
            }
        });
    });
}

// ============================================================
// EVALUACIONES - Guía I y Guía III
// ============================================================

async function iniciarEvaluacion() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/evaluacion/iniciar', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al iniciar evaluación');
        const idEvaluacion = data.id_evaluacion;
        cargarGuiaI(idEvaluacion);
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function cargarGuiaI(idEvaluacion) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/evaluacion/guia-i/preguntas', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const preguntas = await res.json();
        if (!res.ok) throw new Error('Error al cargar preguntas de la Guía I');

        const secciones = {
            I: preguntas.slice(0, 6),
            II: preguntas.slice(6, 8),
            III: preguntas.slice(8, 15),
            IV: preguntas.slice(15, 20)
        };
        mostrarGuiaI(idEvaluacion, secciones);
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

function mostrarGuiaI(idEvaluacion, secciones) {
    const nombresSecciones = {
        I: 'Acontecimiento traumático severo',
        II: 'Recuerdos persistentes sobre el acontecimiento',
        III: 'Esfuerzo por evitar circunstancias parecidas',
        IV: 'Afectación'
    };

    let html = `
        <button type="button" class="back-btn" id="back-btn-guia-i">← Atrás</button>
        <div style="color:white; padding:1rem; max-height:80vh; overflow-y:auto;" class="scroll-guia-i">
            <h2 class="form-title" style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
    <span class="icono-file-text"></span>
    Guía de Referencia I
</h2>
<p style="margin-bottom:1.5rem; font-size:0.9rem; opacity:0.8; text-align:center;">
    Responda las siguientes preguntas con <strong>Sí</strong> o <strong>No</strong>.
</p>
            <form id="form-guia-i">
    `;

    for (const [seccion, preguntas] of Object.entries(secciones)) {
        html += `<h3 style="margin-top:1.5rem; margin-bottom:0.5rem; font-size:1.1rem; color:rgba(255,255,255,0.9);">${nombresSecciones[seccion]}</h3>`;
        preguntas.forEach(p => {
            html += `
                <div style="margin-bottom:0.8rem; padding:0.5rem; background:rgba(255,255,255,0.05); border-radius:8px;">
                    <p style="margin:0 0 0.3rem 0; font-size:0.95rem;">${p.texto}</p>
                    <div style="display:flex; gap:1rem;">
                        <label style="display:flex; align-items:center; gap:0.3rem; cursor:pointer;">
                            <input type="radio" name="pregunta_${p.id_pregunta_guia_i}" value="1" required> Sí
                        </label>
                        <label style="display:flex; align-items:center; gap:0.3rem; cursor:pointer;">
                            <input type="radio" name="pregunta_${p.id_pregunta_guia_i}" value="0" required> No
                        </label>
                    </div>
                </div>
            `;
        });
    }

    html += `
                <button type="submit" style="margin-top:1.5rem;">Enviar respuestas</button>
            </form>
            <div id="mensaje-guia-i"></div>
        </div>
    `;

    formContainer.innerHTML = html;
    document.getElementById('back-btn-guia-i').addEventListener('click', goBack);
    formContainer.classList.remove('hidden');
    reportContainer.classList.add('hidden');

    document.getElementById('form-guia-i').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const respuestas = [];
        for (const [key, value] of formData.entries()) {
            const id_pregunta = parseInt(key.split('_')[1]);
            respuestas.push({ id_pregunta, respuesta: value === '1' });
        }
        await guardarGuiaI(idEvaluacion, respuestas);
    });
}

async function guardarGuiaI(idEvaluacion, respuestas) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/evaluacion/${idEvaluacion}/guia-i`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ respuestas })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar respuestas');

        if (data.requiereCanalizacion) {
            document.getElementById('mensaje-guia-i').innerHTML = `
                <div style="margin-top:1rem; padding:1rem; background:rgba(255,0,0,0.2); border-radius:12px; border:1px solid rgba(255,0,0,0.3);">
                    <h3 style="color:#ff6b6b;">⚠️ Se requiere canalización a atención clínica</h3>
                    <p>${data.detalle.seccionI}</p>
                    <p>${data.detalle.seccionII}</p>
                    <p>${data.detalle.seccionIII}</p>
                    <p>${data.detalle.seccionIV}</p>
                    <button onclick="goHome()" style="margin-top:1rem;">Volver al inicio</button>
                </div>
            `;
            document.getElementById('form-guia-i').querySelectorAll('input').forEach(el => el.disabled = true);
            document.getElementById('form-guia-i').querySelector('button[type="submit"]').disabled = true;
        } else {
            document.getElementById('mensaje-guia-i').innerHTML = `
                <div style="margin-top:1rem; padding:0.5rem; background:rgba(0,255,0,0.1); border-radius:8px;">
<p class="mensaje-estado" style="color:#90EE90;">
    <span class="icono-check"></span>
    No requiere canalización. Cargando cuestionario principal...
</p>
                </div>
            `;
            setTimeout(() => cargarGuiaIII(idEvaluacion), 1500);
        }
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function cargarGuiaIII(idEvaluacion) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/evaluacion/${idEvaluacion}/preguntas`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const preguntas = await res.json();
        if (!res.ok) throw new Error('Error al cargar preguntas');

        mostrarGuiaIII(idEvaluacion, preguntas);
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

function mostrarGuiaIII(idEvaluacion, preguntas) {
    formContainer.innerHTML = `
        <button type="button" class="back-btn" id="back-btn-guia-iii">← Atrás</button>
        <div style="color:white; padding:1rem;">
            <h2 class="form-title" style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
    <span class="icono-file-text"></span>
    Guía de Referencia III
</h2>
            <p>Se cargarán ${preguntas.length} preguntas agrupadas por categoría y dominio.</p>
            <p style="margin-top:1rem; font-size:0.9rem; opacity:0.7;">(Próximamente: visualización completa del cuestionario)</p>
            <button onclick="finalizarEvaluacion(${idEvaluacion})" style="margin-top:1.5rem;">Finalizar evaluación</button>
        </div>
    `;
    document.getElementById('back-btn-guia-iii').addEventListener('click', goBack);
    formContainer.classList.remove('hidden');
}

async function finalizarEvaluacion(idEvaluacion) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/evaluacion/${idEvaluacion}/finalizar`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al finalizar');
        alert('✅ Evaluación finalizada. Los resultados estarán disponibles pronto.');
        goHome();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function continuarEvaluacion() {
    const token = localStorage.getItem('token');
    try {
        formContainer.innerHTML = `
            <button type="button" class="back-btn" id="back-btn-continuar">← Atrás</button>
            <div style="color:white; padding:1rem; text-align:center;">
                <h2 class="form-title" style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
    <span class="icono-continuar"></span>
    Continuar evaluación
</h2>
                <p>Próximamente: lista de evaluaciones guardadas.</p>
            </div>
        `;
        document.getElementById('back-btn-continuar').addEventListener('click', goBack);
        formContainer.classList.remove('hidden');
        reportContainer.classList.add('hidden');
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ---------- FUNCIONES AUXILIARES ----------
function mostrarFormularioCreacion() {
    document.getElementById('tabla-usuarios').style.display = 'none';
    document.getElementById('crear-usuario-card').style.display = 'none';
    document.getElementById('form-creacion-container').style.display = 'block';
}

function ocultarFormularioCreacion() {
    document.getElementById('tabla-usuarios').style.display = 'block';
    document.getElementById('crear-usuario-card').style.display = 'flex';
    document.getElementById('form-creacion-container').style.display = 'none';
}

// ---------- ELIMINAR USUARIO ----------
async function eliminarUsuario(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');
        alert(' Usuario eliminado');
        mostrarGestionUsuarios();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ---------- RESTABLECER CONTRASEÑA ----------
async function resetPassword(id) {
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`/api/usuarios/${id}/reset-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error al restablecer contraseña');
        }

        mostrarModalContraseña(data.nueva_contraseña);
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

function mostrarModalContraseña(contraseña) {
    const modalExistente = document.getElementById('modal-contraseña');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-contraseña';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    modal.innerHTML = `
        <div style="background: rgba(255,255,255,0.15);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 24px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            color: #fff;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <h2 style="display:flex; align-items:center; justify-content:center; gap:0.5rem; margin-top:0;">
                <span class="icono-llave"></span>
                Nueva contraseña
            </h2>
            <p style="font-size: 1.8rem; font-weight: bold; background: rgba(255,255,255,0.1); padding: 0.8rem; border-radius: 12px; margin: 1rem 0; letter-spacing: 2px;">
                ${contraseña}
            </p>
            <button id="copiar-contraseña" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 30px; color: #fff; padding: 0.6rem 1.5rem; cursor: pointer; margin-right: 0.5rem; transition: 0.3s; display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem;">
                <span class="icono-clipboard"></span>
                Copiar
            </button>
            <button id="cerrar-modal" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); border-radius: 30px; color: #fff; padding: 0.6rem 1.5rem; cursor: pointer; transition: 0.3s;">
                Cerrar
            </button>
            <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 1rem; display:flex; align-items:center; justify-content:center; gap:0.3rem;">
                <span class="icono-advertencia" style="width: 1.2rem; height: 1.2rem;"></span>
                Esta contraseña se muestra una sola vez. Entrégala al usuario.
            </p>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cerrar-modal').addEventListener('click', () => modal.remove());
    document.getElementById('copiar-contraseña').addEventListener('click', () => {
        navigator.clipboard?.writeText(contraseña).then(() => {
            alert('✅ Contraseña copiada al portapapeles');
        }).catch(() => {
            const range = document.createRange();
            const texto = modal.querySelector('p[style*="font-size: 1.8rem"]');
            range.selectNode(texto);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            alert('✅ Contraseña copiada al portapapeles');
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ---------- FORMULARIO DE EDICIÓN ----------
function mostrarFormularioEdicion(id, nombre, email, rol) {
    const token = localStorage.getItem('token');
    reportContainer.innerHTML = `
        <button type="button" class="back-btn" id="back-btn-editar">← Atrás</button>
        <div style="color:white; padding:1rem;">
            <h2 class="form-title" style="display:flex; align-items:center; gap:0.5rem;">
                <span class="icono-editar-titulo"></span>
                Editar usuario
            </h2>
            <form id="form-editar-usuario">
                <label>Nombre completo</label>
                <input type="text" id="edit-nombre" value="${nombre}" required>

                <label>Email</label>
                <input type="email" id="edit-email" value="${email}" required>

                <label>Nueva contraseña (dejar vacío para no cambiar)</label>
                <input type="password" id="edit-password" placeholder="Nueva contraseña">

                <label>Rol</label>
                <select id="edit-rol">
                    <option value="1" ${rol == 1 ? 'selected' : ''}>Administrador</option>
                    <option value="2" ${rol == 2 ? 'selected' : ''}>Supervisor</option>
                    <option value="3" ${rol == 3 ? 'selected' : ''}>Empleado</option>
                </select>

                <button type="submit">Actualizar usuario</button>
            </form>
            <div id="mensaje-edicion"></div>
        </div>
    `;
    reportContainer.classList.remove('hidden');

    document.getElementById('back-btn-editar').addEventListener('click', () => {
        mostrarGestionUsuarios();
    });

    document.getElementById('form-editar-usuario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('edit-nombre').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const password = document.getElementById('edit-password').value.trim();
        const id_rol = parseInt(document.getElementById('edit-rol').value);

        const mensajeDiv = document.getElementById('mensaje-edicion');
        mensajeDiv.innerHTML = `<p class="mensaje-estado" style="color:#facf29;">
        <span class="icono-loader-amarillo"></span> Actualizando usuario...
    </p>`;

        try {
            const res = await fetch(`/api/usuarios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ nombre, email, password, id_rol })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al actualizar usuario');
            }

            mensajeDiv.innerHTML = `
            <p class="mensaje-estado" style="color:#facf29;">
                <span class="icono-check-amarillo"></span>
                Usuario actualizado correctamente.
            </p>
        `;
            setTimeout(() => mostrarGestionUsuarios(), 1500);
        } catch (err) {
            mensajeDiv.innerHTML = `<p style="color:#FF6B6B;">❌ ${err.message}</p>`;
        }
    });
}

// ---------- NAVEGACIÓN COMÚN ----------
function goBack() {
    formContainer.classList.add('hidden');
    reportContainer.classList.add('hidden');
    typeSelection.classList.remove('hidden');
}

function goHome() {
    typeSelection.classList.add('hidden');
    formContainer.classList.add('hidden');
    reportContainer.classList.add('hidden');
    homeScreen.classList.remove('hidden');
}

// ---------- ICONOS DE LAS TARJETAS ----------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.card[data-type="nueva"] .card-icon').style.webkitMaskImage =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='12' y1='18' x2='12' y2='12'/%3E%3Cline x1='9' y1='15' x2='15' y2='15'/%3E%3C/svg%3E\")";

    document.querySelector('.card[data-type="continuar"] .card-icon').style.webkitMaskImage =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpolygon points='5 3 19 12 5 21 5 3'/%3E%3C/svg%3E\")";

    document.querySelector('.card[data-type="reportes"] .card-icon').style.webkitMaskImage =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='10' width='4' height='11'/%3E%3Crect x='10' y='4' width='4' height='17'/%3E%3Crect x='17' y='7' width='4' height='14'/%3E%3C/svg%3E\")";

    document.querySelector('.card[data-type="usuarios"] .card-icon').style.webkitMaskImage =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E\")";
});