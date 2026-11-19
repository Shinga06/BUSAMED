/**
 * Busamed Hillcrest Private Hospital - Theatre Charging System
 * Phase 1: Authentication Engine, RBAC Role Guards & User Master Operations
 */

function formatNow() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function addAuditEntry(state, { user, role, action, details, status = 'Success' }) {
  const entry = {
    id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: formatNow(),
    user,
    role,
    action,
    details,
    status
  };
  state.auditLogs.unshift(entry);
  saveState(state);
  return entry;
}

function authenticateUser(state, usernameInput, passwordInput) {
  const rawInput = (usernameInput || '').trim().toLowerCase();
  const normalizedUsername = rawInput.includes('@') ? rawInput.split('@')[0] : rawInput;
  const password = (passwordInput || '').trim();

  if (!rawInput || !password) {
    return {
      ok: false,
      code: 'MISSING_FIELDS',
      message: 'Please enter both your email/username and password.'
    };
  }

  const matchedUser = state.users.find(
    (u) => u.username.toLowerCase() === rawInput || u.username.toLowerCase() === normalizedUsername
  );

  if (!matchedUser) {
    addAuditEntry(state, {
      user: usernameInput,
      role: 'Unknown',
      action: 'Failed Login Attempt',
      details: `Unknown username/email "${usernameInput}" attempted login`,
      status: 'Denied'
    });
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password. Please verify your credentials with Theatre Administration.'
    };
  }

  if (matchedUser.password !== password) {
    addAuditEntry(state, {
      user: `${matchedUser.fullName} (${matchedUser.employeeNumber})`,
      role: matchedUser.role,
      action: 'Failed Login Attempt',
      details: 'Invalid password supplied for account',
      status: 'Denied'
    });
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password. Please verify your credentials with Theatre Administration.'
    };
  }

  if (!matchedUser.active) {
    addAuditEntry(state, {
      user: `${matchedUser.fullName} (${matchedUser.employeeNumber})`,
      role: matchedUser.role,
      action: 'Blocked Login (Disabled Account)',
      details: `Inactive user "${matchedUser.username}" attempted to sign in`,
      status: 'Blocked'
    });
    return {
      ok: false,
      code: 'ACCOUNT_DISABLED',
      message: `Account for ${matchedUser.fullName} (${matchedUser.employeeNumber}) is currently DISABLED in User Master. Please contact a System Administrator.`
    };
  }

  // Successful Authentication
  matchedUser.lastLogin = formatNow().slice(0, 16);
  state.currentUser = {
    id: matchedUser.id,
    employeeNumber: matchedUser.employeeNumber,
    fullName: matchedUser.fullName,
    username: matchedUser.username,
    department: matchedUser.department,
    role: matchedUser.role,
    loginTimestamp: matchedUser.lastLogin
  };

  addAuditEntry(state, {
    user: `${matchedUser.fullName} (${matchedUser.employeeNumber})`,
    role: matchedUser.role,
    action: 'User Login',
    details: `Authenticated successfully into ${matchedUser.role} Portal`,
    status: 'Success'
  });

  saveState(state);

  return {
    ok: true,
    user: state.currentUser,
    targetDashboard: matchedUser.role === 'Administrator' ? 'admin' : 'nurse'
  };
}

function logoutCurrentUser(state) {
  if (state.currentUser) {
    addAuditEntry(state, {
      user: `${state.currentUser.fullName} (${state.currentUser.employeeNumber})`,
      role: state.currentUser.role,
      action: 'User Logout',
      details: 'Signed out of Busamed Theatre Charging System',
      status: 'Success'
    });
  }
  state.currentUser = null;
  saveState(state);
}

function checkRoleAccess(state, targetRole) {
  if (!state.currentUser) {
    return { allowed: false, reason: 'NOT_AUTHENTICATED' };
  }
  if (state.currentUser.role !== targetRole) {
    addAuditEntry(state, {
      user: `${state.currentUser.fullName} (${state.currentUser.employeeNumber})`,
      role: state.currentUser.role,
      action: 'RBAC Access Blocked',
      details: `${state.currentUser.role} attempted to access restricted ${targetRole} view`,
      status: 'Blocked'
    });
    return {
      allowed: false,
      reason: 'ROLE_MISMATCH',
      message: `Access Denied: Your role (${state.currentUser.role}) does not have permission to access the ${targetRole} area.`
    };
  }
  return { allowed: true };
}

