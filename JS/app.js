/* ================================================
TECNO NOVA - Validaciones e interacciones JS
   GA6-220501096-AA3 | SENA ADSO Ficha 3235887
   ================================================ */

'use strict';

/* =============================================
   1. NAVEGACIÓN ENTRE PANTALLAS
   ============================================= */

/**
 * Muestra una pantalla y oculta todas las demás.
 * @param {string} id - ID de la pantalla a mostrar (sin el prefijo #)
 */
function mostrarPantalla(id) {
  // Ocultar todas las pantallas
  document.querySelectorAll('.pantalla').forEach(p => {
    p.classList.remove('activa');
  });

  // Mostrar la seleccionada
  const pantalla = document.getElementById(id);
  if (pantalla) {
    pantalla.classList.add('activa');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Actualizar barra de navegación inferior
  actualizarNavInferior(id);

  // Si se navega al perfil, refrescar sus datos con lo guardado en localStorage
  if (id === 'pantalla-perfil') {
    renderPerfil();
  }
}

/**
 * Marca el ítem activo en la barra de navegación inferior.
 * @param {string} pantallaId
 */
function actualizarNavInferior(pantallaId) {
  const mapa = {
    'pantalla-catalogo': 'nav-inicio',
    'pantalla-detalle':  'nav-inicio',
    'pantalla-carrito':  'nav-carrito',
    'pantalla-perfil':   'nav-perfil',
  };

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('activo');
  });

  const navId = mapa[pantallaId];
  if (navId) {
    const navItem = document.getElementById(navId);
    if (navItem) navItem.classList.add('activo');
  }
}


/* =============================================
   2. VALIDACIONES DE FORMULARIOS
   ============================================= */

/**
 * Muestra un mensaje de error bajo un campo.
 * @param {string} campoId - ID del input
 * @param {string} msg     - Mensaje de error
 */
function mostrarError(campoId, msg) {
  const input = document.getElementById(campoId);
  const errorEl = document.getElementById(campoId + '-error');
  if (input)   input.classList.add('error');
  if (errorEl) { errorEl.textContent = msg; errorEl.classList.add('visible'); }
}

/**
 * Limpia el error de un campo.
 * @param {string} campoId
 */
function limpiarError(campoId) {
  const input = document.getElementById(campoId);
  const errorEl = document.getElementById(campoId + '-error');
  if (input)   input.classList.remove('error');
  if (errorEl) errorEl.classList.remove('visible');
}

/** Valida que un correo electrónico tenga formato correcto. */
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/** Valida que una contraseña tenga al menos 6 caracteres. */
function validarContrasena(pass) {
  return pass.trim().length >= 6;
}

/** Valida que un campo de texto no esté vacío. */
function validarNoVacio(valor) {
  return valor.trim().length > 0;
}

/** Valida que la cédula solo tenga números y al menos 6 dígitos. */
function validarCedula(cedula) {
  const regex = /^\d{6,12}$/;
  return regex.test(cedula.trim());
}

/** Valida una fecha en formato dd/mm/aaaa. */
function validarFecha(fecha) {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(fecha)) return false;
  const [dia, mes, anio] = fecha.split('/').map(Number);
  const hoy = new Date();
  const fechaObj = new Date(anio, mes - 1, dia);
  return fechaObj <= hoy && anio > 1900 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31;
}


/* =============================================
   3. USUARIOS Y SESIÓN (CRUD en localStorage)
   ============================================= */

const USUARIOS_STORAGE_KEY = 'tecnonova_usuarios';
const SESION_STORAGE_KEY   = 'tecnonova_sesion';

/** Cuenta de prueba precargada, para que el profesor pueda entrar sin registrarse. */
const USUARIO_DEMO = {
  nombres: 'Jessica',
  apellidos: 'Recalde Portilla',
  cedula: '1114563456',
  fecha: '15/03/2001',
  correo: 'jessica@correo.com',
  contrasena: '123456',
  avatar: null
};

/** (READ) Lee todos los usuarios registrados desde localStorage. */
function leerUsuarios() {
  try {
    const datos = localStorage.getItem(USUARIOS_STORAGE_KEY);
    return datos ? JSON.parse(datos) : [];
  } catch {
    return [];
  }
}

/** (UPDATE/CREATE) Guarda el arreglo completo de usuarios en localStorage. */
function guardarUsuarios(usuarios) {
  localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(usuarios));
}

/** Busca un usuario registrado (o el demo) por su correo. */
function buscarUsuarioPorCorreo(correo) {
  correo = correo.trim().toLowerCase();
  if (correo === USUARIO_DEMO.correo.toLowerCase()) return USUARIO_DEMO;
  return leerUsuarios().find(u => u.correo.toLowerCase() === correo) || null;
}

/** Guarda el correo de la sesión activa. */
function iniciarSesion(correo) {
  localStorage.setItem(SESION_STORAGE_KEY, correo.trim().toLowerCase());
}

/** Cierra la sesión activa. */
function cerrarSesion() {
  localStorage.removeItem('tecnoNovaToken');
  localStorage.removeItem('tecnoNovaCliente');
  carrito = [];
  actualizarContadorCarrito();
  mostrarPantalla('pantalla-login');
  mostrarToast('Sesión cerrada. ¡Hasta pronto! 👋');
}

/** Devuelve el objeto del usuario que tiene la sesión abierta (o null). */
function obtenerUsuarioActual() {
  const correo = localStorage.getItem(SESION_STORAGE_KEY);
  if (!correo) return null;
  return buscarUsuarioPorCorreo(correo);
}

/**
 * Maneja el envío del formulario de inicio de sesión.
 */
async function manejarLogin() {
  const email     = document.getElementById('login-email').value;
  const contrasena = document.getElementById('login-pass').value;
  let valido = true;

  limpiarError('login-email');
  limpiarError('login-pass');

  if (!validarNoVacio(email)) {
    mostrarError('login-email', 'El correo electrónico es obligatorio.');
    valido = false;
  } else if (!validarEmail(email)) {
    mostrarError('login-email', 'Escribe un correo electrónico válido (ej: nombre@correo.com).');
    valido = false;
  }

  if (!validarNoVacio(contrasena)) {
    mostrarError('login-pass', 'La contraseña es obligatoria.');
    valido = false;
  } else if (!validarContrasena(contrasena)) {
    mostrarError('login-pass', 'La contraseña debe tener al menos 6 caracteres.');
    valido = false;
  }

  if (!valido) return;

  const btn = document.getElementById('btn-login');
  btn.innerHTML = '<span class="spinner"></span> Verificando...';
  btn.disabled = true;

  try {
    const respuesta = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, contrasena: contrasena }),
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {
      localStorage.setItem('tecnoNovaToken', resultado.data.token);
      localStorage.setItem('tecnoNovaCliente', JSON.stringify(resultado.data.cliente));

      mostrarPantalla('pantalla-catalogo');
      mostrarToast(`¡Bienvenida, ${resultado.data.cliente.nombre}! 🎉`);
      document.getElementById('login-email').value = '';
      document.getElementById('login-pass').value  = '';
    } else {
      mostrarPantalla('pantalla-error-auth');
    }
  } catch (error) {
    mostrarToast('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
  } finally {
    btn.innerHTML = 'Iniciar sesión';
    btn.disabled = false;
  }
}

