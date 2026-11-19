/**
 * Busamed Hillcrest Private Hospital - Theatre Charging System
 * Phase 1 UI Controller: Split-Screen Busamed Login Page, User Roles (RBAC), Admin Dashboard & Nurse Dashboard
 */

let appState = loadState();
let currentView = appState.currentUser
  ? (appState.currentUser.role === 'Administrator' ? 'admin' : 'nurse')
  : 'login';

let loginTabMode = 'login'; // 'login' | 'signup'
let showPasswordText = false;
let loginQuoteIndex = 0;

const LOGIN_QUOTES = [
  {
    quote: '“With the Busamed Hillcrest Theatre Charging System, we eliminate paper charge sheets, scan SAP consumables in seconds, and ensure 100% billing accuracy across every theatre case.”',
    author: 'Sr. Thandi Nkosi',
    role: 'Theatre Matron & System Administrator',
    org: 'Busamed Hillcrest Private Hospital'
  },
  {
    quote: '“Our 100% Master-Data Driven design means new surgical procedures, SAP items, and charge sheet templates become immediately available on theatre iPads without software changes.”',
    author: 'Johan Pretorius',
    role: 'SAP & Inventory Control Lead',
    org: 'Busamed Hillcrest Private Hospital'
  },
  {
    quote: '“Barcode scanning on theatre iPads makes capturing schedule drugs, sutures, and additional theatre charges effortless during busy surgical lists.”',
    author: 'RN Sarah van der Merwe',
    role: 'Senior Scrub Sister • Main Theatre',
    org: 'Busamed Hillcrest Private Hospital'
  }
];

let adminSubTab = 'overview'; // 'overview' | 'users' | 'roles' | 'modules' | 'audit'
let nurseSubTab = 'launch';   // 'launch' | 'drafts' | 'submitted'
let nurseSearchQuery = '';
let nurseCategoryFilter = 'All';
let selectedChargeSheetPreview = null;
let editingUserModal = null;
let resetPasswordModalUser = null;
let forgotPasswordModalOpen = false;
let alertBanner = null;

function showBanner(type, text) {
  alertBanner = { type, text };
  renderApp();
  setTimeout(() => {
    if (alertBanner && alertBanner.text === text) {
      alertBanner = null;
      renderApp();
    }
  }, 5500);
}

function fillAndLoginDemo(username, password) {
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  if (uInput && pInput) {
    uInput.value = username;
    pInput.value = password;
  }
  const res = authenticateUser(appState, username, password);
  if (!res.ok) {
    showBanner('error', res.message);
    return;
  }
  alertBanner = null;
  currentView = res.targetDashboard;
  adminSubTab = 'overview';
  nurseSubTab = 'launch';
  showBanner('success', `Welcome, ${res.user.fullName} (${res.user.role}). Authenticated at ${res.user.loginTimestamp}.`);
}

function handleLoginSubmit(event) {
  if (event) event.preventDefault();
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  const res = authenticateUser(appState, uInput ? uInput.value : '', pInput ? pInput.value : '');

  if (!res.ok) {
    showBanner('error', res.message);
    return;
  }

  alertBanner = null;
  currentView = res.targetDashboard;
  adminSubTab = 'overview';
  nurseSubTab = 'launch';
  showBanner('success', `Welcome, ${res.user.fullName} (${res.user.role}). Authenticated at ${res.user.loginTimestamp}.`);
}

function handleSignUpRequest(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('signup-name')?.value || 'New Staff';
  const emp = document.getElementById('signup-emp')?.value || 'EMP-NEW';
  addAuditEntry(appState, {
    user: `${name} (${emp})`,
    role: 'Nurse Applicant',
    action: 'Account Access Request',
    details: 'Submitted account provisioning request to Theatre Administrator',
    status: 'Success'
  });
  loginTabMode = 'login';
  showBanner('info', `Access request recorded for ${name} (${emp}). As required by SRS Section 2.1, an Administrator creates and activates nurse accounts in User Master.`);
}

function cycleQuote(dir) {
  loginQuoteIndex = (loginQuoteIndex + dir + LOGIN_QUOTES.length) % LOGIN_QUOTES.length;
  renderApp();
}

function handleLogout() {
  logoutCurrentUser(appState);
  currentView = 'login';
  selectedChargeSheetPreview = null;
  editingUserModal = null;
  resetPasswordModalUser = null;
  showBanner('info', 'You have been securely logged out of the Theatre Charging System.');
}

function trySwitchDashboardView(targetView) {
  if (!appState.currentUser) {
    currentView = 'login';
    renderApp();
    return;
  }
  const requiredRole = targetView === 'admin' ? 'Administrator' : 'Nurse';
  const check = checkRoleAccess(appState, requiredRole);
  if (!check.allowed) {
    showBanner('error', check.message);
    return;
  }
  currentView = targetView;
  renderApp();
}

function openCreateUserModal() {
  editingUserModal = {
    id: null,
    employeeNumber: 'EMP-' + Math.floor(2110 + Math.random() * 800),
    fullName: '',
    username: '',
    password: 'Nurse@2026',
    department: 'Main Operating Theatre',
    role: 'Nurse',
    active: true
  };
  renderApp();
}

