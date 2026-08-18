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

    if (isAdmin || isEmpleado) {
        if (nuevaCard) nuevaCard.style.display = 'flex';
        if (continuarCard) continuarCard.style.display = 'flex';
    } else {
        if (nuevaCard) nuevaCard.style.display = 'none';
        if (continuarCard) continuarCard.style.display = 'none';
    }

    if (isAdmin || isSupervisor) {
        if (reportCard) reportCard.style.display = 'flex';
    } else {
        if (reportCard) reportCard.style.display = 'none';
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
    if (type === 'reportes' || type === 'canalizacion') {
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
                                <button class="btn-accion editar-usuario" title="Actualizar" data-id="${u.id_usuario}" data-nombre="${u.nombre}" data-email="${u.email}" data-rol="${u.id_rol}" data-departamento="${u.departamento || ''}">
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

                    <label>Departamento</label>
                    <input type="text" id="departamento-usuario" class="campo-gestion" placeholder="Ej. Sistemas, RH, Operaciones">

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
        const departamento = document.getElementById('departamento-usuario').value.trim();
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
                body: JSON.stringify({ nombre, email, password, departamento, id_rol })
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
            document.getElementById('nombre-usuario').value = '';
            document.getElementById('email-usuario').value = '';
            document.getElementById('password-usuario').value = '';
            document.getElementById('departamento-usuario').value = '';
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
            const departamento = btn.dataset.departamento || '';
            mostrarFormularioEdicion(id, nombre, email, rol, departamento);
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

function mostrarFormularioEdicion(id, nombre, email, rol, departamento) {
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

                <label>Departamento</label>
                <input type="text" id="edit-departamento" value="${departamento || ''}">

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
        const departamento = document.getElementById('edit-departamento').value.trim();
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
                body: JSON.stringify({ nombre, email, password, departamento, id_rol })
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
                            <th style="padding:10px 14px;">Acciones</th>
                        </tr>
                        ${data.map(u => `
                            <tr style="background: rgba(255,0,0,0.3) !important; border-bottom: 1px solid rgba(255,0,0,0.2);">
                                <td style="padding:10px 14px;">${u.id_usuario}</td>
                                <td style="padding:10px 14px;">${u.empleado_nombre}</td>
                                <td style="padding:10px 14px;">${u.departamento_seccion_area || 'N/A'}</td>
                                <td style="padding:10px 14px;">${new Date(u.fecha_aplicacion).toLocaleDateString()}</td>
                                <td style="padding:10px 14px; white-space:nowrap;">
                                    <button class="btn-accion eliminar-canalizacion" title="Eliminar canalización" data-id="${u.id_evaluacion}" data-nombre="${u.empleado_nombre}">
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

        // Agrupar por categoría, dominio, dimensión
        const categorias = {};
        preguntas.forEach(p => {
            if (!categorias[p.id_categoria]) {
                categorias[p.id_categoria] = { nombre: p.categoria_nombre, dominios: {} };
            }
            if (!categorias[p.id_categoria].dominios[p.id_dominio]) {
                categorias[p.id_categoria].dominios[p.id_dominio] = { nombre: p.dominio_nombre, dimensiones: {} };
            }
            if (!categorias[p.id_categoria].dominios[p.id_dominio].dimensiones[p.id_dimension]) {
                categorias[p.id_categoria].dominios[p.id_dominio].dimensiones[p.id_dimension] = { nombre: p.dimension_nombre, preguntas: [] };
            }
            categorias[p.id_categoria].dominios[p.id_dominio].dimensiones[p.id_dimension].preguntas.push(p);
        });

        let html = `
            <button type="button" class="back-btn" id="back-btn-guia-iii">← Atrás</button>
            <div style="color:white; padding:1rem; max-height:80vh; overflow-y:auto;" class="scroll-guia-i">
                <h2 class="form-title">Guía de Referencia III</h2>
                <p style="margin-bottom:1rem;">Seleccione una opción para cada pregunta. Las preguntas condicionales aparecerán según sus respuestas.</p>
                <form id="form-guia-iii">
        `;

        // Preguntas de control (filtros)
        html += `
            <div style="margin:1rem 0; padding:1rem; background:rgba(255,255,255,0.05); border-radius:8px;">
                <p style="margin:0 0 0.5rem 0; font-weight:bold;">¿En su trabajo debe brindar servicio a clientes o usuarios?</p>
                <label><input type="radio" name="filtro_clientes" value="1" onchange="toggleCondicional('clientes', true)"> Sí</label>
                <label><input type="radio" name="filtro_clientes" value="0" onchange="toggleCondicional('clientes', false)" checked> No</label>
            </div>
            <div style="margin:1rem 0; padding:1rem; background:rgba(255,255,255,0.05); border-radius:8px;">
                <p style="margin:0 0 0.5rem 0; font-weight:bold;">¿Es usted jefe de otros trabajadores?</p>
                <label><input type="radio" name="filtro_jefe" value="1" onchange="toggleCondicional('jefe', true)"> Sí</label>
                <label><input type="radio" name="filtro_jefe" value="0" onchange="toggleCondicional('jefe', false)" checked> No</label>
            </div>
        `;

        // Renderizar categorías
        for (const [idCat, cat] of Object.entries(categorias)) {
            html += `<h3 style="margin-top:1.5rem;">${cat.nombre}</h3>`;
            for (const [idDom, dom] of Object.entries(cat.dominios)) {
                html += `<h4>${dom.nombre}</h4>`;
                for (const [idDim, dim] of Object.entries(dom.dimensiones)) {
                    html += `<h5>${dim.nombre}</h5>`;
                    for (const pregunta of dim.preguntas) {
                        let condicional = '';
                        if (pregunta.numero >= 65 && pregunta.numero <= 68) condicional = 'condicional-clientes';
                        else if (pregunta.numero >= 69 && pregunta.numero <= 72) condicional = 'condicional-jefe';

                        const valorActual = respuestasMap[pregunta.id_pregunta] !== undefined ? respuestasMap[pregunta.id_pregunta] : -1;
                        html += `
                            <div class="pregunta-item ${condicional}" data-id-pregunta="${pregunta.id_pregunta}" style="margin-bottom:0.8rem; padding:0.5rem; background:rgba(255,255,255,0.05); border-radius:8px; ${condicional ? 'display:none;' : ''}">
                                <p style="margin:0 0 0.3rem 0; font-size:0.95rem;">${pregunta.numero}. ${pregunta.texto}</p>
                                <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                                    ${['Siempre','Casi siempre','Algunas veces','Casi nunca','Nunca'].map((opcion, idx) => `
                                        <label style="display:flex; align-items:center; gap:0.3rem; cursor:pointer;">
                                            <input type="radio" name="pregunta_${pregunta.id_pregunta}" value="${idx}" ${valorActual === idx ? 'checked' : ''}>
                                            ${opcion}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                }
            }
        }

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

        // Guardado automático al cambiar respuesta
        document.querySelectorAll('#form-guia-iii input[type="radio"]').forEach(input => {
            input.addEventListener('change', async (e) => {
                if (e.target.name.startsWith('pregunta_')) {
                    const preguntaId = parseInt(e.target.name.split('_')[1]);
                    const valor = parseInt(e.target.value);
                    await guardarRespuestaIndividual(idEvaluacion, preguntaId, valor);
                }
            });
        });

        // Botón guardar y salir
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

        // Submit final
        document.getElementById('form-guia-iii').addEventListener('submit', async (e) => {
            e.preventDefault();
            await finalizarEvaluacion(idEvaluacion);
        });

        // Inicializar visibilidad de condicionales
        window.toggleCondicional = (tipo, visible) => {
            const selector = tipo === 'clientes' ? '.condicional-clientes' : '.condicional-jefe';
            document.querySelectorAll(selector).forEach(el => {
                el.style.display = visible ? 'block' : 'none';
                if (!visible) {
                    el.querySelectorAll('input[type="radio"]').forEach(radio => {
                        radio.checked = false;
                    });
                }
            });
        };

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
                    <h3>Categorías</h3>
                    <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px; margin-bottom:1rem;">
                        <tr><th>Categoría</th><th>Puntaje</th><th>Nivel</th></tr>
                        ${data.categorias.map(c => `
                            <tr><td>${c.id_categoria}</td><td>${c.puntaje_bruto}/${c.puntaje_maximo}</td><td>${c.nivel_riesgo}</td></tr>
                        `).join('')}
                    </table>
                    <h3>Dominios</h3>
                    <table style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1); border-radius:12px;">
                        <tr><th>Dominio</th><th>Puntaje</th><th>Nivel</th></tr>
                        ${data.dominios.map(d => `
                            <tr><td>${d.id_dominio}</td><td>${d.puntaje_bruto}/${d.puntaje_maximo}</td><td>${d.nivel_riesgo}</td></tr>
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
});