/**
 * Section 4.1 User Master CRUD Functions (Administrator Only)
 */
function createOrUpdateUser(state, payload) {
  const actor = state.currentUser
    ? `${state.currentUser.fullName} (${state.currentUser.employeeNumber})`
    : 'System Administrator';

  const empNo = (payload.employeeNumber || '').trim().toUpperCase();
  const fullName = (payload.fullName || '').trim();
  const username = (payload.username || '').trim().toLowerCase();
  const department = (payload.department || '').trim();
  const role = payload.role === 'Administrator' ? 'Administrator' : 'Nurse';
  const active = Boolean(payload.active);

  if (!empNo || !fullName || !username || !department) {
    return { ok: false, message: 'All user fields (Employee Number, Full Name, Username, Department) are mandatory.' };
  }

  const duplicateUser = state.users.find(
    (u) => u.id !== payload.id && (u.username.toLowerCase() === username || u.employeeNumber.toUpperCase() === empNo)
  );
  if (duplicateUser) {
    return {
      ok: false,
      message: `Duplicate record: Username "${username}" or Employee Number "${empNo}" is already assigned to ${duplicateUser.fullName}.`
    };
  }

  if (payload.id) {
    const existing = state.users.find((u) => u.id === payload.id);
    if (!existing) return { ok: false, message: 'User record not found.' };

    existing.employeeNumber = empNo;
    existing.fullName = fullName;
    existing.username = username;
    existing.department = department;
    existing.role = role;
    existing.active = active;
    if (payload.password && payload.password.trim()) {
      existing.password = payload.password.trim();
    }

    addAuditEntry(state, {
      user: actor,
      role: 'Administrator',
      action: 'Edited User (User Master)',
      details: `Updated ${existing.fullName} (${existing.employeeNumber}) — Role: ${existing.role}, Status: ${existing.active ? 'Active' : 'Disabled'}`,
      status: 'Success'
    });

    saveState(state);
    return { ok: true, user: existing, mode: 'updated' };
  } else {
    const password = (payload.password || '').trim();
    if (!password || password.length < 6) {
      return { ok: false, message: 'Please provide an initial password of at least 6 characters.' };
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      employeeNumber: empNo,
      fullName,
      username,
      password,
      department,
      role,
      active,
      lastLogin: 'Never'
    };

    state.users.unshift(newUser);

    addAuditEntry(state, {
      user: actor,
      role: 'Administrator',
      action: 'Created User (User Master)',
      details: `Created ${newUser.role} account for ${newUser.fullName} (${newUser.employeeNumber}) with username "${newUser.username}"`,
      status: 'Success'
    });

    saveState(state);
    return { ok: true, user: newUser, mode: 'created' };
  }
}

function toggleUserActiveStatus(state, userId) {
  const target = state.users.find((u) => u.id === userId);
  if (!target) return { ok: false, message: 'User not found.' };

  if (state.currentUser && state.currentUser.id === target.id) {
    return { ok: false, message: 'You cannot disable your own active Administrator session.' };
  }

  target.active = !target.active;

  const actor = state.currentUser
    ? `${state.currentUser.fullName} (${state.currentUser.employeeNumber})`
    : 'Administrator';

  addAuditEntry(state, {
    user: actor,
    role: 'Administrator',
    action: target.active ? 'Enabled User Account' : 'Disabled User Account',
    details: `${target.fullName} (${target.employeeNumber}) status changed to ${target.active ? 'ACTIVE' : 'DISABLED'}`,
    status: 'Success'
  });

  saveState(state);
  return { ok: true, user: target };
}

function resetUserPasswordByAdmin(state, userId, newPassword) {
  const target = state.users.find((u) => u.id === userId);
  if (!target) return { ok: false, message: 'User not found.' };

  const cleanPass = (newPassword || '').trim();
  if (cleanPass.length < 6) {
    return { ok: false, message: 'New password must be at least 6 characters.' };
  }

  target.password = cleanPass;

  const actor = state.currentUser
    ? `${state.currentUser.fullName} (${state.currentUser.employeeNumber})`
    : 'Administrator';

  addAuditEntry(state, {
    user: actor,
    role: 'Administrator',
    action: 'Password Reset (User Master)',
    details: `Reset password for ${target.fullName} (${target.username})`,
    status: 'Success'
  });

  saveState(state);
  return { ok: true, user: target };
}