function openEditUserModal(userId) {
  const found = appState.users.find((u) => u.id === userId);
  if (!found) return;
  editingUserModal = { ...found, password: '' };
  renderApp();
}

function closeUserModal() {
  editingUserModal = null;
  renderApp();
}

function saveUserFromModal(event) {
  if (event) event.preventDefault();
  const payload = {
    id: editingUserModal.id,
    employeeNumber: document.getElementById('um-emp').value,
    fullName: document.getElementById('um-name').value,
    username: document.getElementById('um-user').value,
    password: document.getElementById('um-pass').value,
    department: document.getElementById('um-dept').value,
    role: document.getElementById('um-role').value,
    active: document.getElementById('um-active').checked
  };

  const result = createOrUpdateUser(appState, payload);
  if (!result.ok) {
    showBanner('error', result.message);
    return;
  }

  editingUserModal = null;
  showBanner(
    'success',
    result.mode === 'created'
      ? `Created ${result.user.role} account for ${result.user.fullName} (${result.user.username}). They can now log in.`
      : `Updated account details for ${result.user.fullName}.`
  );
}

function handleToggleUserStatus(userId) {
  const res = toggleUserActiveStatus(appState, userId);
  if (!res.ok) {
    showBanner('error', res.message);
    return;
  }
  showBanner(
    'info',
    `Account for ${res.user.fullName} is now ${res.user.active ? 'ACTIVE' : 'DISABLED'}.`
  );
}

function openResetPasswordModal(userId) {
  const found = appState.users.find((u) => u.id === userId);
  if (!found) return;
  resetPasswordModalUser = found;
  renderApp();
}

function confirmResetPassword(event) {
  if (event) event.preventDefault();
  const newPass = document.getElementById('reset-pass-input').value;
  const res = resetUserPasswordByAdmin(appState, resetPasswordModalUser.id, newPass);
  if (!res.ok) {
    showBanner('error', res.message);
    return;
  }
  const targetName = resetPasswordModalUser.fullName;
  resetPasswordModalUser = null;
  showBanner('success', `Password reset successfully for ${targetName}.`);
}

function openNurseChargeSheetPreview(sheetId) {
  const sheet = appState.chargeSheets.find((c) => c.id === sheetId);
  if (!sheet) return;
  selectedChargeSheetPreview = sheet;
  addAuditEntry(appState, {
    user: `${appState.currentUser.fullName} (${appState.currentUser.employeeNumber})`,
    role: appState.currentUser.role,
    action: 'Selected Charge Sheet Template',
    details: `Opened "${sheet.name}" (${sheet.procedures.length} linked procedures)`,
    status: 'Success'
  });
  renderApp();
}

function renderBanner() {
  if (!alertBanner) return '';
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  return `
    <div class="mb-4 px-4 py-3 rounded-xl border flex items-center justify-between text-xs font-medium shadow-sm ${styles[alertBanner.type] || styles.info}">
      <span>${alertBanner.text}</span>
      <button onclick="alertBanner=null;renderApp()" class="ml-4 underline opacity-75 hover:opacity-100">Dismiss</button>
    </div>
  `;
}

function renderTopHeader() {
  const u = appState.currentUser;
  if (!u && currentView === 'login') {
    return ''; // Clean full-screen split view on Login Page matching reference image
  }
  return `
    <header class="border-b border-slate-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <img src="busamed-logo.png" alt="Busamed" class="h-9 w-auto object-contain rounded" />
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm tracking-tight text-slate-900">BUSAMED HILLCREST PRIVATE HOSPITAL</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Theatre Charging System • v1.0
            </span>
          </div>
          <p class="text-xs text-slate-500">Master-Data Driven Operating Theatre Web Application</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        ${u ? `
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="font-semibold">${u.fullName}</span>
            <span class="text-slate-400">|</span>
            <span class="font-mono text-[11px] text-slate-500">${u.employeeNumber}</span>
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${u.role === 'Administrator' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}">
              ${u.role}
            </span>
          </div>
          <button onclick="trySwitchDashboardView('${u.role === 'Administrator' ? 'nurse' : 'admin'}')"
            title="Test Role-Based Access Control (RBAC) enforcement"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-100">
            Test RBAC Guard (${u.role === 'Administrator' ? 'Nurse View' : 'Admin View'})
          </button>
          <button onclick="handleLogout()"
            class="px-3.5 py-1.5 rounded-lg bg-[#141a23] hover:bg-slate-800 text-white text-xs font-semibold">
            Sign Out
          </button>
        ` : ''}
      </div>
    </header>
  `;
}

/**
 * Split-Screen Login Page matching user's reference layout + Busamed Logo on right side
 */