async function renderPerfil() {
  const clienteLocal = JSON.parse(localStorage.getItem('tecnoNovaCliente') || '{}');

  // Rellenar datos básicos del encabezado (usando lo que ya está en localStorage)
  document.getElementById('perfil-nombre-completo').textContent = clienteLocal.nombre || 'Sin nombre';
  document.getElementById('perfil-correo-texto').textContent = clienteLocal.correo || '';

  const contenedorHistorial = document.getElementById('lista-historial');
  contenedorHistorial.innerHTML = '<p style="text-align:center; color:var(--color-texto-secundario); font-size:13px;">Cargando historial...</p>';

  try {
    const token = localStorage.getItem('tecnoNovaToken');
    const id_cliente = clienteLocal.id_cliente;

    const respuesta = await fetch(`http://localhost:3000/api/pedidos/cliente/${id_cliente}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const pedidos = await respuesta.json();

    if (!respuesta.ok) {
      contenedorHistorial.innerHTML = '<p style="text-align:center; color:var(--color-error); font-size:13px;">No se pudo cargar el historial.</p>';
      return;
    }

    if (pedidos.length === 0) {
      contenedorHistorial.innerHTML = '<p style="text-align:center; color:var(--color-texto-secundario); font-size:13px;">Todavía no tienes compras registradas.</p>';
      return;
    }

    contenedorHistorial.innerHTML = pedidos.map((pedido) => {
      const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      const itemsHtml = pedido.detalle.map((item) => `
        <div style="display:flex; justify-content:space-between; font-size:13px; padding:4px 0;">
          <span>${item.nombre_producto} × ${item.cantidad}</span>
          <span>$${Number(item.subtotal).toLocaleString('es-CO')}</span>
        </div>
      `).join('');

      return `
        <div style="border:1px solid var(--color-borde, #e0e0e0); border-radius:var(--radio-md); padding:12px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:6px;">
            <span>Pedido #${pedido.id_pedido}</span>
            <span style="text-transform:capitalize;">${pedido.estado}</span>
          </div>
          <div style="font-size:12px; color:var(--color-texto-secundario); margin-bottom:8px;">${fecha}</div>
          ${itemsHtml}
          <div style="display:flex; justify-content:space-between; font-weight:bold; margin-top:8px; border-top:1px dashed #ccc; padding-top:6px;">
            <span>Total</span>
            <span>$${Number(pedido.total).toLocaleString('es-CO')}</span>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    contenedorHistorial.innerHTML = '<p style="text-align:center; color:var(--color-error); font-size:13px;">Error de conexión con el servidor.</p>';
  }
    cargarSelectProductosServicio();
  renderizarMisSolicitudes();
}


/* =============================================
   4. FORMULARIO DE REGISTRO
   ============================================= */

/**
 * Maneja el envío del formulario de registro de datos personales.
 */
async function manejarRegistro() {
  const nombres    = document.getElementById('reg-nombres').value;
  const apellidos  = document.getElementById('reg-apellidos').value;
  const cedula     = document.getElementById('reg-cedula').value;
  const fecha      = document.getElementById('reg-fecha').value;
  const correo     = document.getElementById('reg-correo').value;
  const contrasena = document.getElementById('reg-contrasena').value;
  const confirmar  = document.getElementById('reg-confirmar').value;
  let valido = true;

  ['reg-nombres','reg-apellidos','reg-cedula','reg-fecha','reg-correo','reg-contrasena','reg-confirmar']
    .forEach(limpiarError);

  if (!validarNoVacio(nombres)) {
    mostrarError('reg-nombres', 'Los nombres son obligatorios.');
    valido = false;
  } else if (nombres.trim().length < 2) {
    mostrarError('reg-nombres', 'El nombre debe tener al menos 2 caracteres.');
    valido = false;
  }

  if (!validarNoVacio(apellidos)) {
    mostrarError('reg-apellidos', 'Los apellidos son obligatorios.');
    valido = false;
  } else if (apellidos.trim().length < 2) {
    mostrarError('reg-apellidos', 'Los apellidos deben tener al menos 2 caracteres.');
    valido = false;
  }

  if (!validarNoVacio(cedula)) {
    mostrarError('reg-cedula', 'El número de cédula es obligatorio.');
    valido = false;
  } else if (!validarCedula(cedula)) {
    mostrarError('reg-cedula', 'Ingresa un número de cédula válido (solo dígitos, mínimo 6).');
    valido = false;
  }

  if (!validarNoVacio(fecha)) {
    mostrarError('reg-fecha', 'La fecha de nacimiento es obligatoria.');
    valido = false;
  } else if (!validarFecha(fecha)) {
    mostrarError('reg-fecha', 'Usa el formato dd/mm/aaaa y asegúrate de que sea una fecha real.');
    valido = false;
  }

  if (!validarNoVacio(correo)) {
    mostrarError('reg-correo', 'El correo electrónico es obligatorio.');
    valido = false;
  } else if (!validarEmail(correo)) {
    mostrarError('reg-correo', 'Escribe un correo electrónico válido.');
    valido = false;
  }

  if (!validarNoVacio(contrasena)) {
    mostrarError('reg-contrasena', 'La contraseña es obligatoria.');
    valido = false;
  } else if (!validarContrasena(contrasena)) {
    mostrarError('reg-contrasena', 'La contraseña debe tener al menos 6 caracteres.');
    valido = false;
  }

  if (!validarNoVacio(confirmar)) {
    mostrarError('reg-confirmar', 'Debes confirmar tu contraseña.');
    valido = false;
  } else if (confirmar !== contrasena) {
    mostrarError('reg-confirmar', 'Las contraseñas no coinciden.');
    valido = false;
  }

  if (!valido) return;

  const btn = document.getElementById('btn-guardar-registro');
  btn.innerHTML = '<span class="spinner"></span> Guardando...';
  btn.disabled = true;

  const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`;
  const correoLimpio   = correo.trim().toLowerCase();
  const usuarioGenerado = correoLimpio.split('@')[0];

  try {
    const respuesta = await fetch('http://localhost:3000/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: usuarioGenerado,
        contrasena: contrasena,
        nombre: nombreCompleto,
        correo: correoLimpio,
      }),
    });
    const resultado = await respuesta.json();

    if (respuesta.ok) {
      mostrarToast('¡Cuenta creada correctamente! Ahora inicia sesión ✅');
      mostrarPantalla('pantalla-login');
      document.getElementById('login-email').value = correoLimpio;
      document.getElementById('form-registro').reset();
    } else {
      mostrarError('reg-correo', resultado.message || 'No se pudo crear la cuenta.');
    }
  } catch (error) {
    mostrarToast('No se pudo conectar con el servidor.');
  } finally {
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
  }
}

/**
 * Formatea la fecha automáticamente mientras el usuario escribe (dd/mm/aaaa).
 * @param {HTMLInputElement} input
 */
function formatearFecha(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length > 2) val = val.slice(0,2) + '/' + val.slice(2);
  if (val.length > 5) val = val.slice(0,5) + '/' + val.slice(5,9);
  input.value = val;
}


/* =============================================
   5. CATÁLOGO DE PRODUCTOS
   ============================================= */

/** Datos de productos (simulados según los mockups del PDF) */
let PRODUCTOS = [

  /* ── PORTÁTILES ─────────────────────────────── */
  {
    id: 1,
    nombre: 'Portátil UltraBook 14"',
    specs: '8GB RAM · 256GB SSD',
    precio: 2450000,
    emoji: '💻',
    categoria: 'portatiles',
    estrellas: 4,
    disponible: 12,
    complementario: 7,           // Mouse inalámbrico
    especificaciones: [
      'Procesador Intel Core i5 12va Gen',
      '8GB RAM DDR4 · 256GB SSD NVMe',
      'Pantalla 14" Full HD IPS antirreflejo',
      'Batería hasta 10 horas de uso',
      'Sistema operativo Windows 11 Home'
    ]
  },
  {
    id: 2,
    nombre: 'Portátil ProBook 15.6"',
    specs: '16GB RAM · 512GB SSD',
    precio: 3890000,
    emoji: '💻',
    categoria: 'portatiles',
    estrellas: 5,
    disponible: 7,
    complementario: 7,
    especificaciones: [
      'Procesador Intel Core i7 13va Gen',
      '16GB RAM DDR5 · 512GB SSD NVMe',
      'Pantalla 15.6" Full HD IPS 144Hz',
      'Tarjeta gráfica NVIDIA RTX 3050',
      'Batería hasta 8 horas · USB-C carga rápida'
    ]
  },
  {
    id: 3,
    nombre: 'Portátil SlimBook Air 13"',
    specs: '8GB RAM · 256GB SSD · 1.2 kg',
    precio: 1980000,
    emoji: '💻',
    categoria: 'portatiles',
    estrellas: 4,
    disponible: 15,
    complementario: 7,
    especificaciones: [
      'Procesador AMD Ryzen 5 7000 Series',
      '8GB RAM LPDDR5 · 256GB SSD M.2',
      'Pantalla 13.3" Full HD IPS',
      'Ultra delgado 1.2 kg · chasis aluminio',
      'Batería hasta 12 horas · Wi-Fi 6'
    ]
  },

  /* ── CELULARES ───────────────────────────────── */
  {
    id: 4,
    nombre: 'Smartphone Nova X20',
    specs: '128GB · Cámara 50MP',
    precio: 1180000,
    emoji: '📱',
    categoria: 'celulares',
    estrellas: 5,
    disponible: 8,
    complementario: 6,           // Audífonos BassPro
    especificaciones: [
      'Pantalla AMOLED 6.5" · 120Hz',
      'Procesador Snapdragon 695 · 6GB RAM',
      'Almacenamiento 128GB UFS 2.2',
      'Cámara principal 50MP + 8MP ultra gran angular',
      'Batería 5000mAh con carga rápida 33W'
    ]
  },
  {
    id: 5,
    nombre: 'Smartphone ProMax Z50',
    specs: '256GB · Pantalla 6.7" AMOLED',
    precio: 2100000,
    emoji: '📱',
    categoria: 'celulares',
    estrellas: 5,
    disponible: 5,
    complementario: 6,
    especificaciones: [
      'Pantalla Super AMOLED 6.7" · 144Hz',
      'Procesador Dimensity 9000 · 12GB RAM',
      'Almacenamiento 256GB UFS 3.1',
      'Cámara 108MP + 12MP + 5MP con zoom óptico 10x',
      'Batería 5500mAh · carga inalámbrica 15W'
    ]
  },
  {
    id: 6,
    nombre: 'Smartphone LitePhone Go',
    specs: '64GB · Doble SIM · 4G',
    precio: 620000,
    emoji: '📱',
    categoria: 'celulares',
    estrellas: 3,
    disponible: 20,
    complementario: null,
    especificaciones: [
      'Pantalla IPS LCD 6.1" HD+',
      'Procesador Helio G85 · 4GB RAM',
      'Almacenamiento 64GB expandible microSD',
      'Cámara 13MP + flash LED · frontal 5MP',
      'Batería 4000mAh · Doble SIM 4G LTE'
    ]
  },

  /* ── ACCESORIOS ──────────────────────────────── */
  {
    id: 7,
    nombre: 'Audífonos BassPro',
    specs: 'Bluetooth 5.3 · ANC',
    precio: 180000,
    emoji: '🎧',
    categoria: 'accesorios',
    estrellas: 4,
    disponible: 25,
    complementario: null,
    especificaciones: [
      'Bluetooth 5.3 · alcance hasta 10 metros',
      'Cancelación activa de ruido (ANC)',
      'Autonomía 30 horas con estuche de carga',
      'Drivers de 40mm · respuesta 20Hz–20kHz',
      'Plegables · incluye cable auxiliar 3.5mm'
    ]
  },
  {
    id: 8,
    nombre: 'Monitor Curvo 27"',
    specs: '144Hz · 2K QHD',
    precio: 980000,
    emoji: '🖥️',
    categoria: 'accesorios',
    estrellas: 5,
    disponible: 5,
    complementario: 7,
    especificaciones: [
      'Panel VA curvo 1800R · resolución 2560×1440 QHD',
      'Tasa de refresco 144Hz · 1ms tiempo de respuesta',
      'Compatibilidad FreeSync Premium / G-Sync',
      'Conectividad: 2× HDMI 2.0 + 1× DisplayPort 1.4',
      'Regulable en altura · modo sin parpadeo'
    ]
  },
  {
    id: 9,
    nombre: 'Mouse Inalámbrico Silent',
    specs: 'Silencioso · 2400 DPI · USB',
    precio: 75000,
    emoji: '🖱️',
    categoria: 'accesorios',
    estrellas: 4,
    disponible: 30,
    complementario: null,
    especificaciones: [
      'Sensor óptico 800–2400 DPI ajustable',
      'Conexión inalámbrica 2.4GHz · receptor nano USB',
      'Clic silencioso · hasta 80% menos ruido',
      'Autonomía 18 meses con 1 pila AA',
      'Compatible con Windows, Mac y Linux'
    ]
  },
  {
    id: 10,
    nombre: 'Teclado Mecánico RGB',
    specs: 'Switches Blue · TKL · USB-C',
    precio: 320000,
    emoji: '⌨️',
    categoria: 'accesorios',
    estrellas: 4,
    disponible: 10,
    complementario: 9,           // Mouse Silent
    especificaciones: [
      'Switches mecánicos Blue (táctil y auditivo)',
      'Formato TKL (tenkeyless) · 87 teclas',
      'Retroiluminación RGB por tecla, 16M colores',
      'Cable USB-C desmontable · anti-ghosting completo',
      'Marco de aluminio · compatible Win / Mac'
    ]
  }
];

let categoriaActual = 'todas';
let productoActual  = null;
let carrito         = [];

/* =============================================
   5.1 ÍCONOS VECTORIALES DE PRODUCTOS
   Reemplazan los emojis por ilustraciones propias
   (funcionan sin conexión y se ven en cualquier
   dispositivo exactamente igual).
   ============================================= */

/** Colección de íconos SVG en línea, uno por tipo de producto. */
const ICONOS_SVG = {
  laptop: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="44" height="28" rx="3" fill="#CFE3FB" stroke="#1565C0" stroke-width="2.5"/>
      <rect x="15" y="19" width="34" height="18" rx="1.5" fill="#1565C0"/>
      <path d="M4 46h56l-4 6H8l-4-6z" fill="#1565C0"/>
      <rect x="26" y="46" width="12" height="2.5" fill="#E3F2FD"/>
    </svg>`,
  celular: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="19" y="6" width="26" height="52" rx="5" fill="#CFE3FB" stroke="#1565C0" stroke-width="2.5"/>
      <rect x="23" y="12" width="18" height="34" rx="1.5" fill="#1565C0"/>
      <circle cx="32" cy="51" r="2.6" fill="#1565C0"/>
    </svg>`,
  audifonos: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 34v-2a18 18 0 0 1 36 0v2" stroke="#1565C0" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="9" y="32" width="12" height="18" rx="5" fill="#1565C0"/>
      <rect x="43" y="32" width="12" height="18" rx="5" fill="#1565C0"/>
      <rect x="12" y="36" width="6" height="10" rx="2" fill="#E3F2FD"/>
      <rect x="46" y="36" width="6" height="10" rx="2" fill="#E3F2FD"/>
    </svg>`,
  monitor: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="48" height="32" rx="3" fill="#CFE3FB" stroke="#1565C0" stroke-width="2.5"/>
      <rect x="13" y="15" width="38" height="22" fill="#1565C0"/>
      <rect x="27" y="42" width="10" height="8" fill="#1565C0"/>
      <rect x="19" y="50" width="26" height="4" rx="2" fill="#1565C0"/>
    </svg>`,
  mouse: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="10" width="24" height="40" rx="12" fill="#CFE3FB" stroke="#1565C0" stroke-width="2.5"/>
      <line x1="32" y1="10" x2="32" y2="26" stroke="#1565C0" stroke-width="2.5"/>
    </svg>`,
  teclado: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="18" width="52" height="28" rx="4" fill="#CFE3FB" stroke="#1565C0" stroke-width="2.5"/>
      <g fill="#1565C0">
        <rect x="12" y="24" width="6" height="5" rx="1"/>
        <rect x="21" y="24" width="6" height="5" rx="1"/>
        <rect x="30" y="24" width="6" height="5" rx="1"/>
        <rect x="39" y="24" width="6" height="5" rx="1"/>
        <rect x="48" y="24" width="4" height="5" rx="1"/>
        <rect x="12" y="32" width="6" height="5" rx="1"/>
        <rect x="21" y="32" width="6" height="5" rx="1"/>
        <rect x="30" y="32" width="6" height="5" rx="1"/>
        <rect x="39" y="32" width="6" height="5" rx="1"/>
        <rect x="21" y="39" width="24" height="4.5" rx="1.5"/>
      </g>
    </svg>`
};

/**
 * Determina qué ícono corresponde a un producto según su nombre
 * (más preciso) o, en su defecto, según su categoría.
 * @param {Object} p - producto
 * @returns {string} - markup SVG listo para insertar
 */
function obtenerIconoProducto(p) {
  const nombre = (p.nombre || '').toLowerCase();
  if (nombre.includes('audíf') || nombre.includes('audif')) return ICONOS_SVG.audifonos;
  if (nombre.includes('monitor'))                            return ICONOS_SVG.monitor;
  if (nombre.includes('mouse'))                               return ICONOS_SVG.mouse;
  if (nombre.includes('teclado'))                             return ICONOS_SVG.teclado;
  if (p.categoria === 'portatiles')                           return ICONOS_SVG.laptop;
  if (p.categoria === 'celulares')                             return ICONOS_SVG.celular;
  return ICONOS_SVG.laptop;
}

/**
 * Formatea un número como precio colombiano (ej: $2.450.000).
 * @param {number} num
 * @returns {string}
 */
function formatPrecio(num) {
  return '$' + num.toLocaleString('es-CO');
}

/**
 * Genera las estrellas de calificación en HTML.
 * @param {number} n - cantidad de estrellas llenas (máx 5)
 * @returns {string}
 */
function generarEstrellas(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/**
 * Traduce el nombre real de la categoria (de la base de datos)
 * a una de las 3 categorias que usa el filtro del frontend.
 */
function mapearCategoria(nombreCategoria) {
  const n = (nombreCategoria || '').toLowerCase();
  if (n.includes('portátil') || n.includes('portatil')) return 'portatiles';
  if (n.includes('celular')) return 'celulares';
  return 'accesorios';
}

/**
 * Trae los productos reales desde el backend y los adapta
 * al formato que usa el catalogo.
 */
async function cargarProductos() {
  try {
    const token = localStorage.getItem('tecnoNovaToken');
    const respuesta = await fetch('http://localhost:3000/api/productos', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const resultado = await respuesta.json();

    if (respuesta.ok) {
      PRODUCTOS = resultado.data.map((p) => ({
        id: p.id_producto,
        nombre: p.nombre_producto,
        specs: p.descripcion,
        precio: Number(p.precio),
        categoria: mapearCategoria(p.nombre_categoria),
        estrellas: 5,
        disponible: p.stock,
        especificaciones: p.descripcion.split(',').map((s) => s.trim()),
      }));
    }
  } catch (error) {
    mostrarToast('No se pudieron cargar los productos. Verifica que el backend esté encendido.');
  }

  renderizarProductos();
  await sincronizarCarrito();
}

/**
 * Filtra y renderiza las tarjetas de productos según categoría activa.
 */
function renderizarProductos() {
  const grid = document.getElementById('grid-productos');
  if (!grid) return;

  const filtrados = categoriaActual === 'todas'
    ? PRODUCTOS
    : PRODUCTOS.filter(p => p.categoria === categoriaActual);

  grid.innerHTML = filtrados.map(p => `
    <div class="card-producto" onclick="abrirDetalle(${p.id})">
      <div class="card-img">
        ${obtenerIconoProducto(p)}
      </div>
      <div class="card-nombre">${p.nombre}</div>
      <div class="card-specs">${p.specs}</div>
      <div class="card-precio">${formatPrecio(p.precio)}</div>
      <button class="card-btn-mas" onclick="event.stopPropagation(); agregarAlCarrito(${p.id})"
              title="Agregar al carrito" aria-label="Agregar ${p.nombre} al carrito">+</button>
    </div>
  `).join('');
}

/**
 * Cambia la categoría activa y re-renderiza.
 * @param {string} categoria
 */
function filtrarCategoria(categoria) {
  categoriaActual = categoria;

  // Actualizar chip activo
  document.querySelectorAll('.chip').forEach(chip => {
    chip.classList.toggle('activo', chip.dataset.categoria === categoria);
  });

  renderizarProductos();
}


/* =============================================
   6. DETALLE DEL PRODUCTO
   ============================================= */

let cantidadDetalle = 1;

/**
 * Abre la pantalla de detalle con los datos del producto seleccionado.
 * @param {number} id
 */
function abrirDetalle(id) {
  productoActual = PRODUCTOS.find(p => p.id === id);
  if (!productoActual) return;

  cantidadDetalle = 1;

  // Rellenar datos en pantalla
  document.getElementById('det-emoji').innerHTML       = obtenerIconoProducto(productoActual);
  document.getElementById('det-nombre').textContent    = productoActual.nombre;
  document.getElementById('det-estrellas').textContent = generarEstrellas(productoActual.estrellas);
  document.getElementById('det-precio').textContent    = formatPrecio(productoActual.precio);
  document.getElementById('det-disponible').textContent = productoActual.disponible + ' unidades disponibles';
  document.getElementById('det-cantidad').textContent  = cantidadDetalle;

  // ── Especificaciones: se leen del objeto del producto ──
  const listaSpecs = document.getElementById('det-especificaciones');
  if (listaSpecs && productoActual.especificaciones) {
    listaSpecs.innerHTML = productoActual.especificaciones
      .map(spec => `<li>• ${spec}</li>`)
      .join('');
  }

  // Precio del botón
  actualizarPrecioBotonDetalle();

  // Producto complementario
  const compId = productoActual.complementario;
  const comp = compId ? PRODUCTOS.find(p => p.id === compId) : null;
  const compContenedor = document.getElementById('det-complementario');
  if (comp) {
    compContenedor.innerHTML = `
      <div class="card-producto" style="width:130px; flex-shrink:0;" onclick="abrirDetalle(${comp.id})">
        <div class="card-img" style="height:56px;">${obtenerIconoProducto(comp)}</div>
        <div class="card-nombre" style="font-size:11px;">${comp.nombre}</div>
        <div class="card-specs">${comp.specs}</div>
        <div class="card-precio" style="font-size:13px;">${formatPrecio(comp.precio)}</div>
        <button class="card-btn-mas" style="width:26px;height:26px;font-size:16px;"
          onclick="event.stopPropagation(); agregarAlCarrito(${comp.id})" aria-label="Agregar complementario">+</button>
      </div>`;
    compContenedor.style.display = 'block';
  } else {
    compContenedor.style.display = 'none';
  }

  // Cargar y mostrar las reseñas guardadas de este producto
  resetearFormularioResena();
  renderizarResenas(productoActual.id);

  mostrarPantalla('pantalla-detalle');
}

/**
 * Actualiza el texto del botón "Añadir al carrito" con la cantidad y precio actuales.
 */
function actualizarPrecioBotonDetalle() {
  if (!productoActual) return;
  const total = productoActual.precio * cantidadDetalle;
  const btn   = document.getElementById('btn-anadir-carrito');
  if (btn) btn.textContent = `Añadir al carrito · ${formatPrecio(total)}`;
}

/**
 * Cambia la cantidad en el detalle del producto.
 * @param {number} delta - +1 o -1
 */
function cambiarCantidad(delta) {
  if (!productoActual) return;
  cantidadDetalle = Math.max(1, Math.min(cantidadDetalle + delta, productoActual.disponible));
  document.getElementById('det-cantidad').textContent = cantidadDetalle;
  actualizarPrecioBotonDetalle();
}

/* =============================================
   6.5 RESEÑAS DE CLIENTES (conectado a la API real)
   GA6-220501096-AA4-EV01
   ============================================= */

/** Guarda en qué estrella (1 a 5) está el usuario mientras llena el formulario */
let estrellasSeleccionadas = 0;

/**
 * Actualiza visualmente cuántas estrellas quedan "encendidas" en el
 * selector del formulario, según el valor elegido por el usuario.
 * @param {number} valor - de 1 a 5
 */
function seleccionarEstrellaFormulario(valor) {
  estrellasSeleccionadas = valor;
  document.querySelectorAll('#selector-estrellas .estrella-sel').forEach(el => {
    const esActiva = Number(el.dataset.valor) <= valor;
    el.classList.toggle('activa', esActiva);
  });
  limpiarError('resena-estrellas');
}

/**
 * (VALIDACIÓN) Revisa que el formulario de reseña esté correctamente
 * diligenciado antes de enviarlo al backend.
 * @returns {boolean} true si todo es válido
 */
function validarFormularioResena() {
  const comentario = document.getElementById('resena-comentario').value;
  let valido = true;

  limpiarError('resena-comentario');
  document.getElementById('resena-estrellas-error').classList.remove('visible');

  if (estrellasSeleccionadas < 1) {
    const errEl = document.getElementById('resena-estrellas-error');
    errEl.textContent = 'Selecciona al menos 1 estrella.';
    errEl.classList.add('visible');
    valido = false;
  }

  if (!validarNoVacio(comentario)) {
    mostrarError('resena-comentario', 'Escribe un comentario sobre el producto.');
    valido = false;
  } else if (comentario.trim().length < 10) {
    mostrarError('resena-comentario', 'El comentario debe tener al menos 10 caracteres.');
    valido = false;
  } else if (comentario.trim().length > 300) {
    mostrarError('resena-comentario', 'El comentario no puede superar los 300 caracteres.');
    valido = false;
  }

  return valido;
}

/**
 * (CREATE) Envía una reseña nueva al backend para el producto actual.
 */
async function guardarResena() {
  if (!productoActual) return;
  if (!validarFormularioResena()) return;

  const contenido = document.getElementById('resena-comentario').value.trim();
  const token = localStorage.getItem('tecnoNovaToken');

  const btn = document.getElementById('btn-guardar-resena');
  btn.disabled = true;

  try {
    const respuesta = await fetch('http://localhost:3000/api/comentarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        id_producto: productoActual.id,
        calificacion: estrellasSeleccionadas,
        contenido: contenido,
      }),
    });
    const resultado = await respuesta.json();

    if (respuesta.ok) {
      mostrarToast('¡Gracias por tu reseña! 🎉');
      resetearFormularioResena();
      await renderizarResenas(productoActual.id);
    } else {
      mostrarToast(resultado.message || 'No se pudo publicar la reseña.');
    }
  } catch (error) {
    mostrarToast('No se pudo conectar con el servidor.');
  } finally {
    btn.disabled = false;
  }
}

/**
 * (DELETE) Elimina una reseña propia, previa confirmación del usuario.
 * Solo funciona si el comentario pertenece al cliente que tiene la sesión activa.
 * @param {number} id
 */
async function eliminarResena(id) {
  const confirmar = window.confirm('¿Seguro que deseas eliminar esta reseña? Esta acción no se puede deshacer.');
  if (!confirmar) return;

  const token = localStorage.getItem('tecnoNovaToken');

  try {
    const respuesta = await fetch(`http://localhost:3000/api/comentarios/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const resultado = await respuesta.json();

    if (respuesta.ok) {
      mostrarToast('Reseña eliminada 🗑️');
      if (productoActual) await renderizarResenas(productoActual.id);
    } else {
      mostrarToast(resultado.message || 'No se pudo eliminar la reseña.');
    }
  } catch (error) {
    mostrarToast('No se pudo conectar con el servidor.');
  }
}

