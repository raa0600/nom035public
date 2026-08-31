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

    const userRol = parseInt(localStorage.getItem('userRol'));
    const isAdmin = userRol === 1;
    const isSupervisor = userRol === 2;
    const isEmpleado = userRol === 3;

    const nuevaCard = document.querySelector('.card[data-type="nueva"]');
    const continuarCard = document.querySelector('.card[data-type="continuar"]');
    const reportCard = document.querySelector('.card[data-type="reportes"]');
    const usuariosCard = document.querySelector('.card[data-type="usuarios"]');
    const canalizacionCard = document.querySelector('.card[data-type="canalizacion"]');
    const graficasCard = document.querySelector('.card[data-type="graficas"]');

    if (isAdmin || isEmpleado) {
        if (nuevaCard) nuevaCard.style.display = 'flex';
        if (continuarCard) continuarCard.style.display = 'flex';
    } else {
        if (nuevaCard) nuevaCard.style.display = 'none';
        if (continuarCard) continuarCard.style.display = 'none';
    }

    if (isAdmin || isSupervisor) {
        if (reportCard) reportCard.style.display = 'flex';
        if (graficasCard) graficasCard.style.display = 'flex';
    } else {
        if (reportCard) reportCard.style.display = 'none';
        if (graficasCard) graficasCard.style.display = 'none';
    }

    if (isAdmin || isSupervisor) {
        if (canalizacionCard) canalizacionCard.style.display = 'flex';
    } else {
        if (canalizacionCard) canalizacionCard.style.display = 'none';
    }

    if (isAdmin) {
        if (usuariosCard) usuariosCard.style.display = 'flex';
    } else {
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
    const userRol = localStorage.getItem('userRol');

    if (type === 'nueva' || type === 'continuar') {
        if (userRol !== '1' && userRol !== '3') {
            alert('❌ No tienes permiso para realizar evaluaciones.');
            return;
        }
    }
    if (type === 'reportes' || type === 'canalizacion' || type === 'graficas') {
        if (userRol !== '1' && userRol !== '2') {
            alert('❌ No tienes permiso para ver esta sección.');
            return;
        }
    }
    if (type === 'usuarios') {
        if (userRol !== '1') {
            alert('❌ No tienes permiso para gestionar usuarios.');
            return;
        }
    }

    typeSelection.classList.add('hidden');

    if (type === 'nueva') {
        iniciarEvaluacion();
    } else if (type === 'continuar') {
        continuarEvaluacion();
    } else if (type === 'reportes') {
        mostrarReportes();
    } else if (type === 'graficas') {
        mostrarGraficas();
    } else if (type === 'usuarios') {
        mostrarGestionUsuarios();
    } else if (type === 'canalizacion') {
        mostrarCanalizaciones();
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
// MODAL DE CONFIRMACIÓN (ELIMINAR)
// ============================================================
function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
    const modalExistente = document.getElementById('modal-confirmacion');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-confirmacion';
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
            <div class="modal-icon"></div>
            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${titulo}</h2>
            <p style="margin-bottom: 1.5rem; opacity: 0.9;">${mensaje}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button id="confirm-cancelar" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 30px; color: #fff; padding: 0.6rem 1.5rem; cursor: pointer; transition: 0.3s; flex: 1; max-width: 160px; font-family: 'Inter', sans-serif; font-size: 1rem;">Cancelar</button>
                <button id="confirm-eliminar" style="background: linear-gradient(135deg, rgba(255,0,0,0.3), rgba(200,0,0,0.4)); border: 1px solid rgba(255,0,0,0.5); border-radius: 30px; color: #fff; padding: 0.6rem 1.5rem; cursor: pointer; transition: 0.3s; flex: 1; max-width: 160px; font-family: 'Inter', sans-serif; font-size: 1rem;">Eliminar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('confirm-cancelar').addEventListener('click', () => modal.remove());
    document.getElementById('confirm-eliminar').addEventListener('click', () => {
        modal.remove();
        if (typeof onConfirm === 'function') onConfirm();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ============================================================
// MODAL DE ÉXITO
// ============================================================
function mostrarModalExito(titulo, mensaje, callback, botonTexto = 'Aceptar') {
    const modalExistente = document.getElementById('modal-exito');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-exito';
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
            <div style="display: inline-block; width: 4rem; height: 4rem; margin-bottom: 1rem; background-size: 200% 200%; background-image: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(200,225,255,1) 25%, rgba(255,255,255,1) 50%, rgba(210,235,255,1) 75%, rgba(255,255,255,1) 100%); animation: holographic 3s ease infinite; -webkit-mask-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M22 11.08V12a10 10 0 1 1-5.93-9.14%22/%3E%3Cpolyline points=%2222 4 12 14.01 9 11.01%22/%3E%3C/svg%3E'); mask-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M22 11.08V12a10 10 0 1 1-5.93-9.14%22/%3E%3Cpolyline points=%2222 4 12 14.01 9 11.01%22/%3E%3C/svg%3E'); -webkit-mask-size: contain; mask-size: contain; -webkit-mask-position: center; mask-position: center; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;"></div>
            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #fff;">${titulo}</h2>
            <p style="margin-bottom: 1.5rem; opacity: 0.9;">${mensaje}</p>
            <button id="modal-exito-cerrar" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 30px; color: #fff; padding: 0.6rem 1.5rem; cursor: pointer; transition: 0.3s; font-family: 'Inter', sans-serif; font-size: 1rem;">${botonTexto}</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modal-exito-cerrar').addEventListener('click', () => {
        modal.remove();
        if (typeof callback === 'function') callback();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (typeof callback === 'function') callback();
        }
    });
}

// ============================================================
// MODAL PARA PREGUNTAS FALTANTES
// ============================================================
function mostrarModalFaltantes(mensaje, titulo = 'Preguntas faltantes') {
    const previo = document.getElementById('modal-faltantes');
    if (previo) previo.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-faltantes';
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
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#fff; margin-bottom:1rem;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h2 style="margin:0 0 0.5rem; font-size:1.5rem;">${titulo}</h2>
            <p style="margin-bottom:1.5rem; opacity:0.9;">${mensaje}</p>
            <button id="modal-faltantes-cerrar" style="background: rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4); border-radius:30px; color:#fff; padding:0.6rem 1.5rem; cursor:pointer; transition:0.3s; font-family:'Inter', sans-serif; font-size:1rem;">Aceptar</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modal-faltantes-cerrar').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
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
                        <th style="padding:10px 14px;">Departamento</th>
                        <th style="padding:10px 14px;">Rol</th>
                        <th style="padding:10px 14px;">Acciones</th>
                    </tr>
                    ${usuarios.map(u => `
                        <tr>
                            <td style="padding:10px 14px;">${u.id_usuario}</td>
                            <td style="padding:10px 14px;">${u.nombre}</td>
                            <td style="padding:10px 14px;">${u.email}</td>
                            <td style="padding:10px 14px;">${u.departamento || 'N/A'}</td>
                            <td style="padding:10px 14px;">${u.rol_nombre || u.id_rol}</td>
                            <td style="padding:10px 14px; white-space:nowrap;">
                               <button class="btn-accion editar-usuario" title="Actualizar" data-id="${u.id_usuario}">
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
                <form id="form-crear-usuario" style="max-width:520px; margin:0 auto; padding:1rem 0;" novalidate>
                    <label>Nombre completo</label>
                    <input type="text" id="nombre-usuario" class="campo-gestion" placeholder="Ej. Juan Pérez" required>

                    <label>Email</label>
                    <input type="email" id="email-usuario" class="campo-gestion" placeholder="usuario@empresa.com" required>

                    <label>Contraseña</label>
                    <input type="password" id="password-usuario" class="campo-gestion" placeholder="Mínimo 6 caracteres" minlength="6" required>

                    <label>Departamento</label>
                    <input type="text" id="departamento-usuario" class="campo-gestion" placeholder="Ej. Sistemas, RH, Operaciones">

                    <label>Sexo</label>
                    <select id="sexo-usuario" class="campo-gestion">
                        <option value="">Seleccione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                    </select>

                    <label>Edad</label>
                    <input type="number" id="edad-usuario" class="campo-gestion" placeholder="Ej. 30" min="15" max="100">

                    <label>Estado civil</label>
                    <select id="estado-civil-usuario" class="campo-gestion">
                        <option value="">Seleccione...</option>
                        <option value="Soltero">Soltero</option>
                        <option value="Casado">Casado</option>
                        <option value="Unión libre">Unión libre</option>
                        <option value="Divorciado">Divorciado</option>
                        <option value="Viudo">Viudo</option>
                    </select>

                    <label>Nivel de estudios</label>
                    <select id="nivel-estudios-usuario" class="campo-gestion">
                        <option value="">Seleccione...</option>
                        <option value="Primaria">Primaria</option>
                        <option value="Secundaria">Secundaria</option>
                        <option value="Preparatoria">Preparatoria</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Licenciatura">Licenciatura</option>
                        <option value="Posgrado">Posgrado</option>
                    </select>

                    <label>Ocupación / Profesión / Puesto</label>
                    <input type="text" id="ocupacion-usuario" class="campo-gestion" placeholder="Ej. Ingeniero de Software">

                    <label>Tipo de puesto</label>
                    <select id="tipo-puesto-usuario" class="campo-gestion">
                        <option value="">Seleccione...</option>
                        <option value="Operativo">Operativo</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Supervisión">Supervisión</option>
                        <option value="Gerencial">Gerencial</option>
                        <option value="Directivo">Directivo</option>
                    </select>

                    <label>Tipo de contratación</label>
                    <select id="tipo-contratacion-usuario" class="campo-gestion">
                        <option value="">Seleccione...</option>
                        <option value="Base">Base</option>
                        <option value="Confianza">Confianza</option>
                        <option value="Honorarios">Honorarios</option>
                        <option value="Prácticas">Prácticas</option>
                    </select>

                    <label>Tipo de personal</label>
                    <select id="tipo-personal-usuario" class="campo-gestion">
                        <option value="">Seleccione...</option>
                        <option value="Interno">Interno</option>
                        <option value="Externo / Outsourcing">Externo / Outsourcing</option>
                    </select>

                    <label>Tipo de jornada</label>
                    <select id="tipo-jornada-usuario" class="campo-gestion">
                        <option value="">Seleccione...</option>
                        <option value="Tiempo completo">Tiempo completo</option>
                        <option value="Medio tiempo">Medio tiempo</option>
                        <option value="Por horas">Por horas</option>
                        <option value="Turnos rotativos">Turnos rotativos</option>
                    </select>

                    <label>¿Tiene rotación de turno?</label>
                    <select id="rotacion-turno-usuario" class="campo-gestion">
                        <option value="0">No</option>
                        <option value="1">Sí</option>
                    </select>

                    <label>Tiempo de experiencia en el puesto (años)</label>
                    <input type="number" id="tiempo-puesto-usuario" class="campo-gestion" placeholder="Ej. 2" min="0" max="60">

                    <label>Tiempo de experiencia laboral total (años)</label>
                    <input type="number" id="tiempo-laboral-usuario" class="campo-gestion" placeholder="Ej. 5" min="0" max="60">

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

    // ============================================================
    // MANEJADOR DE ENVÍO DEL FORMULARIO DE CREACIÓN
    // ============================================================
    document.getElementById('form-crear-usuario')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validación de todos los campos
        const camposFaltantes = [];
        const nombre = document.getElementById('nombre-usuario').value.trim();
        const email = document.getElementById('email-usuario').value.trim();
        const password = document.getElementById('password-usuario').value.trim();
        const departamento = document.getElementById('departamento-usuario').value.trim();
        const sexo = document.getElementById('sexo-usuario').value;
        const edad = document.getElementById('edad-usuario').value.trim();
        const estado_civil = document.getElementById('estado-civil-usuario').value;
        const nivel_estudios = document.getElementById('nivel-estudios-usuario').value;
        const ocupacion = document.getElementById('ocupacion-usuario').value.trim();
        const tipo_puesto = document.getElementById('tipo-puesto-usuario').value;
        const tipo_contratacion = document.getElementById('tipo-contratacion-usuario').value;
        const tipo_personal = document.getElementById('tipo-personal-usuario').value;
        const tipo_jornada = document.getElementById('tipo-jornada-usuario').value;
        const rotacion_turno = document.getElementById('rotacion-turno-usuario').value === '1';
        const exp_puesto = document.getElementById('tiempo-puesto-usuario').value.trim();
        const exp_laboral = document.getElementById('tiempo-laboral-usuario').value.trim();
        const id_rol = parseInt(document.getElementById('rol-usuario').value);

        if (!nombre) camposFaltantes.push('Nombre completo');
        if (!email) camposFaltantes.push('Email');
        if (!password) camposFaltantes.push('Contraseña');
        if (!departamento) camposFaltantes.push('Departamento');
        if (!sexo) camposFaltantes.push('Sexo');
        if (!edad) camposFaltantes.push('Edad');
        if (!estado_civil) camposFaltantes.push('Estado civil');
        if (!nivel_estudios) camposFaltantes.push('Nivel de estudios');
        if (!ocupacion) camposFaltantes.push('Ocupación');
        if (!tipo_puesto) camposFaltantes.push('Tipo de puesto');
        if (!tipo_contratacion) camposFaltantes.push('Tipo de contratación');
        if (!tipo_personal) camposFaltantes.push('Tipo de personal');
        if (!tipo_jornada) camposFaltantes.push('Tipo de jornada');
        if (!exp_puesto) camposFaltantes.push('Experiencia en puesto');
        if (!exp_laboral) camposFaltantes.push('Experiencia laboral');

        if (camposFaltantes.length > 0) {
            mostrarModalFaltantes(`Hay campos obligatorios sin contestar: ${camposFaltantes.join(', ')}.`, 'Campos faltantes');
            return;
        }

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
                body: JSON.stringify({
                    nombre,
                    email,
                    password,
                    departamento,
                    id_rol,
                    sexo,
                    edad: parseInt(edad) || null,
                    estado_civil,
                    nivel_estudios,
                    ocupacion_profesion_puesto: ocupacion,
                    tipo_puesto,
                    tipo_contratacion,
                    tipo_personal,
                    tipo_jornada,
                    rotacion_turno,
                    tiempo_exp_puesto: parseInt(exp_puesto) || null,
                    tiempo_exp_laboral: parseInt(exp_laboral) || null
                })
            });
            const data = await res.json();

            if (!res.ok) {
                mensajeDiv.innerHTML = `<p class="mensaje-estado" style="color:#FFA500;">❌ ${data.error || 'Error al crear usuario'}</p>`;
                return;
            }

            mensajeDiv.innerHTML = `
                <p class="mensaje-estado" style="color:#facf29;">
                    <span class="icono-check-amarillo"></span>
                    Usuario creado exitosamente.
                </p>
            `;
            document.getElementById('form-crear-usuario').reset();
            setTimeout(() => {
                ocultarFormularioCreacion();
                mostrarGestionUsuarios();
            }, 1500);
        } catch (err) {
            mensajeDiv.innerHTML = `<p style="color:#FF6B6B;">❌ Error de conexión: ${err.message}</p>`;
        }
    });

    // ... (resto de listeners para editar, reset, eliminar permanecen igual)
    document.querySelectorAll('.editar-usuario').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            try {
                const res = await fetch(`/api/usuarios/${id}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (!res.ok) throw new Error('No se pudo obtener el usuario');
                const usuario = await res.json();
                mostrarFormularioEdicion(usuario);
            } catch (err) {
                alert('❌ ' + err.message);
            }
        });
    });

    document.querySelectorAll('.reset-password').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            await resetPassword(id);
        });
    });

    document.querySelectorAll('.eliminar-usuario').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const row = btn.closest('tr');
            const nombre = row ? row.querySelector('td:nth-child(2)').textContent : 'este usuario';
            mostrarModalConfirmacion(
                'Eliminar usuario',
                `¿Estás seguro de que deseas eliminar a <strong>${nombre}</strong>? Esta acción no se puede deshacer.`,
                () => eliminarUsuario(id)
            );
        });
    });
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

