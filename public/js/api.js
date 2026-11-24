// Adolat SDP Frontend API & Auth Client
const API_BASE = '/api';

const auth = {
  getToken() {
    return localStorage.getItem('adolat_token');
  },
  getUser() {
    const raw = localStorage.getItem('adolat_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setSession(token, user) {
    localStorage.setItem('adolat_token', token);
    localStorage.setItem('adolat_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('adolat_token');
    localStorage.removeItem('adolat_user');
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  }
};

async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`API Error (${endpoint}):`, err);
    return { success: false, message: 'Tarmoqqa ulanishda xatolik yuz berdi.' };
  }
}

// Global SSE listener for real-time events
function initSSE(onEvent) {
  try {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (onEvent) onEvent(data);
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
    eventSource.onerror = () => {
      // Reconnect automatically handled by EventSource
    };
  } catch (err) {
    console.warn('SSE not supported or disabled', err);
  }
}

// Notification Toast
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-blue-600');
  const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');

  toast.className = `${bgClass} text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 transition-all duration-300 transform translate-y-2 opacity-0`;
  toast.innerHTML = `
    <i class="fas ${icon} text-lg"></i>
    <span class="text-sm font-medium">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Update Top Navigation Bar depending on auth state
function updateNavBar() {
  const authNav = document.getElementById('nav-auth-section');
  if (!authNav) return;

  const user = auth.getUser();
  if (user) {
    const roleBadge = user.role === 'admin' 
      ? '<span class="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">Admin</span>' 
      : '<span class="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">Fuqaro</span>';

    authNav.innerHTML = `
      <div class="flex items-center space-x-3">
        <a href="/cabinet.html" class="flex items-center space-x-2 text-slate-700 hover:text-red-600 font-medium text-sm transition">
          <div class="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ${user.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <span>${user.fullName || user.username}</span>
          ${roleBadge}
        </a>
        ${user.role === 'admin' ? `
          <a href="/admin.html" class="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1">
            <i class="fas fa-shield-halved"></i>
            <span>Admin Panel</span>
          </a>
        ` : ''}
        <button onclick="logoutUser()" class="text-slate-400 hover:text-red-600 text-sm p-1.5" title="Chiqish">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    `;
  } else {
    authNav.innerHTML = `
      <div class="flex items-center space-x-2">
        <button onclick="openAuthModal('login')" class="text-slate-700 hover:text-red-700 font-semibold text-sm px-3 py-2 rounded-lg transition">
          <i class="fas fa-sign-in-alt mr-1"></i> Kirish
        </button>
        <button onclick="openAuthModal('register')" class="bg-red-700 hover:bg-red-800 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition">
          <i class="fas fa-user-plus mr-1"></i> Ro‘yxatdan o‘tish
        </button>
      </div>
    `;
  }
}

function logoutUser() {
  auth.clearSession();
  showToast('Tizimdan muvaffaqiyatli chiqdingiz', 'info');
  setTimeout(() => {
    window.location.reload();
  }, 400);
}

// Auth Modal Controls
function openAuthModal(mode = 'login') {
  let modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  switchAuthTab(mode);
}

function closeAuthModal() {
  let modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    tabLogin.classList.add('border-red-600', 'text-red-600');
    tabLogin.classList.remove('border-transparent', 'text-slate-500');
    tabReg.classList.remove('border-red-600', 'text-red-600');
    tabReg.classList.add('border-transparent', 'text-slate-500');
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    tabReg.classList.add('border-red-600', 'text-red-600');
    tabReg.classList.remove('border-transparent', 'text-slate-500');
    tabLogin.classList.remove('border-red-600', 'text-red-600');
    tabLogin.classList.add('border-transparent', 'text-slate-500');
  }
}

// Role toggle in registration form (Citizen vs Admin)
function toggleRoleFields() {
  const roleSelect = document.getElementById('reg-role');
  const adminCodeField = document.getElementById('admin-code-container');
  if (!roleSelect || !adminCodeField) return;

  if (roleSelect.value === 'admin') {
    adminCodeField.classList.remove('hidden');
  } else {
    adminCodeField.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavBar();
  initSSE((event) => {
    if (event.type === 'NEW_APPEAL' && auth.isAdmin()) {
      showToast(`Yangi fuqaro murojaati kelib tushdi (#${event.appeal.id})`, 'info');
    }
  });
});