/**
 * Regresa el formulario de reseña a su estado inicial.
 */
function resetearFormularioResena() {
  document.getElementById('form-resena').reset();
  seleccionarEstrellaFormulario(0);
  limpiarError('resena-comentario');
  document.getElementById('resena-estrellas-error').classList.remove('visible');
}

/**
 * Convierte una fecha ISO del backend en una fecha legible (dd/mm/aaaa).
 * @param {string} fechaIso
 * @returns {string}
 */
function formatearFechaResena(fechaIso) {
  const f = new Date(fechaIso);
  const dd = String(f.getDate()).padStart(2, '0');
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${f.getFullYear()}`;
}

/**
 * (READ) Trae las reseñas reales de un producto desde el backend
 * y las dibuja en pantalla, junto con el resumen del promedio.
 * @param {number} productoId
 */
async function renderizarResenas(productoId) {
  const resumenEl = document.getElementById('resenas-resumen');
  const listaEl   = document.getElementById('lista-resenas');
  if (!resumenEl || !listaEl) return;

  const token = localStorage.getItem('tecnoNovaToken');
  const clienteLocal = JSON.parse(localStorage.getItem('tecnoNovaCliente') || '{}');

  resumenEl.innerHTML = '<p style="font-size:13px; color:var(--color-texto-secundario);">Cargando reseñas...</p>';
  listaEl.innerHTML = '';

  try {
    const respuesta = await fetch(`http://localhost:3000/api/comentarios/producto/${productoId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      resumenEl.innerHTML = '<p style="font-size:13px; color:var(--color-error);">No se pudieron cargar las reseñas.</p>';
      return;
    }

    const { promedio, total_comentarios, comentarios } = resultado;

    if (total_comentarios === 0) {
      resumenEl.innerHTML = `
        <div class="resenas-vacio" style="width:100%;">
          Este producto todavía no tiene reseñas. ¡Sé la primera en opinar!
        </div>`;
    } else {
      resumenEl.innerHTML = `
        <div class="resenas-promedio-num">${promedio}</div>
        <div class="resenas-promedio-detalle">
          <span class="estrellas">${generarEstrellas(Math.round(promedio))}</span>
          <span class="resenas-promedio-cantidad">
            ${total_comentarios} ${total_comentarios === 1 ? 'reseña' : 'reseñas'}
          </span>
        </div>`;
    }

    listaEl.innerHTML = comentarios.map(c => {
      const esPropia = clienteLocal.id_cliente === c.id_cliente;
      return `
        <div class="card-resena">
          <div class="resena-header">
            <div class="resena-autor-info">
              <span class="resena-autor">${c.nombre_cliente}</span>
              <span class="estrellas" style="font-size:13px;">${generarEstrellas(c.calificacion)}</span>
            </div>
            <div class="resena-acciones">
              <span class="resena-fecha">${formatearFechaResena(c.fecha_comentario)}</span>
              ${esPropia ? `
                <button class="btn-icono-resena eliminar" title="Eliminar reseña"
                        aria-label="Eliminar tu reseña"
                        onclick="eliminarResena(${c.id_comentario})">🗑️</button>
              ` : ''}
            </div>
          </div>
          <p class="resena-comentario">${c.contenido}</p>
        </div>
      `;
    }).join('');

  } catch (error) {
    resumenEl.innerHTML = '<p style="font-size:13px; color:var(--color-error);">Error de conexión con el servidor.</p>';
  }
}