async function eliminarUsuario(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');
        mostrarModalExito('Usuario eliminado', 'El usuario ha sido eliminado correctamente.', () => {
            mostrarGestionUsuarios();
        });
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

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

function mostrarFormularioEdicion(usuario) {
    const token = localStorage.getItem('token');
    const {
        id_usuario, nombre, email, departamento, id_rol,
        sexo, edad, estado_civil, nivel_estudios,
        ocupacion_profesion_puesto, tipo_puesto, tipo_contratacion,
        tipo_personal, tipo_jornada, rotacion_turno,
        tiempo_exp_puesto, tiempo_exp_laboral
    } = usuario;

    reportContainer.innerHTML = `
        <button type="button" class="back-btn" id="back-btn-editar">← Atrás</button>
        <div style="color:white; padding:1rem;">
            <h2 class="form-title" style="display:flex; align-items:center; gap:0.5rem;">
                <span class="icono-editar-titulo"></span>
                Editar usuario
            </h2>
            <form id="form-editar-usuario" novalidate>
                <label>Nombre completo</label>
                <input type="text" id="edit-nombre" value="${nombre}" required>

                <label>Email</label>
                <input type="email" id="edit-email" value="${email}" required>

                <label>Departamento</label>
                <input type="text" id="edit-departamento" value="${departamento || ''}">

                <label>Sexo</label>
                <select id="edit-sexo">
                    <option value="">Seleccione...</option>
                    <option value="Masculino" ${sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                    <option value="Femenino" ${sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
                    <option value="Otro" ${sexo === 'Otro' ? 'selected' : ''}>Otro</option>
                </select>

                <label>Edad</label>
                <input type="number" id="edit-edad" value="${edad || ''}" min="15" max="100">

                <label>Estado civil</label>
                <select id="edit-estado-civil">
                    <option value="">Seleccione...</option>
                    <option value="Soltero" ${estado_civil === 'Soltero' ? 'selected' : ''}>Soltero</option>
                    <option value="Casado" ${estado_civil === 'Casado' ? 'selected' : ''}>Casado</option>
                    <option value="Unión libre" ${estado_civil === 'Unión libre' ? 'selected' : ''}>Unión libre</option>
                    <option value="Divorciado" ${estado_civil === 'Divorciado' ? 'selected' : ''}>Divorciado</option>
                    <option value="Viudo" ${estado_civil === 'Viudo' ? 'selected' : ''}>Viudo</option>
                </select>

                <label>Nivel de estudios</label>
                <select id="edit-nivel-estudios">
                    <option value="">Seleccione...</option>
                    <option value="Primaria" ${nivel_estudios === 'Primaria' ? 'selected' : ''}>Primaria</option>
                    <option value="Secundaria" ${nivel_estudios === 'Secundaria' ? 'selected' : ''}>Secundaria</option>
                    <option value="Preparatoria" ${nivel_estudios === 'Preparatoria' ? 'selected' : ''}>Preparatoria</option>
                    <option value="Técnico" ${nivel_estudios === 'Técnico' ? 'selected' : ''}>Técnico</option>
                    <option value="Licenciatura" ${nivel_estudios === 'Licenciatura' ? 'selected' : ''}>Licenciatura</option>
                    <option value="Posgrado" ${nivel_estudios === 'Posgrado' ? 'selected' : ''}>Posgrado</option>
                </select>

                <label>Ocupación / Profesión / Puesto</label>
                <input type="text" id="edit-ocupacion" value="${ocupacion_profesion_puesto || ''}">

                <label>Tipo de puesto</label>
                <select id="edit-tipo-puesto">
                    <option value="">Seleccione...</option>
                    <option value="Operativo" ${tipo_puesto === 'Operativo' ? 'selected' : ''}>Operativo</option>
                    <option value="Administrativo" ${tipo_puesto === 'Administrativo' ? 'selected' : ''}>Administrativo</option>
                    <option value="Supervisión" ${tipo_puesto === 'Supervisión' ? 'selected' : ''}>Supervisión</option>
                    <option value="Gerencial" ${tipo_puesto === 'Gerencial' ? 'selected' : ''}>Gerencial</option>
                    <option value="Directivo" ${tipo_puesto === 'Directivo' ? 'selected' : ''}>Directivo</option>
                </select>

                <label>Tipo de contratación</label>
                <select id="edit-tipo-contratacion">
                    <option value="">Seleccione...</option>
                    <option value="Base" ${tipo_contratacion === 'Base' ? 'selected' : ''}>Base</option>
                    <option value="Confianza" ${tipo_contratacion === 'Confianza' ? 'selected' : ''}>Confianza</option>
                    <option value="Honorarios" ${tipo_contratacion === 'Honorarios' ? 'selected' : ''}>Honorarios</option>
                    <option value="Prácticas" ${tipo_contratacion === 'Prácticas' ? 'selected' : ''}>Prácticas</option>
                </select>

                <label>Tipo de personal</label>
                <select id="edit-tipo-personal">
                    <option value="">Seleccione...</option>
                    <option value="Interno" ${tipo_personal === 'Interno' ? 'selected' : ''}>Interno</option>
                    <option value="Externo / Outsourcing" ${tipo_personal === 'Externo / Outsourcing' ? 'selected' : ''}>Externo / Outsourcing</option>
                </select>

                <label>Tipo de jornada</label>
                <select id="edit-tipo-jornada">
                    <option value="">Seleccione...</option>
                    <option value="Tiempo completo" ${tipo_jornada === 'Tiempo completo' ? 'selected' : ''}>Tiempo completo</option>
                    <option value="Medio tiempo" ${tipo_jornada === 'Medio tiempo' ? 'selected' : ''}>Medio tiempo</option>
                    <option value="Por horas" ${tipo_jornada === 'Por horas' ? 'selected' : ''}>Por horas</option>
                    <option value="Turnos rotativos" ${tipo_jornada === 'Turnos rotativos' ? 'selected' : ''}>Turnos rotativos</option>
                </select>

                <label>¿Tiene rotación de turno?</label>
                <select id="edit-rotacion">
                    <option value="0" ${!rotacion_turno ? 'selected' : ''}>No</option>
                    <option value="1" ${rotacion_turno ? 'selected' : ''}>Sí</option>
                </select>

                <label>Tiempo de experiencia en el puesto (años)</label>
                <input type="number" id="edit-exp-puesto" value="${tiempo_exp_puesto || ''}" min="0" max="60">

                <label>Tiempo de experiencia laboral total (años)</label>
                <input type="number" id="edit-exp-laboral" value="${tiempo_exp_laboral || ''}" min="0" max="60">

                <label>Rol</label>
                <select id="edit-rol">
                    <option value="1" ${id_rol == 1 ? 'selected' : ''}>Administrador</option>
                    <option value="2" ${id_rol == 2 ? 'selected' : ''}>Supervisor</option>
                    <option value="3" ${id_rol == 3 ? 'selected' : ''}>Empleado</option>
                </select>

                <label>Nueva contraseña (dejar vacío para no cambiar)</label>
                <input type="password" id="edit-password" placeholder="Nueva contraseña">

                <button type="button" id="btn-actualizar-usuario" class="btn-holografico">Actualizar usuario</button>
            </form>
            <div id="mensaje-edicion"></div>
        </div>
    `;
    reportContainer.classList.remove('hidden');

    document.getElementById('back-btn-editar').addEventListener('click', () => {
        mostrarGestionUsuarios();
    });

    // Botón actualizar con evento click (no submit)
    document.getElementById('btn-actualizar-usuario').addEventListener('click', async () => {
        console.log('🟢 Click en Actualizar usuario');

        // Obtener valores
        const nombreVal = document.getElementById('edit-nombre').value.trim();
        const emailVal = document.getElementById('edit-email').value.trim();
        const departamentoVal = document.getElementById('edit-departamento').value.trim();
        const sexoVal = document.getElementById('edit-sexo').value;
        const edadVal = document.getElementById('edit-edad').value.trim();
        const estadoCivilVal = document.getElementById('edit-estado-civil').value;
        const nivelEstudiosVal = document.getElementById('edit-nivel-estudios').value;
        const ocupacionVal = document.getElementById('edit-ocupacion').value.trim();
        const tipoPuestoVal = document.getElementById('edit-tipo-puesto').value;
        const tipoContratacionVal = document.getElementById('edit-tipo-contratacion').value;
        const tipoPersonalVal = document.getElementById('edit-tipo-personal').value;
        const tipoJornadaVal = document.getElementById('edit-tipo-jornada').value;
        const rotacionTurnoVal = document.getElementById('edit-rotacion').value === '1';
        const expPuestoVal = document.getElementById('edit-exp-puesto').value.trim();
        const expLaboralVal = document.getElementById('edit-exp-laboral').value.trim();
        const rolVal = parseInt(document.getElementById('edit-rol').value);
        const passwordVal = document.getElementById('edit-password').value.trim();

        // Validación todos los campos obligatorios
        const camposFaltantes = [];
        if (!nombreVal) camposFaltantes.push('Nombre completo');
        if (!emailVal) camposFaltantes.push('Email');
        if (!departamentoVal) camposFaltantes.push('Departamento');
        if (!sexoVal) camposFaltantes.push('Sexo');
        if (!edadVal) camposFaltantes.push('Edad');
        if (!estadoCivilVal) camposFaltantes.push('Estado civil');
        if (!nivelEstudiosVal) camposFaltantes.push('Nivel de estudios');
        if (!ocupacionVal) camposFaltantes.push('Ocupación');
        if (!tipoPuestoVal) camposFaltantes.push('Tipo de puesto');
        if (!tipoContratacionVal) camposFaltantes.push('Tipo de contratación');
        if (!tipoPersonalVal) camposFaltantes.push('Tipo de personal');
        if (!tipoJornadaVal) camposFaltantes.push('Tipo de jornada');
        if (!expPuestoVal) camposFaltantes.push('Experiencia en puesto');
        if (!expLaboralVal) camposFaltantes.push('Experiencia laboral');

        if (camposFaltantes.length > 0) {
            mostrarModalFaltantes(`Hay campos obligatorios sin contestar: ${camposFaltantes.join(', ')}.`, 'Campos faltantes');
            return;
        }

        const mensajeDiv = document.getElementById('mensaje-edicion');
        mensajeDiv.innerHTML = `<p class="mensaje-estado" style="color:#facf29;">
            <span class="icono-loader-amarillo"></span> Actualizando usuario...
        </p>`;

        try {
            const res = await fetch(`/api/usuarios/${id_usuario}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    nombre: nombreVal,
                    email: emailVal,
                    password: passwordVal,
                    departamento: departamentoVal,
                    id_rol: rolVal,
                    sexo: sexoVal,
                    edad: parseInt(edadVal) || null,
                    estado_civil: estadoCivilVal,
                    nivel_estudios: nivelEstudiosVal,
                    ocupacion_profesion_puesto: ocupacionVal,
                    tipo_puesto: tipoPuestoVal,
                    tipo_contratacion: tipoContratacionVal,
                    tipo_personal: tipoPersonalVal,
                    tipo_jornada: tipoJornadaVal,
                    rotacion_turno: rotacionTurnoVal,
                    tiempo_exp_puesto: parseInt(expPuestoVal) || null,
                    tiempo_exp_laboral: parseInt(expLaboralVal) || null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al actualizar usuario');

            mensajeDiv.innerHTML = `<p class="mensaje-estado" style="color:#facf29;">
                <span class="icono-check-amarillo"></span>
                Usuario actualizado correctamente.
            </p>`;
            setTimeout(() => mostrarGestionUsuarios(), 1500);
        } catch (err) {
            mensajeDiv.innerHTML = `<p style="color:#FF6B6B;">❌ ${err.message}</p>`;
        }
    });
}

// ---------- CANALIZACIONES ----------
async function mostrarCanalizaciones() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/evaluacion/canalizacion', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar canalizaciones');

        let html = `
            <button type="button" class="back-btn" id="back-btn-canalizacion">← Atrás</button>
            <div style="color:white; padding:1rem; text-align:center;">
                <h2 class="form-title" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; margin-bottom:1.5rem;">
                    <span class="icono-reportes"></span>
                    Empleados que requieren canalización
                </h2>
                <div style="max-height:400px; overflow-y:auto; padding-right:0.5rem; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.8) rgba(255,255,255,0.08);">
                    <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px; overflow:hidden; margin:0 auto; text-align:left;">
                        <tr style="background:rgba(255,255,255,0.2);">
                            <th style="padding:10px 14px;">ID</th>
                            <th style="padding:10px 14px;">Nombre</th>
                            <th style="padding:10px 14px;">Departamento</th>
                            <th style="padding:10px 14px;">Fecha</th>
                            <th style="padding:10px 14px; text-align:center;">Acciones</th>
                        </tr>
                        ${data.map(u => `
                            <tr style="background: rgba(255,0,0,0.3) !important; border-bottom: 1px solid rgba(255,0,0,0.2);">
                                <td style="padding:10px 14px;">${u.id_usuario}</td>
                                <td style="padding:10px 14px;">${u.empleado_nombre}</td>
                                <td style="padding:10px 14px;">${u.departamento_seccion_area || 'N/A'}</td>
                                <td style="padding:10px 14px;">${new Date(u.fecha_aplicacion).toLocaleDateString()}</td>
                                <td style="padding:10px 14px; white-space:nowrap; text-align:center;">
                                    <button class="btn-accion eliminar-canalizacion" title="Eliminar" data-id="${u.id_evaluacion}" data-nombre="${u.empleado_nombre}">
                                        <span class="icono-eliminar"></span>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                ${data.length === 0 ? '<p style="margin-top:1rem; opacity:0.7;">No hay empleados que requieran canalización.</p>' : ''}
            </div>
        `;
        formContainer.innerHTML = html;
        formContainer.classList.remove('hidden');
        reportContainer.classList.add('hidden');
        document.getElementById('back-btn-canalizacion').addEventListener('click', goBack);

        document.querySelectorAll('.eliminar-canalizacion').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const nombre = btn.dataset.nombre;
                mostrarModalConfirmacion(
                    'Eliminar canalización',
                    `¿Estás seguro de que deseas eliminar la canalización de <strong>${nombre}</strong>? Esta acción no se puede deshacer.`,
                    () => eliminarCanalizacion(id)
                );
            });
        });
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function eliminarCanalizacion(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/evaluacion/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar canalización');
        mostrarModalExito('Canalización eliminada', 'La canalización ha sido eliminada correctamente.', () => {
            mostrarCanalizaciones();
        });
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ============================================================
// EVALUACIONES - Guía I y Guía III
// ============================================================
async function iniciarEvaluacion() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/evaluacion/estado-actual', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const evaluacion = await res.json();
        if (!res.ok) throw new Error(evaluacion.error || 'Error al verificar estado');

        if (evaluacion) {
            if (evaluacion.estatus === 'Canalizacion_requerida') {
                mostrarModalExito(
                    'Evaluación completada',
                    'Recursos Humanos revisará la información y se pondrá en contacto si es necesario.',
                    goHome,
                    'Aceptar'
                );
            } else if (evaluacion.estatus === 'En_proceso') {
                mostrarModalExito(
                    'Evaluación en curso',
                    'Ya tienes una evaluación en curso. ¿Deseas continuar donde la dejaste?',
                    () => cargarGuiaIII(evaluacion.id_evaluacion),
                    'Continuar'
                );
            } else if (evaluacion.estatus === 'Completada') {
                mostrarModalExito(
                    'Evaluación completada',
                    'Recursos Humanos revisará la información y se pondrá en contacto si es necesario.',
                    goHome,
                    'Aceptar'
                );
            }
            return;
        }

        const resIniciar = await fetch('/api/evaluacion/iniciar', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await resIniciar.json();
        if (!resIniciar.ok) throw new Error(data.error || 'Error al iniciar evaluación');
        cargarGuiaI(data.id_evaluacion);
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
        <div style="color:white; max-height:80vh; overflow-y:auto; padding:0;" class="scroll-guia-i">
            <form id="form-guia-i" class="formulario-nom035">
                <h2 class="form-title" style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                    <span class="icono-file-text"></span>
                    Guía de Referencia I
                </h2>
                <p style="margin-bottom:1.5rem; font-size:0.9rem; opacity:0.8; text-align:center;">
                    Responda las siguientes preguntas con <strong>Sí</strong> o <strong>No</strong>.
                </p>

                <!-- Sección I siempre visible -->
                <h3 style="margin-top:0.5rem; margin-bottom:0.5rem; font-size:1.1rem; color:rgba(255,255,255,0.9); padding-left:0.5rem;">${nombresSecciones.I}</h3>
    `;

    secciones.I.forEach(p => {
        html += `
            <div class="pregunta-item">
                <p style="margin:0 0 0.3rem 0; font-size:0.95rem;">${p.texto}</p>
                <div class="opciones-label">
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

    // Contenedor para secciones condicionales (II, III, IV)
    html += `<div id="secciones-condicionales" style="display:none;">`;

    ['II', 'III', 'IV'].forEach(seccion => {
        html += `<h3 style="margin-top:1.5rem; margin-bottom:0.5rem; font-size:1.1rem; color:rgba(255,255,255,0.9); padding-left:0.5rem;">${nombresSecciones[seccion]}</h3>`;
        secciones[seccion].forEach(p => {
            html += `
                <div class="pregunta-item">
                    <p style="margin:0 0 0.3rem 0; font-size:0.95rem;">${p.texto}</p>
                    <div class="opciones-label">
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
    });

    html += `
        </div>

        <!-- Botones -->
        <div class="botones-guia-iii" style="display:flex; gap:1rem; margin-top:1.5rem;">
            <button type="button" id="btn-continuar-guia-i" class="btn-holografico">Continuar</button>
            <button type="button" id="btn-enviar-guia-i" class="btn-holografico" style="display:none;">Enviar respuestas</button>
        </div>
    </form>
    </div>
    `;

    formContainer.innerHTML = html;
    document.getElementById('back-btn-guia-i').addEventListener('click', goBack);
    formContainer.classList.remove('hidden');
    reportContainer.classList.add('hidden');

    const obtenerRespuestas = () => {
        const respuestas = [];
        document.querySelectorAll('#form-guia-i input[type="radio"]:checked').forEach(radio => {
            const id_pregunta = parseInt(radio.name.split('_')[1]);
            respuestas.push({
                id_pregunta,
                respuesta: radio.value === '1'
            });
        });
        return respuestas;
    };

    const validarSeccion = (numeros) => {
        for (const num of numeros) {
            const contestada = document.querySelector(`input[name="pregunta_${num}"]:checked`);
            if (!contestada) return false;
        }
        return true;
    };

    document.getElementById('btn-continuar-guia-i').addEventListener('click', async () => {
        if (!validarSeccion([1,2,3,4,5,6])) {
            mostrarModalFaltantes('Debes contestar todas las preguntas de la Sección I antes de continuar.');
            return;
        }

        const radiosSeccionI = document.querySelectorAll('input[name^="pregunta_"]:checked');
        let algunaSi = false;
        radiosSeccionI.forEach(radio => {
            const id = parseInt(radio.name.split('_')[1]);
            if (id >= 1 && id <= 6 && radio.value === '1') {
                algunaSi = true;
            }
        });

        if (!algunaSi) {
            await guardarGuiaI(idEvaluacion, obtenerRespuestas());
        } else {
            document.getElementById('secciones-condicionales').style.display = 'block';
            document.getElementById('btn-continuar-guia-i').style.display = 'none';
            document.getElementById('btn-enviar-guia-i').style.display = 'block';
        }
    });

    document.getElementById('btn-enviar-guia-i').addEventListener('click', async () => {
        const numerosTodas = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
        if (!validarSeccion(numerosTodas)) {
            mostrarModalFaltantes('Debes contestar todas las preguntas de las Secciones I, II, III y IV.');
            return;
        }
        await guardarGuiaI(idEvaluacion, obtenerRespuestas());
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
            mostrarModalExito(
                'Evaluación completada',
                'Recursos Humanos revisará la información y se pondrá en contacto si es necesario.',
                goHome,
                'Aceptar'
            );
        } else {
            mostrarModalExito(
                'Evaluación completada',
                'Haga clic en Continuar para iniciar el cuestionario principal.',
                () => cargarGuiaIII(idEvaluacion),
                'Continuar'
            );
        }
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ============================================================
// GUÍA III COMPLETA
// ============================================================
async function cargarGuiaIII(idEvaluacion) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/evaluacion/${idEvaluacion}/progreso`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar progreso');

        const preguntas = data.preguntas;
        const respuestas = data.respuestas;
        const respuestasMap = {};
        respuestas.forEach(r => { respuestasMap[r.id_pregunta] = r.valor_escogido; });

        const bloques = [
            { inicio: 1, fin: 5, titulo: 'Para responder las preguntas siguientes considere las condiciones ambientales de su centro de trabajo.' },
            { inicio: 6, fin: 8, titulo: 'Para responder a las preguntas siguientes piense en la cantidad y ritmo de trabajo que tiene.' },
            { inicio: 9, fin: 12, titulo: 'Las preguntas siguientes están relacionadas con el esfuerzo mental que le exige su trabajo.' },
            { inicio: 13, fin: 16, titulo: 'Las preguntas siguientes están relacionadas con las actividades que realiza en su trabajo y las responsabilidades que tiene.' },
            { inicio: 17, fin: 22, titulo: 'Las preguntas siguientes están relacionadas con su jornada de trabajo.' },
            { inicio: 23, fin: 28, titulo: 'Las preguntas siguientes están relacionadas con las decisiones que puede tomar en su trabajo.' },
            { inicio: 29, fin: 30, titulo: 'Las preguntas siguientes están relacionadas con cualquier tipo de cambio que ocurra en su trabajo (considere los últimos cambios realizados).' },
            { inicio: 31, fin: 36, titulo: 'Las preguntas siguientes están relacionadas con la capacitación e información que se le proporciona sobre su trabajo.' },
            { inicio: 37, fin: 41, titulo: 'Las preguntas siguientes están relacionadas con el o los jefes con quien tiene contacto.' },
            { inicio: 42, fin: 46, titulo: 'Las preguntas siguientes se refieren a las relaciones con sus compañeros.' },
            { inicio: 47, fin: 56, titulo: 'Las preguntas siguientes están relacionadas con la información que recibe sobre su rendimiento en el trabajo, el reconocimiento, el sentido de pertenencia y la estabilidad que le ofrece su trabajo.' },
            { inicio: 57, fin: 64, titulo: 'Las preguntas siguientes están relacionadas con actos de violencia laboral (malos tratos, acoso, hostigamiento, acoso psicológico).' }
        ];

        let displayNumber = 1;

        let html = `
            <button type="button" class="back-btn" id="back-btn-guia-iii">← Atrás</button>
            <div style="color:white; max-height:80vh; overflow-y:auto; padding:0;" class="scroll-guia-i">
                <form id="form-guia-iii" class="formulario-nom035">
                    <h2 class="form-title">Guía de Referencia III</h2>
                    <p style="margin-bottom:1rem;">Seleccione una opción para cada pregunta.</p>
        `;

        // Bloques principales
        for (const bloque of bloques) {
            html += `<h3 style="margin-top:1.5rem; margin-bottom:0.5rem; padding-left:0.5rem;">${bloque.titulo}</h3>`;
            const preguntasBloque = preguntas.filter(p => p.numero >= bloque.inicio && p.numero <= bloque.fin);
            preguntasBloque.forEach(pregunta => {
                const valorActual = respuestasMap[pregunta.id_pregunta] !== undefined ? respuestasMap[pregunta.id_pregunta] : -1;
                html += `
                    <div class="pregunta-item" data-id-pregunta="${pregunta.id_pregunta}">
                        <p style="margin:0 0 0.6rem 0; font-size:0.95rem;">${displayNumber}. ${pregunta.texto}</p>
                        <div class="opciones-label">
                            ${['Siempre','Casi siempre','Algunas veces','Casi nunca','Nunca'].map((opcion, idx) => `
                                <label style="display:flex; align-items:center; gap:0.3rem; cursor:pointer;">
                                    <input type="radio" name="pregunta_${pregunta.id_pregunta}" value="${4 - idx}" ${valorActual === (4 - idx) ? 'checked' : ''}>
                                    ${opcion}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
                displayNumber++;
            });
        }

        // Clientes condicional
        html += `
            <div class="pregunta-item" style="margin-top:1.5rem;">
                <p style="margin:0 0 0.5rem 0; font-weight:bold;">¿En su trabajo debe brindar servicio a clientes o usuarios?</p>
                <div class="opciones-label">
                    <label><input type="radio" name="filtro_clientes" value="1"> Sí</label>
                    <label><input type="radio" name="filtro_clientes" value="0" checked> No</label>
                </div>
            </div>
            <div class="condicional-clientes" style="display:none;">
                <h3 style="margin-top:1rem; margin-bottom:0.5rem; padding-left:0.5rem;">Las preguntas siguientes están relacionadas con la atención a clientes y usuarios.</h3>
                ${(() => {
                    let htmlClientes = '';
                    const preguntasClientes = preguntas.filter(p => p.numero >= 65 && p.numero <= 68);
                    preguntasClientes.forEach(pregunta => {
                        const valorActual = respuestasMap[pregunta.id_pregunta] !== undefined ? respuestasMap[pregunta.id_pregunta] : -1;
                        htmlClientes += `
                            <div class="pregunta-item" data-id-pregunta="${pregunta.id_pregunta}">
                                <p style="margin:0 0 0.6rem 0; font-size:0.95rem;">${displayNumber}. ${pregunta.texto}</p>
                                <div class="opciones-label">
                                    ${['Siempre','Casi siempre','Algunas veces','Casi nunca','Nunca'].map((opcion, idx) => `
                                        <label style="display:flex; align-items:center; gap:0.3rem; cursor:pointer;">
                                            <input type="radio" name="pregunta_${pregunta.id_pregunta}" value="${4 - idx}" ${valorActual === (4 - idx) ? 'checked' : ''}>
                                            ${opcion}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                        displayNumber++;
                    });
                    return htmlClientes;
                })()}
            </div>
        `;

        // Jefes condicional
        html += `
            <div class="pregunta-item" style="margin-top:1.5rem;">
                <p style="margin:0 0 0.5rem 0; font-weight:bold;">¿Soy jefe de otros trabajadores?</p>
                <div class="opciones-label">
                    <label><input type="radio" name="filtro_jefe" value="1"> Sí</label>
                    <label><input type="radio" name="filtro_jefe" value="0" checked> No</label>
                </div>
            </div>
            <div class="condicional-jefe" style="display:none;">
                <h3 style="margin-top:1rem; margin-bottom:0.5rem; padding-left:0.5rem;">Las preguntas siguientes están relacionadas con las actitudes de las personas que supervisa.</h3>
                ${(() => {
                    let htmlJefes = '';
                    const preguntasJefes = preguntas.filter(p => p.numero >= 69 && p.numero <= 72);
                    preguntasJefes.forEach(pregunta => {
                        const valorActual = respuestasMap[pregunta.id_pregunta] !== undefined ? respuestasMap[pregunta.id_pregunta] : -1;
                        htmlJefes += `
                            <div class="pregunta-item" data-id-pregunta="${pregunta.id_pregunta}">
                                <p style="margin:0 0 0.6rem 0; font-size:0.95rem;">${displayNumber}. ${pregunta.texto}</p>
                                <div class="opciones-label">
                                    ${['Siempre','Casi siempre','Algunas veces','Casi nunca','Nunca'].map((opcion, idx) => `
                                        <label style="display:flex; align-items:center; gap:0.3rem; cursor:pointer;">
                                            <input type="radio" name="pregunta_${pregunta.id_pregunta}" value="${4 - idx}" ${valorActual === (4 - idx) ? 'checked' : ''}>
                                            ${opcion}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                        displayNumber++;
                    });
                    return htmlJefes;
                })()}
            </div>
        `;

        html += `
                    <div class="botones-guia-iii">
                        <button type="button" id="btn-guardar-salir" class="btn-holografico-secundario">Guardar y salir</button>
                        <button type="submit" class="btn-holografico">Finalizar evaluación</button>
                    </div>
                </form>
            </div>
        `;

        formContainer.innerHTML = html;
        formContainer.classList.remove('hidden');
        document.getElementById('back-btn-guia-iii').addEventListener('click', goBack);

        document.querySelectorAll('#form-guia-iii input[type="radio"]').forEach(input => {
            input.addEventListener('change', async (e) => {
                if (e.target.name.startsWith('pregunta_')) {
                    const preguntaId = parseInt(e.target.name.split('_')[1]);
                    const valor = parseInt(e.target.value);
                    await guardarRespuestaIndividual(idEvaluacion, preguntaId, valor);
                }
            });
        });

        document.querySelectorAll('input[name="filtro_clientes"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const mostrar = e.target.value === '1';
                document.querySelectorAll('.condicional-clientes').forEach(el => {
                    el.style.display = mostrar ? 'block' : 'none';
                    if (!mostrar) {
                        el.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
                    }
                });
            });
        });

        document.querySelectorAll('input[name="filtro_jefe"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const mostrar = e.target.value === '1';
                document.querySelectorAll('.condicional-jefe').forEach(el => {
                    el.style.display = mostrar ? 'block' : 'none';
                    if (!mostrar) {
                        el.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
                    }
                });
            });
        });

        document.getElementById('btn-guardar-salir').addEventListener('click', async () => {
            try {
                const resPausa = await fetch(`/api/evaluacion/${idEvaluacion}/pausar`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const dataPausa = await resPausa.json();
                if (!resPausa.ok) throw new Error(dataPausa.error || 'Error al guardar');

                mostrarModalExito(
                    'Evaluación guardada',
                    'La evaluación se guardó correctamente. Podrás continuar más tarde.',
                    goHome,
                    'Aceptar'
                );
            } catch (err) {
                alert('❌ ' + err.message);
            }
        });

        document.getElementById('form-guia-iii').addEventListener('submit', async (e) => {
            e.preventDefault();
        
            const faltantes = [];
        
            // Recorrer todas las preguntas cargadas
            for (const pregunta of preguntas) {
                const num = pregunta.numero;
                const id = pregunta.id_pregunta;
                const contestada = document.querySelector(`input[name="pregunta_${id}"]:checked`);
        
                // Preguntas principales: 1-64 siempre requeridas
                if (num >= 1 && num <= 64) {
                    if (!contestada) faltantes.push(num);
                }
        
                // Preguntas condicionales: 65-68 solo si filtro_clientes = 1
                if (num >= 65 && num <= 68) {
                    const filtroClientes = document.querySelector('input[name="filtro_clientes"]:checked');
                    if (filtroClientes && filtroClientes.value === '1') {
                        if (!contestada) faltantes.push(num);
                    }
                }
        
                // Preguntas condicionales: 69-72 solo si filtro_jefe = 1
                if (num >= 69 && num <= 72) {
                    const filtroJefes = document.querySelector('input[name="filtro_jefe"]:checked');
                    if (filtroJefes && filtroJefes.value === '1') {
                        if (!contestada) faltantes.push(num);
                    }
                }
            }
        
            if (faltantes.length > 0) {
                mostrarModalFaltantes(`Faltan las siguientes preguntas por responder: ${faltantes.join(', ')}`);
                return;
            }
        
            await finalizarEvaluacion(idEvaluacion);
        });

    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function guardarRespuestaIndividual(idEvaluacion, idPregunta, valor) {
    const token = localStorage.getItem('token');
    try {
        await fetch(`/api/evaluacion/${idEvaluacion}/respuesta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ id_pregunta: idPregunta, valor })
        });
    } catch (err) {
        console.error('Error guardando respuesta:', err);
    }
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
        mostrarModalExito('Evaluación finalizada', 'Los resultados estarán disponibles pronto.', goHome, 'Aceptar');
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ---------- CONTINUAR EVALUACIÓN ----------
async function continuarEvaluacion() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/evaluacion/en-curso', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const evaluaciones = await res.json();
        if (!res.ok) throw new Error(evaluaciones.error || 'Error');

        let html = `
            <button type="button" class="back-btn" id="back-btn-continuar">← Atrás</button>
            <div style="color:white; padding:1rem; text-align:center;">
                <h2 class="form-title">Continuar evaluación</h2>
                ${evaluaciones.length === 0 ? '<p>No tienes evaluaciones en curso.</p>' : `
                    <ul style="list-style:none; padding:0;">
                        ${evaluaciones.map(e => `
                            <li style="margin:0.5rem 0;">
                                <button class="btn-continuar" data-id="${e.id_evaluacion}" style="background:rgba(255,255,255,0.2); border:none; padding:0.5rem 1rem; border-radius:20px; color:#fff; cursor:pointer;">Evaluación ${e.id_evaluacion} - ${e.estatus}</button>
                            </li>
                        `).join('')}
                    </ul>
                `}
            </div>
        `;
        formContainer.innerHTML = html;
        document.getElementById('back-btn-continuar').addEventListener('click', goBack);
        formContainer.classList.remove('hidden');
        reportContainer.classList.add('hidden');

        document.querySelectorAll('.btn-continuar').forEach(btn => {
            btn.addEventListener('click', () => {
                cargarGuiaIII(btn.dataset.id);
            });
        });
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ---------- REPORTES ----------
async function mostrarReportes() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/evaluacion/completadas', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const evaluaciones = await res.json();
        if (!res.ok) throw new Error(evaluaciones.error || 'Error al cargar reportes');

        let html = `
            <button type="button" class="back-btn" id="back-btn-reportes">← Atrás</button>
            <div style="color:white; padding:1rem; text-align:center;">
                <h2 class="form-title">Reportes de evaluaciones completadas</h2>
                ${evaluaciones.length === 0 ? '<p>No hay evaluaciones completadas.</p>' : `
                    <div style="max-height:400px; overflow-y:auto;">
                        <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px; overflow:hidden; margin:0 auto; text-align:left;">
                            <tr style="background:rgba(255,255,255,0.2);">
                                <th style="padding:10px 14px;">ID</th>
                                <th style="padding:10px 14px;">Empleado</th>
                                <th style="padding:10px 14px;">Departamento</th>
                                <th style="padding:10px 14px;">Fecha</th>
                                <th style="padding:10px 14px;">Acción</th>
                            </tr>
                            ${evaluaciones.map(e => `
                                <tr>
                                    <td style="padding:10px 14px;">${e.id_evaluacion}</td>
                                    <td style="padding:10px 14px;">${e.nombre}</td>
                                    <td style="padding:10px 14px;">${e.departamento_seccion_area || 'N/A'}</td>
                                    <td style="padding:10px 14px;">${new Date(e.fecha_aplicacion).toLocaleDateString()}</td>
                                    <td style="padding:10px 14px;">
                                        <button class="btn-ver-resultado" data-id="${e.id_evaluacion}" style="background:rgba(255,255,255,0.2); border:none; padding:0.4rem 0.8rem; border-radius:20px; color:#fff; cursor:pointer;">Ver</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                `}
            </div>
        `;
        formContainer.innerHTML = html;
        document.getElementById('back-btn-reportes').addEventListener('click', goBack);
        formContainer.classList.remove('hidden');
        reportContainer.classList.add('hidden');

        document.querySelectorAll('.btn-ver-resultado').forEach(btn => {
            btn.addEventListener('click', async () => {
                await verResultadoEvaluacion(btn.dataset.id);
            });
        });
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function verResultadoEvaluacion(idEvaluacion) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/evaluacion/${idEvaluacion}/resultados`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al obtener resultados');

        let html = `
            <button type="button" class="back-btn" id="back-btn-resultado">← Volver</button>
            <div style="color:white; padding:1rem;">
                <h2 class="form-title">Resultados de Evaluación #${idEvaluacion}</h2>
                ${data.global ? `
                    <div style="background:rgba(255,255,255,0.1); padding:1rem; border-radius:12px; margin-bottom:1rem;">
                        <p><strong>Puntaje global:</strong> ${data.global.puntaje_bruto} / ${data.global.puntaje_maximo} (${data.global.puntaje_porcentaje}%)</p>
                        <p><strong>Nivel de riesgo:</strong> ${data.global.resultado_final}</p>
                    </div>
                    <div class="recomendacion-destacada">
                        <h3>Recomendación</h3>
                        <p>${obtenerRecomendacion(data.global.resultado_final)}</p>
                    </div>
                    <h3>Categorías</h3>
                    <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px; margin-bottom:1rem;">
                        <tr>
                            <th>Categoría</th>
                            <th style="text-align:center;">Puntaje</th>
                            <th style="text-align:center;">Nivel de riesgo</th>
                        </tr>
                        ${data.categorias.map(c => `
                            <tr>
                                <td>${c.categoria_nombre}</td>
                                <td style="text-align:center;">${c.puntaje_bruto}/${c.puntaje_maximo}</td>
                                <td style="text-align:center;">${c.nivel_riesgo}</td>
                            </tr>
                        `).join('')}
                    </table>
                    <h3>Dominios</h3>
                    <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px;">
                        <tr>
                            <th>Dominio</th>
                            <th style="text-align:center;">Puntaje</th>
                            <th style="text-align:center;">Nivel de riesgo</th>
                        </tr>
                        ${data.dominios.map(d => `
                            <tr>
                                <td>${d.dominio_nombre}</td>
                                <td style="text-align:center;">${d.puntaje_bruto}/${d.puntaje_maximo}</td>
                                <td style="text-align:center;">${d.nivel_riesgo}</td>
                            </tr>
                        `).join('')}
                    </table>
                ` : '<p>No hay resultados disponibles.</p>'}
            </div>
        `;
        formContainer.innerHTML = html;
        document.getElementById('back-btn-resultado').addEventListener('click', mostrarReportes);
        formContainer.classList.remove('hidden');
        reportContainer.classList.add('hidden');
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ---------- RECOMENDACIONES SEGÚN NIVEL ----------
function obtenerRecomendacion(nivel) {
    switch (nivel) {
        case 'Nulo':
            return 'El riesgo resulta despreciable por lo que no se requieren medidas adicionales.';
        case 'Bajo':
            return 'Es necesaria una mayor difusión de la política de prevención de riesgos psicosociales y programas para: la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral.';
        case 'Medio':
            return 'Se requiere revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión, mediante un Programa de intervención.';
        case 'Alto':
            return 'Se requiere realizar un análisis de cada categoría y dominio, de manera que se puedan determinar las acciones de intervención apropiadas a través de un Programa de intervención, que podrá incluir una evaluación específica y deberá incluir una campaña de sensibilización, revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión.';
        case 'Muy Alto':
            return 'Se requiere realizar el análisis de cada categoría y dominio para establecer las acciones de intervención apropiadas, mediante un Programa de intervención que deberá incluir evaluaciones específicas, y contemplar campañas de sensibilización, revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión.';
        default:
            return '';
    }
}

// ============================================================
// GRÁFICAS Y ESTADÍSTICAS
// ============================================================
async function mostrarGraficas() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/evaluacion/graficas/datos', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar datos');

        // Mapeo de colores por nivel (usado en gráfica y tablas)
        const colorPorNivel = {
            'Muy Alto': 'rgba(255, 0, 0, 0.8)',   // rojo
            'Alto': 'rgba(255, 165, 0, 0.8)',    // naranja
            'Medio': 'rgba(255, 255, 0, 0.7)',   // amarillo
            'Bajo': 'rgba(0, 128, 0, 0.8)',      // verde
            'Nulo': 'rgba(135, 206, 235, 0.8)'   // azul cielo
        };

        let html = `
            <button type="button" class="back-btn" id="back-btn-graficas">← Atrás</button>
            <div style="color:white; padding:1rem;">
                <h2 class="form-title" style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                    <span class="icono-reportes"></span>
                    Gráficas y Estadísticas
                </h2>

                <!-- Gráfica de pastel -->
                <div style="background:rgba(255,255,255,0.1); padding:1rem; border-radius:12px; margin-bottom:1.5rem;">
                    <h3 style="text-align:center; margin-bottom:1rem;">Distribución de Niveles de Riesgo Global</h3>
                    <canvas id="grafica-niveles" style="max-height:300px; width:100%;"></canvas>
                </div>

                <!-- Top 10 Categorías -->
                <h3>Top 10 Categorías por Riesgo Promedio</h3>
                <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px; margin-bottom:1.5rem;">
                    <tr><th style="color:#fff;">#</th><th style="color:#fff;">Categoría</th><th style="color:#fff; text-align:center;">Promedio (%)</th></tr>
                    ${data.topCategorias.map((c, i) => `
                        <tr>
                            <td style="text-align:center;">${i+1}</td>
                            <td>${c.nombre}</td>
                            <td style="text-align:center;">${c.promedio.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </table>

                <!-- Top 10 Dominios -->
                <h3>Top 10 Dominios por Riesgo Promedio</h3>
                <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px; margin-bottom:1.5rem;">
                    <tr><th style="color:#fff;">#</th><th style="color:#fff;">Dominio</th><th style="color:#fff; text-align:center;">Promedio (%)</th></tr>
                    ${data.topDominios.map((d, i) => `
                        <tr>
                            <td style="text-align:center;">${i+1}</td>
                            <td>${d.nombre}</td>
                            <td style="text-align:center;">${d.promedio.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </table>

                <!-- Reportes por riesgo -->
                <h3>Reportes Recientes (Ordenados por Riesgo)</h3>
                <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px; margin-bottom:1.5rem;">
                    <tr><th style="color:#fff;">ID</th><th style="color:#fff;">Empleado</th><th style="color:#fff; text-align:center;">Puntaje</th><th style="color:#fff; text-align:center;">Riesgo</th></tr>
                    ${data.reportes.map(r => `
                        <tr style="background-color: ${colorPorNivel[r.resultado_final] || 'transparent'};">
                            <td>${r.id_evaluacion}</td>
                            <td>${r.nombre}</td>
                            <td style="text-align:center;">${r.puntaje_bruto}</td>
                            <td style="text-align:center;">${r.resultado_final}</td>
                        </tr>
                    `).join('')}
                </table>

                <!-- Canalizaciones -->
                <h3>Canalizaciones Recientes</h3>
                <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px;">
                    <tr><th style="color:#fff;">ID</th><th style="color:#fff;">Empleado</th><th style="color:#fff;">Fecha</th></tr>
                    ${data.canalizaciones.map(c => `
                        <tr style="background-color: rgba(255, 0, 0, 0.25);">
                            <td>${c.id_evaluacion}</td>
                            <td>${c.nombre}</td>
                            <td>${new Date(c.fecha_aplicacion).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;

        formContainer.innerHTML = html;
        formContainer.classList.remove('hidden');
        reportContainer.classList.add('hidden');
        document.getElementById('back-btn-graficas').addEventListener('click', goBack);

        // Dibujar gráfica de pastel
        if (data.nivelesGlobal.length > 0) {
            // Ordenar los niveles para consistencia visual
            const orden = ['Nulo', 'Bajo', 'Medio', 'Alto', 'Muy Alto'];
            const nivelesOrdenados = data.nivelesGlobal
                .slice()
                .sort((a, b) => orden.indexOf(a.resultado_final) - orden.indexOf(b.resultado_final));

            const labels = nivelesOrdenados.map(n => n.resultado_final);
            const valores = nivelesOrdenados.map(n => n.total);
            const colores = labels.map(label => {
                // Convertir rgba a color sólido para la gráfica (opcional)
                const color = colorPorNivel[label];
                return color ? color.replace('0.25', '1') : '#CCCCCC';
            });

            const ctx = document.getElementById('grafica-niveles').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels,
                    datasets: [{
                        data: valores,
                        backgroundColor: colores
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('grafica-niveles').parentElement.innerHTML =
                '<p style="text-align:center;">No hay evaluaciones completadas aún.</p>';
        }

    } catch (err) {
        alert('❌ ' + err.message);
    }
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
    document.querySelector('.card[data-type="canalizacion"] .card-icon').style.webkitMaskImage =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E\")";
    document.querySelector('.card[data-type="graficas"] .card-icon').style.webkitMaskImage =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E\")";
});