function renderLoginView() {
  const q = LOGIN_QUOTES[loginQuoteIndex];

  return `
    <div class="min-h-screen w-full bg-white text-slate-900 grid grid-cols-1 lg:grid-cols-2">
      <!-- Left Column: Login Form -->
      <div class="flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-8">
        <!-- Top Spacer / Hospital Mini Badge -->
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span class="font-semibold text-slate-700 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-700"></span>
            Busamed Hillcrest Private Hospital
          </span>
          <button onclick="appState=resetDemoState();showBanner('info','Demo accounts & master data reset to defaults.')"
            class="hover:text-slate-700 underline">
            Reset Demo Data
          </button>
        </div>

        <!-- Centered Form Block -->
        <div class="w-full max-w-[360px] mx-auto my-auto py-6">
          ${renderBanner()}

          <!-- Top Pill Switcher: Login | Sign Up -->
          <div class="flex justify-center mb-7">
            <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button type="button"
                onclick="loginTabMode='login';renderApp()"
                class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  loginTabMode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </button>
              <button type="button"
                onclick="loginTabMode='signup';renderApp()"
                class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  loginTabMode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign Up
              </button>
            </div>
          </div>

          ${loginTabMode === 'login' ? `
            <!-- Heading -->
            <div class="text-center mb-7">
              <h1 class="text-2xl font-bold tracking-tight text-slate-900">Welcome!</h1>
              <p class="text-xs text-slate-500 mt-1.5">Please enter your details to login.</p>
            </div>

            <!-- Main Login Form -->
            <form onsubmit="handleLoginSubmit(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1.5">Email address or Username</label>
                <input id="login-username" type="text" required
                  placeholder="Enter your email address or username"
                  value="admin.hillcrest@busamed.co.za"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-medium text-slate-700">Password</label>
                  <button type="button"
                    onclick="showBanner('info', 'Password resets are managed by the Theatre Administrator in User Master (Section 4.1). Demo passwords: Admin@2026 or Nurse@2026.')"
                    class="text-xs font-semibold text-slate-800 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div class="relative">
                  <input id="login-password" type="${showPasswordText ? 'text' : 'password'}" required
                    placeholder="Enter your password"
                    value="Admin@2026"
                    class="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
                  <button type="button"
                    onclick="showPasswordText=!showPasswordText;renderApp()"
                    title="Toggle password visibility"
                    class="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-700">
                    ${showPasswordText ? `
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ` : `
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                      </svg>
                    `}
                  </button>
                </div>
              </div>

              <button type="submit"
                class="w-full py-3 px-4 rounded-xl bg-[#141a23] hover:bg-[#1f2937] text-white font-semibold text-xs shadow-sm transition">
                Log In
              </button>
            </form>

            <!-- OR Divider -->
            <div class="relative my-6 flex items-center justify-center">
              <div class="border-t border-slate-200 w-full"></div>
              <span class="bg-white px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">OR</span>
              <div class="border-t border-slate-200 w-full"></div>
            </div>

            <!-- 4 Clean White Bordered Buttons matching the reference image -->
            <div class="space-y-2.5">
              <button type="button"
                onclick="fillAndLoginDemo('admin.hillcrest', 'Admin@2026')"
                class="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span class="w-4 h-4 rounded-full bg-blue-900 text-white text-[10px] font-bold flex items-center justify-center">A</span>
                Continue as Administrator (Sr. Thandi Nkosi)
              </button>

              <button type="button"
                onclick="fillAndLoginDemo('nurse.sarah', 'Nurse@2026')"
                class="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span class="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">N</span>
                Continue as Theatre Nurse (RN Sarah)
              </button>

              <button type="button"
                onclick="fillAndLoginDemo('nurse.zanele', 'Nurse@2026')"
                class="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span class="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">M</span>
                Continue as Maternity Nurse (RN Zanele)
              </button>

              <button type="button"
                onclick="fillAndLoginDemo('nurse.suspended', 'Nurse@2026')"
                class="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span class="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">!</span>
                Test Disabled Account Block (RN David)
              </button>
            </div>
          ` : `
            <!-- Sign Up / Request Nurse Account Tab -->
            <div class="text-center mb-6">
              <h1 class="text-2xl font-bold tracking-tight text-slate-900">Request Access</h1>
              <p class="text-xs text-slate-500 mt-1.5">Nurse accounts are provisioned by the Administrator in User Master.</p>
            </div>
            <form onsubmit="handleSignUpRequest(event)" class="space-y-3.5">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input id="signup-name" type="text" required placeholder="e.g. RN Lerato Sithole"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Employee Number</label>
                <input id="signup-emp" type="text" required placeholder="e.g. EMP-2150"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Theatre Department</label>
                <input id="signup-dept" type="text" required placeholder="e.g. Main Operating Theatre"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900" />
              </div>
              <button type="submit"
                class="w-full py-3 px-4 rounded-xl bg-[#141a23] hover:bg-[#1f2937] text-white font-semibold text-xs shadow-sm transition">
                Submit Request to Administrator
              </button>
            </form>
          `}
        </div>

        <!-- Bottom Footer Text -->
        <div class="text-center text-xs text-slate-500">
          ${loginTabMode === 'login' ? `
            Don't have an account yet?
            <button onclick="loginTabMode='signup';renderApp()" class="font-bold text-slate-900 underline ml-1">Sign up</button>
          ` : `
            Already have an account?
            <button onclick="loginTabMode='login';renderApp()" class="font-bold text-slate-900 underline ml-1">Log in</button>
          `}
        </div>
      </div>

      <!-- Right Column: Busamed Picture Panel with Frosted Glass Quote Card -->
      <div class="p-3 sm:p-5 flex">
        <div class="relative w-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-between p-8 min-h-[540px]"
          style="background: radial-gradient(circle at 50% 35%, #ffffff 0%, #f1f5f9 70%, #e2e8f0 100%);">

          <!-- Top subtle badge on image panel -->
          <div class="w-full flex items-center justify-between z-10">
            <span class="px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-sm">
              Busamed Hillcrest Private Hospital
            </span>
            <span class="px-3 py-1 rounded-full bg-[#0f294a] text-white text-[11px] font-semibold shadow-sm">
              Theatre Charging System
            </span>
          </div>

          <!-- Center Busamed Logo Image (Uploaded by User) -->
          <div class="my-auto py-8 flex items-center justify-center z-10">
            <div class="bg-white rounded-3xl p-8 sm:p-10 shadow-md border border-slate-100 flex items-center justify-center max-w-md w-full">
              <img src="busamed-logo.png" alt="BUSAMED Logo" class="w-full max-h-[260px] object-contain" />
            </div>
          </div>

          <!-- Bottom Frosted Glass Card (matching reference screenshot) -->
          <div class="w-full z-10 rounded-2xl p-6 text-white shadow-xl border border-white/20 backdrop-blur-md"
            style="background: linear-gradient(135deg, rgba(15, 41, 74, 0.88) 0%, rgba(15, 23, 42, 0.82) 100%);">
            <p class="text-sm sm:text-[15px] leading-relaxed font-normal text-white/95">
              ${q.quote}
            </p>
            <div class="mt-5 flex items-end justify-between gap-4">
              <div>
                <div class="text-base font-bold text-white">${q.author}</div>
                <div class="text-xs font-medium text-sky-200 mt-0.5">${q.role}</div>
                <div class="text-[11px] text-white/75 mt-0.5">${q.org}</div>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="cycleQuote(-1)"
                  title="Previous highlight"
                  class="w-8 h-8 rounded-full border border-white/25 hover:bg-white/15 flex items-center justify-center text-white transition">
                  ←
                </button>
                <button type="button" onclick="cycleQuote(1)"
                  title="Next highlight"
                  class="w-8 h-8 rounded-full border border-white/25 hover:bg-white/15 flex items-center justify-center text-white transition">
                  →
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

function renderAdminDashboard() {
  const activeUsersCount = appState.users.filter((u) => u.active).length;
  const submittedCount = appState.recentSubmissions.filter((s) => s.status === 'Submitted').length + 15;
  const pendingCount = appState.recentSubmissions.filter((s) => s.status === 'Pending').length;

  return `
    <div class="max-w-6xl mx-auto py-5 px-4 space-y-5">
      <!-- Admin Header & Sub-Navigation -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-700">Administrator Portal</span>
            <span class="text-xs text-slate-400">Section 2.1, 4.1 & 8</span>
          </div>
          <h1 class="text-lg font-bold mt-0.5 text-slate-900">Hospital Theatre Administration & Master Control</h1>
        </div>

        <div class="flex flex-wrap gap-1.5">
          ${[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'users', label: `User Master (${appState.users.length})` },
            { id: 'roles', label: 'User Roles & RBAC Matrix' },
            { id: 'modules', label: '8 Master Modules Status' },
            { id: 'audit', label: `Audit Logs (${appState.auditLogs.length})` }
          ].map((t) => `
            <button onclick="adminSubTab='${t.id}';renderApp()"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                adminSubTab === t.id
                  ? 'bg-[#141a23] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }">
              ${t.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- KPI Strip (Section 8 Dashboard) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500">Charge Sheets Completed Today</div>
          <div class="text-2xl font-bold mt-1 text-emerald-600">${submittedCount}</div>
          <div class="text-[11px] text-slate-400 mt-1">100% SAP Barcode Validated</div>
        </div>
        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500">Pending / Active Theatre Sheets</div>
          <div class="text-2xl font-bold mt-1 text-amber-500">${pendingCount}</div>
          <div class="text-[11px] text-slate-400 mt-1">Currently in progress on iPads</div>
        </div>
        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500">Theatre Utilisation Today</div>
          <div class="text-2xl font-bold mt-1 text-blue-600">83%</div>
          <div class="text-[11px] text-slate-400 mt-1">Across 6 Operating Theatres</div>
        </div>
        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500">User Master Accounts</div>
          <div class="text-2xl font-bold mt-1 text-slate-900">${activeUsersCount} <span class="text-xs font-normal text-slate-400">/ ${appState.users.length} Active</span></div>
          <div class="text-[11px] text-slate-400 mt-1">Admins & Theatre Nurses</div>
        </div>
      </div>

      ${adminSubTab === 'overview' ? renderAdminOverviewTab() : ''}
      ${adminSubTab === 'users' ? renderAdminUserMasterTab() : ''}
      ${adminSubTab === 'roles' ? renderAdminRolesTab() : ''}
      ${adminSubTab === 'modules' ? renderAdminMasterModulesTab() : ''}
      ${adminSubTab === 'audit' ? renderAdminAuditTab() : ''}
    </div>
  `;
}

function renderAdminOverviewTab() {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- Theatre Utilisation (Section 8) -->
      <div class="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-bold text-sm text-slate-900">Theatre Utilisation Statistics</h3>
            <p class="text-xs text-slate-500">Live daily activity across Busamed Hillcrest theatres</p>
          </div>
          <span class="text-xs font-mono text-blue-600">19 Nov 2026</span>
        </div>
        <div class="space-y-3">
          ${appState.theatreUtilisation.map((t) => `
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-semibold text-slate-800">${t.theatre}</span>
                <span class="font-mono text-slate-500">${t.cases} cases • <strong>${t.utilisation}%</strong></span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div class="h-full bg-blue-600 rounded-full" style="width:${t.utilisation}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Most Used SAP Items (Section 4.5 & 8) -->
      <div class="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-bold text-sm text-slate-900">Most Used SAP Items Today</h3>
            <p class="text-xs text-slate-500">Scanned via iPad camera barcode workflow</p>
          </div>
          <span class="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 font-semibold">SAP Sync Ready</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400">
                <th class="pb-2 font-semibold">SAP Code</th>
                <th class="pb-2 font-semibold">Description</th>
                <th class="pb-2 font-semibold">Category</th>
                <th class="pb-2 font-semibold text-right">Qty Used</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${appState.topSapItems.map((item) => `
                <tr>
                  <td class="py-2 font-mono font-semibold text-blue-600">${item.sapCode}</td>
                  <td class="py-2 font-medium text-slate-800">${item.description}</td>
                  <td class="py-2 text-slate-500">${item.category}</td>
                  <td class="py-2 text-right font-mono font-bold text-slate-900">${item.qtyToday} ${item.uom}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Submitted & Pending Charge Sheets -->
      <div class="lg:col-span-12 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-bold text-sm text-slate-900">Today's Theatre Charge Sheets (Submitted & Pending)</h3>
            <p class="text-xs text-slate-500">Real-time feed from operating theatre iPads</p>
          </div>
          <button onclick="adminSubTab='users';renderApp()" class="text-xs text-blue-600 font-semibold hover:underline">
            Manage Nurse Accounts →
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400">
                <th class="pb-2">Sheet #</th>
                <th class="pb-2">Theatre</th>
                <th class="pb-2">Charge Sheet & Procedure</th>
                <th class="pb-2">Surgeon / Anaesthetist</th>
                <th class="pb-2">Captured By</th>
                <th class="pb-2">Items</th>
                <th class="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${appState.recentSubmissions.map((s) => `
                <tr>
                  <td class="py-2.5 font-mono font-semibold text-slate-900">${s.sheetNumber}</td>
                  <td class="py-2.5 text-slate-800">${s.theatre}<div class="text-[11px] text-slate-400">${s.timeIn} - ${s.timeOut}</div></td>
                  <td class="py-2.5 font-semibold text-slate-900">${s.procedure}<div class="text-[11px] font-normal text-slate-400">${s.chargeSheet}</div></td>
                  <td class="py-2.5 text-slate-800">${s.surgeon}<div class="text-[11px] text-slate-400">${s.anaesthetist}</div></td>
                  <td class="py-2.5 text-slate-700">${s.nurse}</td>
                  <td class="py-2.5 font-mono text-slate-700">${s.sapItemsCount} SAP + ${s.additionalCount} Add.</td>
                  <td class="py-2.5 text-right">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      s.status === 'Submitted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }">${s.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAdminUserMasterTab() {
  return `
    <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="text-xs font-semibold text-blue-600">Section 4.1 • USER MASTER</span>
          <h3 class="font-bold text-base text-slate-900">System Users & Nurse Credentials Management</h3>
          <p class="text-xs text-slate-500">Create nurse accounts, assign roles, reset passwords, or disable access. Any new account created here can immediately log in.</p>
        </div>
        <button onclick="openCreateUserModal()"
          class="px-3.5 py-2 rounded-lg bg-[#141a23] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm">
          + Create New User
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400">
              <th class="pb-2">Employee #</th>
              <th class="pb-2">Full Name</th>
              <th class="pb-2">Username</th>
              <th class="pb-2">Department</th>
              <th class="pb-2">Role</th>
              <th class="pb-2">Active Status</th>
              <th class="pb-2">Last Login</th>
              <th class="pb-2 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${appState.users.map((u) => `
              <tr>
                <td class="py-2.5 font-mono font-semibold text-slate-900">${u.employeeNumber}</td>
                <td class="py-2.5 font-semibold text-slate-900">${u.fullName}</td>
                <td class="py-2.5 font-mono text-blue-600">${u.username}</td>
                <td class="py-2.5 text-slate-700">${u.department}</td>
                <td class="py-2.5">
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${
                    u.role === 'Administrator'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-teal-100 text-teal-700'
                  }">${u.role}</span>
                </td>
                <td class="py-2.5">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    u.active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }">${u.active ? 'Active' : 'Disabled'}</span>
                </td>
                <td class="py-2.5 font-mono text-[11px] text-slate-400">${u.lastLogin}</td>
                <td class="py-2.5 text-right space-x-1.5">
                  <button onclick="openEditUserModal('${u.id}')"
                    class="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700">
                    Edit
                  </button>
                  <button onclick="openResetPasswordModal('${u.id}')"
                    class="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700">
                    Reset Password
                  </button>
                  <button onclick="handleToggleUserStatus('${u.id}')"
                    class="px-2 py-1 rounded border ${
                      u.active
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }">
                    ${u.active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminRolesTab() {
  const matrix = [
    { feature: 'Login & Session Authentication', admin: true, nurse: true },
    { feature: 'User Master (Create / Edit / Disable Users & Reset Passwords)', admin: true, nurse: false },
    { feature: 'Charge Sheet Master (Add / Edit / Deactivate Templates)', admin: true, nurse: false },
    { feature: 'Procedure Master & Staff Master Configuration', admin: true, nurse: false },
    { feature: 'SAP Item Master, Item Categories & Additional Charges Setup', admin: true, nurse: false },
    { feature: 'Charge Sheet Configuration & Mandatory Rules Engine', admin: true, nurse: false },
    { feature: 'Complete Theatre Charge Sheets & Select Procedures/Staff', admin: false, nurse: true },
    { feature: 'Scan Consumable Barcodes via iPad Camera & Enter Quantities', admin: false, nurse: true },
    { feature: 'Hospital Reporting Suite & Security Audit Trail', admin: true, nurse: false }
  ];

  return `
    <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
      <div>
        <span class="text-xs font-semibold text-purple-600">Section 2.1, 2.2 & 4.1</span>
        <h3 class="font-bold text-base text-slate-900">Role Permission & Access Matrix</h3>
        <p class="text-xs text-slate-500">Enforced across all views and API actions.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400">
              <th class="pb-2">System Capability / Module</th>
              <th class="pb-2 text-center">Administrator (Full System Access)</th>
              <th class="pb-2 text-center">Nurse (Charge Sheet Capture Only)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${matrix.map((row) => `
              <tr>
                <td class="py-2.5 font-medium text-slate-800">${row.feature}</td>
                <td class="py-2.5 text-center font-bold ${row.admin ? 'text-emerald-600' : 'text-slate-400'}">${row.admin ? '✓ Allowed' : '—'}</td>
                <td class="py-2.5 text-center font-bold ${row.nurse ? 'text-emerald-600' : 'text-red-500'}">${row.nurse ? '✓ Allowed' : '✕ Restricted'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminMasterModulesTab() {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      ${appState.masterModulesSummary.map((m) => `
        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs">
              <span class="font-mono font-bold text-blue-600">Section ${m.code}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                m.phase === 1
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-50 text-blue-700'
              }">${m.status}</span>
            </div>
            <h4 class="font-bold text-sm mt-2 text-slate-900">${m.name}</h4>
            <p class="text-xs text-slate-500 mt-1">${m.desc}</p>
          </div>
          <div class="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="font-mono font-semibold text-slate-800">${m.count}</span>
            ${m.phase === 1 ? `
              <button onclick="adminSubTab='users';renderApp()" class="text-blue-600 font-semibold hover:underline">
                Open Module →
              </button>
            ` : `<span class="text-slate-400">Master Data Driven</span>`}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAdminAuditTab() {
  return `
    <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
      <div>
        <span class="text-xs font-semibold text-blue-600">Section 2.1 & Section 8 • Audit Trail</span>
        <h3 class="font-bold text-base text-slate-900">System Security & Activity Audit Logs</h3>
        <p class="text-xs text-slate-500">Every login, failed login, disabled-account block, password reset, and charge sheet action is recorded automatically.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400">
              <th class="pb-2">Timestamp</th>
              <th class="pb-2">User</th>
              <th class="pb-2">Role</th>
              <th class="pb-2">Action</th>
              <th class="pb-2">Details</th>
              <th class="pb-2 text-right">Outcome</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${appState.auditLogs.map((log) => `
              <tr>
                <td class="py-2 font-mono text-[11px] text-slate-500">${log.timestamp}</td>
                <td class="py-2 font-semibold text-slate-900">${log.user}</td>
                <td class="py-2 text-slate-700">${log.role}</td>
                <td class="py-2 font-semibold text-slate-900">${log.action}</td>
                <td class="py-2 text-slate-500">${log.details}</td>
                <td class="py-2 text-right">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    log.status === 'Success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }">${log.status}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderNurseDashboard() {
  const u = appState.currentUser;
  const mySubmissions = appState.recentSubmissions.filter((s) => s.status === 'Submitted');
  const myDrafts = appState.recentSubmissions.filter((s) => s.status === 'Pending');

  const categories = ['All', ...new Set(appState.chargeSheets.map((c) => c.category))];
  const filteredSheets = appState.chargeSheets.filter((c) => {
    const matchesQuery =
      !nurseSearchQuery ||
      c.name.toLowerCase().includes(nurseSearchQuery.toLowerCase()) ||
      c.procedures.some((p) => p.toLowerCase().includes(nurseSearchQuery.toLowerCase()));
    const matchesCat = nurseCategoryFilter === 'All' || c.category === nurseCategoryFilter;
    return c.active && matchesQuery && matchesCat;
  });

  return `
    <div class="max-w-6xl mx-auto py-5 px-4 space-y-5">
      <!-- Nurse iPad Clinical Banner -->
      <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-700">
              iPad Nurse Terminal • Charge Sheet Capture Mode
            </span>
            <span class="text-xs text-emerald-600 font-semibold">● Camera Barcode Scanner Ready</span>
          </div>
          <h1 class="text-lg font-bold mt-1 text-slate-900">Welcome, ${u.fullName}</h1>
          <p class="text-xs text-slate-500">${u.department} • Employee #: <span class="font-mono">${u.employeeNumber}</span></p>
        </div>

        <div class="flex flex-wrap gap-2">
          ${[
            { id: 'launch', label: `Select Charge Sheet (${appState.chargeSheets.length})` },
            { id: 'drafts', label: `Pending / Draft Sheets (${myDrafts.length})` },
            { id: 'submitted', label: `Submitted Today (${mySubmissions.length})` }
          ].map((tab) => `
            <button onclick="nurseSubTab='${tab.id}';renderApp()"
              class="touch-target px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                nurseSubTab === tab.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }">
              ${tab.label}
            </button>
          `).join('')}
        </div>
      </div>

      ${nurseSubTab === 'launch' ? `
        <div class="flex flex-wrap items-center justify-between gap-3">
          <input type="text"
            placeholder="Search 15 Charge Sheets or linked surgical procedures (e.g. Caesarian, Hip, CABG)..."
            value="${nurseSearchQuery}"
            oninput="nurseSearchQuery=this.value;renderApp()"
            class="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900" />
          <select onchange="nurseCategoryFilter=this.value;renderApp()"
            class="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900">
            ${categories.map((cat) => `<option value="${cat}" ${nurseCategoryFilter === cat ? 'selected' : ''}>Specialty: ${cat}</option>`).join('')}
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          ${filteredSheets.map((cs) => `
            <div class="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-500 transition shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-semibold text-teal-600">${cs.category}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">${cs.procedures.length} Procedures</span>
                </div>
                <h3 class="font-bold text-sm mt-1 text-slate-900">${cs.name}</h3>
                <div class="mt-2.5">
                  <div class="text-[11px] text-slate-400 font-semibold">Linked Procedures (Section 4.3):</div>
                  <div class="mt-1 flex flex-wrap gap-1">
                    ${cs.procedures.map((p) => `
                      <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">${p}</span>
                    `).join('')}
                  </div>
                </div>
                <div class="mt-2.5">
                  <div class="text-[11px] text-slate-400 font-semibold">Pre-linked Additional Charges (Section 4.7):</div>
                  <p class="text-[11px] text-slate-500 mt-0.5 truncate">${cs.additionalCharges.join(' • ')}</p>
                </div>
              </div>

              <button onclick="openNurseChargeSheetPreview('${cs.id}')"
                class="mt-4 w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs">
                Open Charge Sheet Template →
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${nurseSubTab === 'drafts' ? `
        <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h3 class="font-bold text-sm text-slate-900">Active / Pending Theatre Cases (Draft Functionality - Section 8)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${myDrafts.map((d) => `
              <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-xs text-slate-900">${d.sheetNumber}</span>
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">In Progress (${d.theatre})</span>
                </div>
                <div class="font-bold text-sm text-slate-900">${d.procedure}</div>
                <div class="text-xs text-slate-500">${d.chargeSheet} • Patient: ${d.patientRef}</div>
                <div class="text-xs text-slate-500">Surgeon: ${d.surgeon} • Anaesthetist: ${d.anaesthetist}</div>
                <div class="pt-2 flex items-center justify-between text-xs">
                  <span class="font-mono text-slate-700">${d.sapItemsCount} Scanned SAP Items</span>
                  <span class="text-teal-600 font-semibold">Ready for Phase 3 Capture</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${nurseSubTab === 'submitted' ? `
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 class="font-bold text-sm mb-3 text-slate-900">Submitted Theatre Charge Sheets Today</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400">
                  <th class="pb-2">Charge Sheet #</th>
                  <th class="pb-2">Theatre & Time</th>
                  <th class="pb-2">Template & Procedure</th>
                  <th class="pb-2">Surgeon</th>
                  <th class="pb-2">Captured Items</th>
                  <th class="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${mySubmissions.map((s) => `
                  <tr>
                    <td class="py-2.5 font-mono font-semibold text-slate-900">${s.sheetNumber}</td>
                    <td class="py-2.5 text-slate-700">${s.theatre} (${s.timeIn}-${s.timeOut})</td>
                    <td class="py-2.5 font-semibold text-slate-900">${s.procedure}<div class="text-[11px] font-normal text-slate-400">${s.chargeSheet}</div></td>
                    <td class="py-2.5 text-slate-700">${s.surgeon}</td>
                    <td class="py-2.5 font-mono text-slate-700">${s.sapItemsCount} SAP + ${s.additionalCount} Add.</td>
                    <td class="py-2.5 text-right">
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">Submitted</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderModals() {
  let html = '';

  if (editingUserModal) {
    html += `
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-slate-900">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm">${editingUserModal.id ? 'Edit User Account (User Master)' : 'Create New User Account (User Master)'}</h3>
            <button onclick="closeUserModal()" class="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
          </div>
          <form onsubmit="saveUserFromModal(event)" class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block font-semibold mb-1">Employee Number</label>
                <input id="um-emp" type="text" required value="${editingUserModal.employeeNumber}"
                  class="w-full px-2.5 py-2 rounded border border-slate-300 bg-white" />
              </div>
              <div>
                <label class="block font-semibold mb-1">Role (Section 4.1)</label>
                <select id="um-role" class="w-full px-2.5 py-2 rounded border border-slate-300 bg-white">
                  <option value="Nurse" ${editingUserModal.role === 'Nurse' ? 'selected' : ''}>Nurse (Charge Sheet Only)</option>
                  <option value="Administrator" ${editingUserModal.role === 'Administrator' ? 'selected' : ''}>Administrator (Full Access)</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-semibold mb-1">Full Name</label>
              <input id="um-name" type="text" required placeholder="e.g. RN Lerato Sithole" value="${editingUserModal.fullName}"
                class="w-full px-2.5 py-2 rounded border border-slate-300 bg-white" />
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block font-semibold mb-1">Username</label>
                <input id="um-user" type="text" required placeholder="e.g. nurse.lerato" value="${editingUserModal.username}"
                  class="w-full px-2.5 py-2 rounded border border-slate-300 bg-white" />
              </div>
              <div>
                <label class="block font-semibold mb-1">${editingUserModal.id ? 'New Password (optional)' : 'Initial Password'}</label>
                <input id="um-pass" type="text" ${editingUserModal.id ? '' : 'required'} value="${editingUserModal.password}"
                  placeholder="${editingUserModal.id ? 'Leave blank to keep' : 'Min 6 chars'}"
                  class="w-full px-2.5 py-2 rounded border border-slate-300 bg-white" />
              </div>
            </div>
            <div>
              <label class="block font-semibold mb-1">Department</label>
              <input id="um-dept" type="text" required value="${editingUserModal.department}"
                class="w-full px-2.5 py-2 rounded border border-slate-300 bg-white" />
            </div>
            <label class="flex items-center gap-2 pt-1">
              <input id="um-active" type="checkbox" ${editingUserModal.active ? 'checked' : ''} />
              <span class="font-semibold">Account Active (Allow Login)</span>
            </label>
            <div class="pt-3 flex justify-end gap-2 border-t border-slate-200">
              <button type="button" onclick="closeUserModal()" class="px-3 py-1.5 rounded border border-slate-300">Cancel</button>
              <button type="submit" class="px-3.5 py-1.5 rounded bg-[#141a23] text-white font-semibold">Save to User Master</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (resetPasswordModalUser) {
    html += `
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-5 space-y-3 shadow-xl text-xs text-slate-900">
          <h3 class="font-bold text-sm">Reset Password • ${resetPasswordModalUser.fullName}</h3>
          <p class="text-slate-500">Username: <span class="font-mono">${resetPasswordModalUser.username}</span></p>
          <form onsubmit="confirmResetPassword(event)" class="space-y-3">
            <div>
              <label class="block font-semibold mb-1">New Password</label>
              <input id="reset-pass-input" type="text" required value="Nurse@2026"
                class="w-full px-2.5 py-2 rounded border border-slate-300 bg-white" />
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" onclick="resetPasswordModalUser=null;renderApp()" class="px-3 py-1.5 rounded border border-slate-300">Cancel</button>
              <button type="submit" class="px-3 py-1.5 rounded bg-[#141a23] text-white font-semibold">Confirm Reset</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (selectedChargeSheetPreview) {
    const cs = selectedChargeSheetPreview;
    html += `
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl text-xs text-slate-900">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[11px] font-semibold text-teal-600">Master-Data Configured Template (Section 4.8)</span>
              <h3 class="font-bold text-base">${cs.name}</h3>
            </div>
            <button onclick="selectedChargeSheetPreview=null;renderApp()" class="text-slate-400 hover:text-slate-600">✕ Close</button>
          </div>
          <div class="space-y-3">
            <div class="p-3 rounded-lg bg-slate-50">
              <div class="font-semibold mb-1">Filtered Procedures Linked to this Sheet (Section 4.3):</div>
              <ul class="list-disc list-inside space-y-0.5 text-slate-600">
                ${cs.procedures.map((p) => `<li>${p}</li>`).join('')}
              </ul>
            </div>
            <div class="p-3 rounded-lg bg-slate-50">
              <div class="font-semibold mb-1">Mandatory Theatre Staff Fields (Section 4.4 & 4.8):</div>
              <div class="flex flex-wrap gap-1.5 mt-1">
                ${cs.mandatoryStaff.map((s) => `<span class="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold">${s}</span>`).join('')}
              </div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50">
              <div class="font-semibold mb-1">Pre-linked Additional Charges (Section 4.7):</div>
              <div class="flex flex-wrap gap-1.5 mt-1">
                ${cs.additionalCharges.map((a) => `<span class="px-2 py-0.5 rounded border border-slate-300 bg-white">${a}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <span class="text-slate-400">9-Step Capture Form unlocks in Phase 3</span>
            <button onclick="selectedChargeSheetPreview=null;renderApp()" class="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold">
              Done Preview
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return html;
}

function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  if (currentView === 'login') {
    root.innerHTML = `
      ${renderLoginView()}
      ${renderModals()}
    `;
    return;
  }

  root.innerHTML = `
    <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      ${renderTopHeader()}
      <main class="flex-1">
        <div class="max-w-6xl mx-auto px-4 pt-3">
          ${renderBanner()}
        </div>
        ${currentView === 'admin' ? renderAdminDashboard() : ''}
        ${currentView === 'nurse' ? renderNurseDashboard() : ''}
      </main>
      ${renderModals()}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