/* =============================================
   7. CARRITO DE COMPRAS
   ============================================= */

/**
 * Agrega un producto al carrito (desde tarjeta o desde detalle).
 * @param {number} id
 * @param {number} [cantidad=1]
 */


/**
 * Trae el carrito real desde el backend y actualiza
 * el arreglo local `carrito` con esos datos.
 */
async function sincronizarCarrito() {
  try {
    const token = localStorage.getItem('tecnoNovaToken');
    const respuesta = await fetch('http://localhost:3000/api/carrito', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const resultado = await respuesta.json();

    if (respuesta.ok) {
      carrito = resultado.items.map((item) => ({
        idDetalle: item.id_detalle_carrito,
        idProducto: item.id_producto,
        nombre: item.nombre_producto,
        precio: Number(item.precio_unitario),
        cantidad: item.cantidad,
        subtotal: Number(item.subtotal),
      }));
    }
  } catch (error) {
    mostrarToast('No se pudo sincronizar el carrito con el servidor.');
  }
  actualizarContadorCarrito();
}

async function agregarAlCarrito(id, cantidad) {
  cantidad = cantidad || 1;
  const producto = PRODUCTOS.find(p => p.id === id);
  if (!producto) return;

  const token = localStorage.getItem('tecnoNovaToken');

  try {
    const respuesta = await fetch('http://localhost:3000/api/carrito/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id_producto: id, cantidad }),
    });

    if (respuesta.ok) {
      await sincronizarCarrito();
      mostrarToast(`${producto.nombre} añadido al carrito 🛒`);
    } else {
      mostrarToast('No se pudo agregar el producto al carrito.');
    }
  } catch (error) {
    mostrarToast('No se pudo conectar con el servidor.');
  }
}

