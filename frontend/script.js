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

    const reportCard = document.querySelector('.card[data-type="reportes"]');
    const usuariosCard = document.querySelector('.card[data-type="usuarios"]');

    if (isAdmin) {
        reportCard.style.display = 'flex';
        usuariosCard.style.display = 'flex';
    } else {
        reportCard.style.display = 'none';
        usuariosCard.style.display = 'none';
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
        mostrarMensaje('Iniciar nueva evaluación', 'Pronto podrás comenzar la encuesta NOM-035.', 'nueva');
    } else if (type === 'continuar') {
        mostrarMensaje('Continuar evaluación', 'Aquí aparecerán las evaluaciones guardadas.', 'continuar');
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
            <h2 class="form-title">
                ${iconClass ? `<span class="${iconClass}"></span>` : ''}
                ${titulo}
            </h2>
            <p>${mensaje}</p>
            <p style="margin-top:1rem; font-size:0.8rem; opacity:0.7;">✅ Backend funcionando correctamente</p>
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
            <h2>${titulo}</h2>
            <p>${mensaje}</p>
            <p style="margin-top:1rem; font-size:0.8rem; opacity:0.7;">🔒 Acceso restringido</p>
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

                    <button type="submit" class="campo-gestion" style="margin-top:1rem;">Crear usuario</button>
                    <button type="button" id="cancelar-creacion" style="background:transparent; border:1px solid rgba(255,255,255,0.3); border-radius:30px; color:#fff; padding:8px; margin-top:0.5rem; cursor:pointer;">Cancelar</button>
                </form>
                <div id="mensaje-creacion" style="margin-top:0.5rem; text-align:center;"></div>
            </div>
        </div>
    `;

    reportContainer.innerHTML = html;
    reportContainer.classList.remove('hidden');
    formContainer.classList.add('hidden');
    document.getElementById('back-btn-usuarios').addEventListener('click', goBack);

    // ---- EVENTO: CLICK EN TARJETA "CREAR USUARIO" ----
    document.getElementById('crear-usuario-card').addEventListener('click', () => {
        mostrarFormularioCreacion();
    });

    // ---- EVENTO: CANCELAR CREACIÓN ----
    document.getElementById('cancelar-creacion')?.addEventListener('click', () => {
        ocultarFormularioCreacion();
    });

    // ---- EVENTO: ENVÍO DEL FORMULARIO DE CREACIÓN ----
    document.getElementById('form-crear-usuario')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombre-usuario').value.trim();
        const email = document.getElementById('email-usuario').value.trim();
        const password = document.getElementById('password-usuario').value.trim();
        const id_rol = parseInt(document.getElementById('rol-usuario').value);

        const mensajeDiv = document.getElementById('mensaje-creacion');
        mensajeDiv.innerHTML = '<p style="color:white;">⏳ Creando usuario...</p>';

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
                mensajeDiv.innerHTML = `<p style="color:#FFA500;">❌ ${data.error || 'Error al crear usuario'}</p>`;
                return;
            }

            mensajeDiv.innerHTML = `<p style="color:#90EE90;">✅ Usuario creado exitosamente: ${data.nombre} (${data.email})</p>`;
            document.getElementById('nombre-usuario').value = '';
            document.getElementById('email-usuario').value = '';
            document.getElementById('password-usuario').value = '';
            ocultarFormularioCreacion();
            mostrarGestionUsuarios();
        } catch (err) {
            mensajeDiv.innerHTML = `<p style="color:#FF6B6B;">❌ Error de conexión: ${err.message}</p>`;
        }
    });

    // ---- EVENTOS: EDICIÓN Y ELIMINACIÓN ----
    document.querySelectorAll('.editar-usuario').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const nombre = btn.dataset.nombre;
            const email = btn.dataset.email;
            const rol = btn.dataset.rol;
            mostrarFormularioEdicion(id, nombre, email, rol);
        });
    });

    // ---- EVENTO: RESTABLECER CONTRASEÑA (GENERAR Y MOSTRAR) ----
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
        alert('✅ Usuario eliminado');
        mostrarGestionUsuarios();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ---------- RESTABLECER CONTRASEÑA (generar aleatoria y mostrar) ----------
async function resetPassword(id) {
    const token = localStorage.getItem('token');

    try {
        // Solicitar nueva contraseña al backend
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

        // Mostrar modal con la nueva contraseña
        mostrarModalContraseña(data.nueva_contraseña);
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

function mostrarModalContraseña(contraseña) {
    // Eliminar modal anterior si existe
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
            // Fallback: seleccionar y copiar manualmente
            const range = document.createRange();
            const texto = modal.querySelector('p[style*="font-size: 1.8rem"]');
            range.selectNode(texto);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            alert('✅ Contraseña copiada al portapapeles');
        });
    });

    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ---------- FORMULARIO DE EDICIÓN (ACTUALIZA TODOS LOS CAMPOS) ----------
function mostrarFormularioEdicion(id, nombre, email, rol) {
    const token = localStorage.getItem('token');
    reportContainer.innerHTML = `
        <button type="button" class="back-btn" id="back-btn-editar">← Atrás</button>
        <div style="color:white; padding:1rem;">
            <h2 class="form-title">✏️ Editar usuario</h2>
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
        mensajeDiv.innerHTML = '<p style="color:white;"> actualizando usuario...</p>';

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

            mensajeDiv.innerHTML = `<p style="color:#90EE90;"> usuario actualizado correctamente.</p>`;
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