/**
 * Agrega el producto actual desde la pantalla de detalle.
 */
function anadirDesdeDetalle() {
  if (!productoActual) return;
  agregarAlCarrito(productoActual.id, cantidadDetalle);
  mostrarPantalla('pantalla-carrito');
  renderizarCarrito();
}

/**
 * Actualiza el contador de ítems en el ícono de carrito de la nav inferior.
 */
function actualizarContadorCarrito() {
  const total = carrito.reduce((acc, c) => acc + c.cantidad, 0);
  const badge = document.getElementById('carrito-badge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
}

/**
 * Calcula subtotal, descuento, IVA y total del carrito,
 * teniendo en cuenta el cupón aplicado (si lo hay).
 * @returns {{subtotal:number, descuento:number, baseConDescuento:number, iva:number, total:number}}
 */
function calcularTotalesCarrito() {
  const subtotal = carrito.reduce((acc, c) => acc + c.subtotal, 0);
  return { subtotal, descuento: 0, baseConDescuento: subtotal, iva: 0, total: subtotal };
}

/**
 * Renderiza los ítems del carrito y el resumen de costos.
 */
function renderizarCarrito() {
  const lista = document.getElementById('lista-carrito');
  if (!lista) return;

  if (carrito.length === 0) {
    lista.innerHTML = `
      <div style="text-align:center; padding: 40px 0; color: var(--color-texto-secundario);">
        <div style="font-size:48px; margin-bottom:12px;">🛒</div>
        <p>Tu carrito está vacío.</p>
        <p style="font-size:13px; margin-top:6px;">Explora el catálogo y agrega productos.</p>
      </div>`;
  } else {
    lista.innerHTML = carrito.map(item => `
      <div class="card-producto" style="flex-direction:row; align-items:center; gap:12px; margin-bottom:10px;">
        <div class="card-img" style="width:52px; height:52px; min-width:52px;">${obtenerIconoProducto({nombre: item.nombre})}</div>
        <div style="flex:1; min-width:0;">
          <div class="card-nombre">${item.nombre}</div>
          <div class="card-specs">Cantidad: ${item.cantidad}</div>
          <div class="card-precio">${formatPrecio(item.subtotal)}</div>
        </div>
        <div class="cantidad-control">
          <button class="cantidad-btn" onclick="cambiarCantidadCarrito(${item.idDetalle}, -1)" aria-label="Reducir cantidad">−</button>
          <span class="cantidad-valor">${item.cantidad}</span>
          <button class="cantidad-btn" onclick="cambiarCantidadCarrito(${item.idDetalle}, 1)" aria-label="Aumentar cantidad">+</button>
        </div>
      </div>
    `).join('');
  }

  // Calcular totales
  const { subtotal, descuento, iva, total } = calcularTotalesCarrito();

  const elems = {
    'resumen-subtotal': formatPrecio(subtotal),
    'resumen-iva':      formatPrecio(iva),
    'resumen-total':    formatPrecio(total),
    'carrito-contador': carrito.reduce((a,c) => a+c.cantidad, 0) + ' ítems'
  };

  Object.entries(elems).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  const filaDescuento = document.getElementById('resumen-descuento-fila');
  if (filaDescuento) {
    filaDescuento.style.display = 'none';
  }
}

/**
 * Cambia la cantidad de un ítem en el carrito.
 * @param {number} id
 * @param {number} delta
 */
async function cambiarCantidadCarrito(idDetalle, delta) {
  const item = carrito.find(c => c.idDetalle === idDetalle);
  if (!item) return;

  const nuevaCantidad = item.cantidad + delta;
  const token = localStorage.getItem('tecnoNovaToken');

  try {
    if (nuevaCantidad <= 0) {
      await fetch(`http://localhost:3000/api/carrito/items/${idDetalle}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } else {
      await fetch(`http://localhost:3000/api/carrito/items/${idDetalle}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      });
    }
    await sincronizarCarrito();
    renderizarCarrito();
  } catch (error) {
    mostrarToast('No se pudo actualizar el carrito.');
  }
}

/* =============================================
   7.1 CUPÓN DE DESCUENTO (validación real)
   ============================================= */

/** Códigos de descuento vigentes. Solo SENA2026 (15%) está activo. */
const CUPONES_VALIDOS = { 'SENA2026': 15 };

/** Cupón actualmente aplicado al carrito, o null si no hay ninguno. */
let cuponAplicado = null;

/**
 * Valida el código de cupón ingresado y, si es correcto,
 * aplica el descuento real al carrito ANTES de continuar al pago.
 */
function aplicarCupon() {
  const input      = document.getElementById('input-cupon');
  const contenedor = document.getElementById('cupon-contenedor');
  const mensaje    = document.getElementById('cupon-mensaje');
  const codigo     = input ? input.value.trim().toUpperCase() : '';

  if (!codigo) {
    mensaje.textContent = 'Escribe un código de descuento primero.';
    mensaje.className = 'cupon-mensaje error';
    return;
  }

  if (carrito.length === 0) {
    mensaje.textContent = 'Agrega productos al carrito antes de aplicar un cupón.';
    mensaje.className = 'cupon-mensaje error';
    return;
  }

  if (CUPONES_VALIDOS[codigo]) {
    cuponAplicado = { codigo, porcentaje: CUPONES_VALIDOS[codigo] };
    contenedor.classList.add('cupon-valido');
    mensaje.textContent = `¡Código válido! Descuento del ${cuponAplicado.porcentaje}% aplicado. 🎉`;
    mensaje.className = 'cupon-mensaje exito';
    mostrarToast(`Cupón ${codigo} aplicado correctamente`);
  } else {
    cuponAplicado = null;
    contenedor.classList.remove('cupon-valido');
    mensaje.textContent = 'Código no válido. Intenta con SENA2026.';
    mensaje.className = 'cupon-mensaje error';
  }

  renderizarCarrito();
}


/* =============================================
   8. PANTALLA DE PAGO
   ============================================= */

/**
 * Pasa a la pantalla de finalizar compra con el resumen actualizado
 * (incluye el descuento del cupón, ya validado en el carrito).
 */
function irAPago() {
  if (carrito.length === 0) {
    mostrarToast('Agrega productos al carrito primero.');
    return;
  }

  const { subtotal, descuento, iva, total } = calcularTotalesCarrito();

  const el = (id) => document.getElementById(id);
  if (el('pago-productos')) el('pago-productos').textContent = formatPrecio(subtotal);
  if (el('pago-iva'))       el('pago-iva').textContent       = formatPrecio(iva);
  if (el('pago-total'))     el('pago-total').textContent     = formatPrecio(total);
  if (el('pago-n-productos')) {
    el('pago-n-productos').textContent = 'Productos (' + carrito.reduce((a,c)=>a+c.cantidad,0) + ')';
  }

  const filaDescuentoPago = el('pago-descuento-fila');
  if (filaDescuentoPago) {
    if (cuponAplicado) {
      filaDescuentoPago.style.display = 'flex';
      el('pago-descuento-label').textContent = `Descuento (${cuponAplicado.codigo} · ${cuponAplicado.porcentaje}%)`;
      el('pago-descuento').textContent = '-' + formatPrecio(descuento);
    } else {
      filaDescuentoPago.style.display = 'none';
    }
  }

  mostrarPantalla('pantalla-pago');
}

/** Estado del método de pago seleccionado */
let metodoPago = 'tarjeta';

/**
 * Selecciona el método de pago.
 * @param {string} metodo
 */
function seleccionarMetodoPago(metodo) {
  metodoPago = metodo;

  document.querySelectorAll('.radio-opcion').forEach(el => {
    el.classList.remove('seleccionado');
  });

  const target = document.getElementById('opcion-' + metodo);
  if (target) target.classList.add('seleccionado');

  document.querySelectorAll('.radio-opcion input[type="radio"]').forEach(r => {
    r.checked = r.value === metodo;
  });
}

/**
 * Confirma el pago (simulado) y guarda el pedido en el
 * historial de compras del usuario que tiene la sesión abierta.
 */
async function confirmarPago() {
  const btn = document.getElementById('btn-confirmar-pago');
  btn.innerHTML = '<span class="spinner"></span> Procesando...';
  btn.disabled = true;

  const token = localStorage.getItem('tecnoNovaToken');

  try {
    const respuestaCompra = await fetch('http://localhost:3000/api/carrito/confirmar-compra', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const resultadoCompra = await respuestaCompra.json();

    if (!respuestaCompra.ok) {
      mostrarToast(resultadoCompra.message || 'No se pudo confirmar la compra.');
      btn.innerHTML = '🔒 Confirmar pago';
      btn.disabled = false;
      return;
    }

    const idPedido = resultadoCompra.data.id_pedido;

    const respuestaPago = await fetch('http://localhost:3000/api/pagos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id_pedido: idPedido, metodo_pago: metodoPago }),
    });
    const resultadoPago = await respuestaPago.json();

    if (respuestaPago.ok) {
      mostrarToast('¡Pago confirmado exitosamente! 🎊');
    } else {
      mostrarToast('El pedido se creó, pero el pago no se pudo registrar.');
    }

    await sincronizarCarrito();
    mostrarPantalla('pantalla-catalogo');
    await cargarProductos();
  } catch (error) {
    mostrarToast('No se pudo conectar con el servidor.');
  } finally {
    btn.innerHTML = '🔒 Confirmar pago';
    btn.disabled = false;
  }
}

/* =============================================
   8.1 PANTALLA DE PERFIL (datos, foto, historial)
   GA6-220501096-AA3
   ============================================= */

const HISTORIAL_STORAGE_KEY = 'tecnonova_historial';

/** (READ) Lee el historial completo (todos los usuarios) desde localStorage. */
function leerHistorialCompleto() {
  try {
    const datos = localStorage.getItem(HISTORIAL_STORAGE_KEY);
    return datos ? JSON.parse(datos) : {};
  } catch {
    return {};
  }
}

/** (CREATE) Agrega un pedido nuevo al historial del usuario con sesión activa. */
function guardarPedidoEnHistorial(items, total, metodo, cupon) {
  const usuario = obtenerUsuarioActual();
  if (!usuario) return; // por seguridad, no debería pasar dentro del flujo de compra

  const historial = leerHistorialCompleto();
  const clave = usuario.correo.toLowerCase();
  if (!historial[clave]) historial[clave] = [];

  historial[clave].unshift({
    id: Date.now(),
    fecha: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
    items,
    total,
    metodo,
    cupon
  });

  localStorage.setItem(HISTORIAL_STORAGE_KEY, JSON.stringify(historial));
}

/** Nombres legibles para cada método de pago. */
const NOMBRES_METODO_PAGO = {
  tarjeta: 'Tarjeta de crédito/débito',
  pse: 'PSE',
  contra: 'Pago contraentrega'
};

/**
 * Genera las iniciales de un usuario a partir de su nombre y apellido.
 * @param {Object} usuario
 * @returns {string}
 */
function generarIniciales(usuario) {
  const n = (usuario.nombres || '').trim().charAt(0);
  const a = (usuario.apellidos || '').trim().charAt(0);
  return (n + a).toUpperCase() || '🙂';
}

/**
 * Dibuja/actualiza la pantalla de Perfil con los datos del usuario
 * que tiene la sesión abierta: avatar, datos personales e historial.
 */
async function guardarDatosPerfil() {
  const clienteLocal = JSON.parse(localStorage.getItem('tecnoNovaCliente') || 'null');
  if (!clienteLocal) return;

  const nombre = document.getElementById('perfil-nombres').value;
  const correo = document.getElementById('perfil-correo-input').value;
  let valido = true;

  ['perfil-nombres','perfil-correo-input'].forEach(limpiarError);

  if (!validarNoVacio(nombre) || nombre.trim().length < 2) {
    mostrarError('perfil-nombres', 'Escribe un nombre válido.');
    valido = false;
  }
  if (!validarEmail(correo)) {
    mostrarError('perfil-correo-input', 'Escribe un correo electrónico válido.');
    valido = false;
  }
  if (!valido) return;

  const token = localStorage.getItem('tecnoNovaToken');

  try {
    const respuesta = await fetch(`http://localhost:3000/api/clientes/${clienteLocal.id_cliente}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ nombre: nombre.trim(), correo: correo.trim().toLowerCase() }),
    });
    const resultado = await respuesta.json();

    if (respuesta.ok) {
      localStorage.setItem('tecnoNovaCliente', JSON.stringify({ ...clienteLocal, nombre: nombre.trim(), correo: correo.trim().toLowerCase() }));
      mostrarToast('Datos actualizados correctamente ✅');
      renderPerfil();
    } else {
      mostrarToast(resultado.message || 'No se pudieron actualizar los datos.');
    }
  } catch (error) {
    mostrarToast('No se pudo conectar con el servidor.');
  }
}

function cambiarFotoPerfil(e) {
  mostrarToast('La foto de perfil aún no está disponible en esta versión.');
}

async function renderHistorialCompras() {
  const cont = document.getElementById('lista-historial');
  if (!cont) return;

  const clienteLocal = JSON.parse(localStorage.getItem('tecnoNovaCliente') || 'null');
  const token = localStorage.getItem('tecnoNovaToken');
  if (!clienteLocal) return;

  try {
    const respuesta = await fetch(`http://localhost:3000/api/pedidos/cliente/${clienteLocal.id_cliente}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const resultado = await respuesta.json();
    const pedidos = respuesta.ok ? resultado.data : [];

    if (pedidos.length === 0) {
      cont.innerHTML = `
        <div class="historial-vacio">
          <div style="font-size:36px; margin-bottom:8px;">🧾</div>
          Aún no tienes compras registradas.<br>
          ¡Explora el catálogo y realiza tu primer pedido!
        </div>`;
      return;
    }

    const pedidosConDetalle = await Promise.all(pedidos.map(async (p) => {
      const detResp = await fetch(`http://localhost:3000/api/pedidos/${p.id_pedido}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const detResult = await detResp.json();
      return { ...p, items: (detResult.data && detResult.data.detalle) || [] };
    }));

    cont.innerHTML = pedidosConDetalle.map(pedido => `
      <div class="historial-pedido">
        <div class="historial-pedido-cabecera">
          <span class="historial-pedido-fecha">${new Date(pedido.fecha_pedido).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          <span class="historial-pedido-estado">${pedido.estado}</span>
        </div>
        <div class="historial-pedido-items">
          ${pedido.items.map(it => `${it.cantidad}× ${it.nombre_producto}`).join('<br>')}
        </div>
        <div class="historial-pedido-total">${formatPrecio(pedido.total)}</div>
      </div>
    `).join('');
  } catch (error) {
    cont.innerHTML = '<div class="historial-vacio">No se pudo cargar el historial.</div>';
  }
}

/**
 * Abre/cierra un acordeón de la pantalla de perfil.
 * @param {string} id
 */
function alternarSeccionPerfil(id) {
  const seccion = document.getElementById(id);
  if (seccion) seccion.classList.toggle('abierta');
}

/* =============================================
   8.2 SERVICIO TÉCNICO (garantías y soporte)
   ============================================= */

/**
 * Llena el <select> de productos con el catálogo actual,
 * para que el cliente elija sobre cuál producto radica la solicitud.
 */
function cargarSelectProductosServicio() {
  const select = document.getElementById('servicio-producto');
  if (!select) return;
  select.innerHTML = PRODUCTOS.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
}

/**
 * (CREATE) Envía una solicitud nueva de servicio técnico al backend.
 */
async function radicarServicioTecnico() {
  const idProducto  = document.getElementById('servicio-producto').value;
  const descripcion = document.getElementById('servicio-descripcion').value;

  limpiarError('servicio-descripcion');

  if (!validarNoVacio(descripcion) || descripcion.trim().length < 10) {
    mostrarError('servicio-descripcion', 'Describe el problema con al menos 10 caracteres.');
    return;
  }

  const token = localStorage.getItem('tecnoNovaToken');
  const btn = document.getElementById('btn-radicar-servicio');
  btn.disabled = true;

  try {
    const respuesta = await fetch('http://localhost:3000/api/servicio-tecnico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        id_producto: Number(idProducto),
        descripcion: descripcion.trim(),
      }),
    });
    const resultado = await respuesta.json();

    if (respuesta.ok) {
      mostrarToast('Solicitud radicada correctamente 🛠️');
      document.getElementById('servicio-descripcion').value = '';
      await renderizarMisSolicitudes();
    } else {
      mostrarToast(resultado.message || 'No se pudo radicar la solicitud.');
    }
  } catch (error) {
    mostrarToast('No se pudo conectar con el servidor.');
  } finally {
    btn.disabled = false;
  }
}

/** Etiquetas legibles para cada estado de una solicitud. */
const ESTADOS_SERVICIO_TECNICO = {
  radicado: 'Radicado',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
};

/**
 * (READ) Trae las solicitudes de servicio técnico del cliente actual
 * y las dibuja en pantalla.
 */
async function renderizarMisSolicitudes() {
  const cont = document.getElementById('lista-servicio-tecnico');
  if (!cont) return;

  const token = localStorage.getItem('tecnoNovaToken');
  cont.innerHTML = '<p style="font-size:13px; color:var(--color-texto-secundario);">Cargando tus solicitudes...</p>';

  try {
    const respuesta = await fetch('http://localhost:3000/api/servicio-tecnico/mis-solicitudes', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const resultado = await respuesta.json();
    const solicitudes = respuesta.ok ? resultado.data : [];

    if (solicitudes.length === 0) {
      cont.innerHTML = '<p style="font-size:13px; color:var(--color-texto-secundario);">No tienes solicitudes de servicio técnico.</p>';
      return;
    }

    cont.innerHTML = solicitudes.map(s => {
      const producto = PRODUCTOS.find(p => p.id === s.id_producto);
      const fecha = new Date(s.fecha_solicitud).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      return `
        <div style="border:1px solid var(--color-borde, #e0e0e0); border-radius:var(--radio-md); padding:12px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:6px;">
            <span>${producto ? producto.nombre : 'Producto #' + s.id_producto}</span>
            <span style="text-transform:capitalize;">${ESTADOS_SERVICIO_TECNICO[s.estado] || s.estado}</span>
          </div>
          <div style="font-size:12px; color:var(--color-texto-secundario); margin-bottom:6px;">${fecha}</div>
          <p style="font-size:13px; margin:0;">${s.descripcion}</p>
        </div>
      `;
    }).join('');
  } catch (error) {
    cont.innerHTML = '<p style="font-size:13px; color:var(--color-error);">Error de conexión con el servidor.</p>';
  }
}

/* =============================================
   9. BARRA DE BÚSQUEDA
   ============================================= */

/**
 * Filtra productos en el catálogo según el texto buscado.
 * @param {Event} e
 */
function buscarProducto(e) {
  const texto = e.target.value.toLowerCase().trim();

  if (!texto) {
    renderizarProductos();
    return;
  }

  const filtrados = PRODUCTOS.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.specs.toLowerCase().includes(texto)
  );

  const grid = document.getElementById('grid-productos');
  if (!grid) return;

  if (filtrados.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:30px 0; color:var(--color-texto-secundario);">
        <div style="font-size:40px;">🔍</div>
        <p style="margin-top:8px;">Sin resultados para "${texto}"</p>
      </div>`;
  } else {
    grid.innerHTML = filtrados.map(p => `
      <div class="card-producto" onclick="abrirDetalle(${p.id})">
        <div class="card-img">${obtenerIconoProducto(p)}</div>
        <div class="card-nombre">${p.nombre}</div>
        <div class="card-specs">${p.specs}</div>
        <div class="card-precio">${formatPrecio(p.precio)}</div>
        <button class="card-btn-mas" onclick="event.stopPropagation(); agregarAlCarrito(${p.id})" aria-label="Agregar">+</button>
      </div>
    `).join('');
  }
}


/* =============================================
   10. TOAST DE NOTIFICACIÓN
   ============================================= */

let toastTimer = null;

/**
 * Muestra un mensaje toast temporal.
 * @param {string} mensaje
 * @param {number} [duracion=2500] milisegundos
 */
function mostrarToast(mensaje, duracion) {
  duracion = duracion || 2500;
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = mensaje;
  toast.classList.add('visible');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, duracion);
}


/* =============================================
   11. INICIALIZACIÓN AL CARGAR LA PÁGINA
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  // Si ya hay una sesión activa guardada, entrar directo al catálogo
  // (evita tener que iniciar sesión cada vez que se abre la app)
  const tokenGuardado = localStorage.getItem('tecnoNovaToken');
  if (tokenGuardado) {
    mostrarPantalla('pantalla-catalogo');
    cargarProductos();
  } else {
    mostrarPantalla('pantalla-login');
  }

  // Renderizar productos del catálogo
  renderizarProductos();

  // Listener del botón de login
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) btnLogin.addEventListener('click', manejarLogin);

  // Enviar login con Enter
  ['login-email', 'login-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') manejarLogin();
    });
  });

  // Listener del botón de guardar registro
  const btnGuardar = document.getElementById('btn-guardar-registro');
  if (btnGuardar) btnGuardar.addEventListener('click', manejarRegistro);

  // Formatear fecha automáticamente
  const campoFecha = document.getElementById('reg-fecha');
  if (campoFecha) campoFecha.addEventListener('input', function() { formatearFecha(this); });

  // Limpiar error de campo al escribir
  document.querySelectorAll('.campo-input').forEach(input => {
    input.addEventListener('input', function() {
      limpiarError(this.id);
    });
  });

  // Chips de categoría
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function() {
      filtrarCategoria(this.dataset.categoria);
    });
  });

  // Búsqueda
  const inputBusqueda = document.getElementById('input-busqueda');
  if (inputBusqueda) inputBusqueda.addEventListener('input', buscarProducto);

  // Botón añadir al carrito desde detalle
  const btnAnadir = document.getElementById('btn-anadir-carrito');
  if (btnAnadir) btnAnadir.addEventListener('click', anadirDesdeDetalle);

  // Botones de cantidad en detalle
  const btnMenos = document.getElementById('btn-cant-menos');
  const btnMas   = document.getElementById('btn-cant-mas');
  if (btnMenos) btnMenos.addEventListener('click', () => cambiarCantidad(-1));
  if (btnMas)   btnMas.addEventListener('click',   () => cambiarCantidad(+1));

  // Opciones de método de pago
  document.querySelectorAll('.radio-opcion').forEach(opcion => {
    opcion.addEventListener('click', function() {
      const radio = this.querySelector('input[type="radio"]');
      if (radio) seleccionarMetodoPago(radio.value);
    });
  });

  // Confirmar pago
  const btnPago = document.getElementById('btn-confirmar-pago');
  if (btnPago) btnPago.addEventListener('click', confirmarPago);

  // Aplicar cupón
  const btnCupon = document.getElementById('btn-aplicar-cupon');
  if (btnCupon) btnCupon.addEventListener('click', aplicarCupon);

  // ---- Módulo de reseñas de clientes ----
  // Selector de estrellas del formulario
  document.querySelectorAll('#selector-estrellas .estrella-sel').forEach(estrella => {
    estrella.addEventListener('click', function() {
      seleccionarEstrellaFormulario(Number(this.dataset.valor));
    });
  });

  // Botón publicar / guardar cambios de reseña
  const btnGuardarResena = document.getElementById('btn-guardar-resena');
  if (btnGuardarResena) btnGuardarResena.addEventListener('click', guardarResena);

  // Botón cancelar edición de reseña
  const btnCancelarResena = document.getElementById('btn-cancelar-edicion-resena');
  if (btnCancelarResena) btnCancelarResena.addEventListener('click', resetearFormularioResena);

  // Badge de carrito oculto al inicio
  const badge = document.getElementById('carrito-badge');
  if (badge) badge.style.display = 'none';

  // ---- Módulo de Perfil ----
  // Abrir/cerrar cada sección (acordeón)
  document.querySelectorAll('.perfil-seccion-cabecera').forEach(cabecera => {
    cabecera.addEventListener('click', function () {
      alternarSeccionPerfil(this.dataset.toggle);
    });
  });

  // Botón de la cámara abre el selector de archivos
  const btnEditarAvatar = document.getElementById('perfil-avatar-editar');
  const inputAvatar     = document.getElementById('perfil-avatar-input');
  if (btnEditarAvatar && inputAvatar) {
    btnEditarAvatar.addEventListener('click', () => inputAvatar.click());
    inputAvatar.addEventListener('change', cambiarFotoPerfil);
  }

  // Guardar cambios de datos personales
  const btnGuardarPerfil = document.getElementById('btn-guardar-perfil');
  if (btnGuardarPerfil) btnGuardarPerfil.addEventListener('click', guardarDatosPerfil);

  // Formatear fecha de nacimiento en el formulario del perfil
  const campoFechaPerfil = document.getElementById('perfil-fecha');
  if (campoFechaPerfil) campoFechaPerfil.addEventListener('input', function () { formatearFecha(this); });

  // Servicio técnico
  const btnRadicarServicio = document.getElementById('btn-radicar-servicio');
  if (btnRadicarServicio) btnRadicarServicio.addEventListener('click', radicarServicioTecnico);

  // Cerrar sesión
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  if (btnCerrarSesion) btnCerrarSesion.addEventListener('click', cerrarSesion);

  console.log('✅ Tecno Nova iniciado correctamente. GA6-220501096-AA3');
});
