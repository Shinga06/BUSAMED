/**
 * Busamed Hillcrest Private Hospital - Theatre Charging System
 * Phase 2: Administrator Master screens
 *   Charge Sheet Master (4.2) - Procedure Master (4.3) - Staff Master (4.4)
 *   SAP Item Master (4.5)     - Additional Charge Master (4.7)
 * User Master (4.1) lives in app.js / auth.js.
 *
 * One generic engine (list + search + filter + paging + add/edit modal + activate/deactivate + CSV export)
 * is driven by the MASTER_CONFIGS table below, so each master only declares its columns, fields and rules.
 * Records are never deleted - they are deactivated - so historic charge sheets keep their references.
 */

const MASTER_PAGE_SIZE = 12;
let masterUi = {};      // per-master UI state: { search, filter, status, page }
let masterModal = null; // { key, mode: 'add' | 'edit', id, values, error }

/* ------------------------------ helpers ------------------------------ */

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getMasterUi(key) {
  if (!masterUi[key]) masterUi[key] = { search: '', filter: 'all', status: 'all', page: 1 };
  return masterUi[key];
}

function sameText(a, b) {
  return String(a == null ? '' : a).trim().toLowerCase() === String(b == null ? '' : b).trim().toLowerCase();
}

function masterActor() {
  const u = appState.currentUser;
  return u ? `${u.fullName} (${u.employeeNumber})` : 'Administrator';
}

function requireAdmin() {
  if (!appState.currentUser || appState.currentUser.role !== 'Administrator') {
    showBanner('error', 'Access Denied: Master Data can only be changed by an Administrator.');
    return false;
  }
  return true;
}

function findChargeSheet(id) {
  return appState.masters.chargeSheets.find((c) => c.id === id);
}

function findItemCategory(id) {
  return appState.masters.itemCategories.find((c) => c.id === id);
}

function activeBadge(active) {
  return active
    ? '<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">Active</span>'
    : '<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0f294a] text-white">Inactive</span>';
}

function chipList(names, max = 3) {
  if (!names.length) return '<span class="text-blue-400">—</span>';
  const shown = names.slice(0, max).map((n) =>
    `<span class="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[11px] text-[#0f294a]">${esc(n)}</span>`
  ).join(' ');
  const more = names.length > max
    ? ` <span class="text-[11px] font-semibold text-blue-700" title="${esc(names.slice(max).join(', '))}">+${names.length - max} more</span>`
    : '';
  return `<div class="flex flex-wrap gap-1 items-center">${shown}${more}</div>`;
}

function nextMasterId(prefix, list) {
  let max = 0;
  list.forEach((r) => {
    const n = parseInt(String(r.id).split('-')[1], 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return `${prefix}-${max + 1}`;
}

function chargeSheetOptions(currentIds = []) {
  return appState.masters.chargeSheets
    .filter((c) => c.active || currentIds.includes(c.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: c.id, label: c.name + (c.active ? '' : ' (inactive)') }));
}

function categoryOptions(currentId) {
  return appState.masters.itemCategories
    .filter((c) => c.active || c.id === currentId)
    .map((c) => ({ value: c.id, label: c.name }));
}

/* ------------------------------ master definitions ------------------------------ */

const MASTER_CONFIGS = {
  chargeSheets: {
    title: 'Charge Sheet Master',
    singular: 'Charge Sheet',
    section: '4.2',
    blurb: 'Theatre charge sheet templates that nurses pick in Step 2. Add a template here and it appears on every iPad immediately.',
    prefix: 'cs',
    collection: () => appState.masters.chargeSheets,
    label: (r) => r.name,
    searchText: (r) => [r.code, r.name, r.specialty, r.description].join(' '),
    sort: (a, b) => a.name.localeCompare(b.name),
    filter: {
      label: 'Specialty',
      options: () => [...new Set(appState.masters.chargeSheets.map((c) => c.specialty))].sort().map((s) => ({ value: s, label: s })),
      match: (r, v) => r.specialty === v
    },
    columns: [
      { label: 'Code', cell: (r) => `<span class="font-mono font-semibold">${esc(r.code)}</span>` },
      { label: 'Charge Sheet', cell: (r) => `<span class="font-semibold">${esc(r.name)}</span>${r.description ? `<div class="text-[11px] text-blue-700">${esc(r.description)}</div>` : ''}` },
      { label: 'Specialty', cell: (r) => esc(r.specialty) },
      {
        label: 'Procedures',
        cell: (r) => {
          const all = appState.masters.procedures.filter((p) => p.chargeSheetId === r.id);
          return `<span class="font-mono">${all.filter((p) => p.active).length}</span><span class="text-blue-400"> / ${all.length}</span>`;
        }
      },
      {
        label: 'Add. Charges',
        cell: (r) => {
          const all = appState.masters.additionalCharges.filter((a) => a.chargeSheetIds.includes(r.id));
          return `<span class="font-mono">${all.filter((a) => a.active).length}</span><span class="text-blue-400"> / ${all.length}</span>`;
        }
      }
    ],
    fields: [
      { id: 'code', label: 'Code', type: 'text', required: true, upper: true, maxlength: 10, placeholder: 'e.g. CAES', help: 'Short unique code.' },
      { id: 'active', label: 'Active (visible to nurses)', type: 'checkbox' },
      { id: 'name', label: 'Charge Sheet Name', type: 'text', required: true, full: true, placeholder: 'e.g. Caesarian Charge Sheet' },
      { id: 'specialty', label: 'Specialty', type: 'text', required: true, full: true, placeholder: 'e.g. Maternity & Obstetrics', datalist: () => [...new Set(appState.masters.chargeSheets.map((c) => c.specialty))].sort() },
      { id: 'description', label: 'Description', type: 'textarea', full: true, placeholder: 'Optional notes for administrators' }
    ],
    defaults: () => ({ code: '', name: '', specialty: '', description: '', active: true, mandatoryStaff: ['Surgeon 1', 'Anaesthetist'] }),
    validate: (v, id) => {
      const list = appState.masters.chargeSheets.filter((c) => c.id !== id);
      if (list.some((c) => sameText(c.code, v.code))) return `Code "${v.code}" is already used by another charge sheet.`;
      if (list.some((c) => sameText(c.name, v.name))) return `A charge sheet named "${v.name}" already exists.`;
      return null;
    },
    deactivateWarning: (r) => {
      const n = appState.masters.procedures.filter((p) => p.chargeSheetId === r.id && p.active).length;
      return `Nurses will no longer see this template or its ${n} active procedure(s).`;
    },
    csvHead: ['Code', 'Charge Sheet', 'Specialty', 'Description', 'Status'],
    csvRow: (r) => [r.code, r.name, r.specialty, r.description, r.active ? 'Active' : 'Inactive']
  },

  procedures: {
    title: 'Procedure Master',
    singular: 'Procedure',
    section: '4.3',
    blurb: 'Surgical procedures. Each procedure belongs to one charge sheet, so nurses only see the procedures that match the template they chose.',
    prefix: 'pr',
    collection: () => appState.masters.procedures,
    label: (r) => r.name,
    searchText: (r) => {
      const cs = findChargeSheet(r.chargeSheetId);
      return [r.name, cs ? cs.name : '', cs ? cs.code : ''].join(' ');
    },
    sort: (a, b) => {
      const ca = findChargeSheet(a.chargeSheetId), cb = findChargeSheet(b.chargeSheetId);
      return (ca ? ca.name : '').localeCompare(cb ? cb.name : '') || a.name.localeCompare(b.name);
    },
    filter: {
      label: 'Charge Sheet',
      options: () => appState.masters.chargeSheets.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.id, label: c.name })),
      match: (r, v) => r.chargeSheetId === v
    },
    columns: [
      { label: 'Procedure', cell: (r) => `<span class="font-semibold">${esc(r.name)}</span>` },
      {
        label: 'Charge Sheet',
        cell: (r) => {
          const cs = findChargeSheet(r.chargeSheetId);
          return cs ? `${esc(cs.name)} <span class="font-mono text-[11px] text-blue-700">(${esc(cs.code)})</span>` : '<span class="text-blue-400">Unlinked</span>';
        }
      }
    ],
    fields: [
      { id: 'name', label: 'Procedure Name', type: 'text', required: true, full: true, placeholder: 'e.g. Elective Caesarian Section' },
      { id: 'chargeSheetId', label: 'Linked Charge Sheet', type: 'select', required: true, full: true, options: (v) => chargeSheetOptions([v.chargeSheetId]), help: 'Only active charge sheets can be chosen.' },
      { id: 'active', label: 'Active (visible to nurses)', type: 'checkbox' }
    ],
    defaults: (ui) => ({ name: '', chargeSheetId: ui.filter !== 'all' ? ui.filter : '', active: true }),
    validate: (v, id) => {
      const clash = appState.masters.procedures.some((p) => p.id !== id && p.chargeSheetId === v.chargeSheetId && sameText(p.name, v.name));
      return clash ? `"${v.name}" already exists under that charge sheet.` : null;
    },
    csvHead: ['Procedure', 'Charge Sheet Code', 'Charge Sheet', 'Status'],
    csvRow: (r) => {
      const cs = findChargeSheet(r.chargeSheetId);
      return [r.name, cs ? cs.code : '', cs ? cs.name : '', r.active ? 'Active' : 'Inactive'];
    }
  },

  staff: {
    title: 'Staff Master',
    singular: 'Staff Member',
    section: '4.4',
    blurb: 'Theatre staff in 8 categories. Nurses pick staff from these searchable lists - free-text names are never allowed on a charge sheet.',
    prefix: 'st',
    collection: () => appState.masters.staff,
    label: (r) => `${r.fullName} (${r.staffNo})`,
    searchText: (r) => [r.staffNo, r.fullName, r.category, r.registrationNo].join(' '),
    sort: (a, b) => STAFF_CATEGORIES.indexOf(a.category) - STAFF_CATEGORIES.indexOf(b.category) || a.fullName.localeCompare(b.fullName),
    filter: {
      label: 'Category',
      options: () => STAFF_CATEGORIES.map((c) => ({ value: c, label: `${c} (${appState.masters.staff.filter((s) => s.category === c && s.active).length})` })),
      match: (r, v) => r.category === v
    },
    columns: [
      { label: 'Staff No', cell: (r) => `<span class="font-mono font-semibold">${esc(r.staffNo)}</span>` },
      { label: 'Full Name', cell: (r) => `<span class="font-semibold">${esc(r.fullName)}</span>` },
      { label: 'Category', cell: (r) => esc(r.category) },
      { label: 'Registration No', cell: (r) => r.registrationNo ? `<span class="font-mono text-[11px]">${esc(r.registrationNo)}</span>` : '<span class="text-blue-400">—</span>' }
    ],
    fields: [
      { id: 'staffNo', label: 'Staff Number', type: 'text', required: true, upper: true, maxlength: 12, placeholder: 'e.g. ST-0050' },
      { id: 'category', label: 'Staff Category', type: 'select', required: true, options: () => STAFF_CATEGORIES.map((c) => ({ value: c, label: c })) },
      { id: 'fullName', label: 'Full Name', type: 'text', required: true, full: true, placeholder: 'e.g. Dr. J. Smith' },
      { id: 'registrationNo', label: 'Practice / Registration No.', type: 'text', maxlength: 20, placeholder: 'Optional' },
      { id: 'active', label: 'Active (selectable by nurses)', type: 'checkbox' }
    ],
    defaults: (ui) => ({ staffNo: nextStaffNo(), fullName: '', category: ui.filter !== 'all' ? ui.filter : '', registrationNo: '', active: true }),
    validate: (v, id) => {
      const list = appState.masters.staff.filter((s) => s.id !== id);
      if (list.some((s) => sameText(s.staffNo, v.staffNo))) return `Staff number "${v.staffNo}" is already assigned.`;
      if (list.some((s) => s.category === v.category && sameText(s.fullName, v.fullName))) return `${v.fullName} already exists in ${v.category}.`;
      return null;
    },
    csvHead: ['Staff No', 'Full Name', 'Category', 'Registration No', 'Status'],
    csvRow: (r) => [r.staffNo, r.fullName, r.category, r.registrationNo, r.active ? 'Active' : 'Inactive']
  },

  sapItems: {
    title: 'SAP Item Master',
    singular: 'SAP Item',
    section: '4.5',
    blurb: 'Billable consumables, each with a unique SAP code and barcode. Barcode scanning is built in a later phase and will read from this list.',
    prefix: 'sap',
    collection: () => appState.masters.sapItems,
    label: (r) => `${r.sapCode} ${r.description}`,
    searchText: (r) => {
      const cat = findItemCategory(r.categoryId);
      return [r.sapCode, r.description, r.barcode, cat ? cat.name : '', r.uom].join(' ');
    },
    sort: (a, b) => a.description.localeCompare(b.description),
    filter: {
      label: 'Category',
      options: () => appState.masters.itemCategories.map((c) => ({ value: c.id, label: c.name })),
      match: (r, v) => r.categoryId === v
    },
    columns: [
      { label: 'SAP Code', cell: (r) => `<span class="font-mono font-semibold text-blue-700">${esc(r.sapCode)}</span>` },
      { label: 'Description', cell: (r) => `<span class="font-semibold">${esc(r.description)}</span>` },
      { label: 'Category', cell: (r) => { const c = findItemCategory(r.categoryId); return c ? esc(c.name) : '<span class="text-blue-400">—</span>'; } },
      { label: 'UoM', cell: (r) => esc(r.uom) },
      { label: 'Barcode', cell: (r) => r.barcode ? `<span class="font-mono text-[11px]">${esc(r.barcode)}</span>` : '<span class="text-blue-400">Not set</span>' }
    ],
    fields: [
      { id: 'sapCode', label: 'Unique SAP Code', type: 'text', required: true, maxlength: 18, placeholder: 'e.g. 300071316', help: 'Digits only (4-18).' },
      { id: 'barcode', label: 'Barcode', type: 'text', maxlength: 14, placeholder: 'Optional, 8-14 digits', help: 'Must be unique if entered.' },
      { id: 'description', label: 'Description', type: 'text', required: true, full: true, placeholder: 'e.g. Diprivan 20ml' },
      { id: 'categoryId', label: 'Item Category', type: 'select', required: true, options: (v) => categoryOptions(v.categoryId) },
      { id: 'uom', label: 'Unit of Measure', type: 'select', required: true, options: () => UNITS_OF_MEASURE.map((u) => ({ value: u, label: u })) },
      { id: 'active', label: 'Active (billable)', type: 'checkbox' }
    ],
    defaults: (ui) => ({ sapCode: '', barcode: '', description: '', categoryId: ui.filter !== 'all' ? ui.filter : '', uom: 'Each', active: true }),
    validate: (v, id) => {
      if (!/^\d{4,18}$/.test(v.sapCode)) return 'SAP Code must contain digits only (4 to 18 digits).';
      if (v.barcode && !/^\d{8,14}$/.test(v.barcode)) return 'Barcode must be 8 to 14 digits.';
      const list = appState.masters.sapItems.filter((s) => s.id !== id);
      if (list.some((s) => s.sapCode === v.sapCode)) return `SAP Code ${v.sapCode} already exists.`;
      if (v.barcode && list.some((s) => s.barcode === v.barcode)) return `Barcode ${v.barcode} is already assigned to another item.`;
      return null;
    },
    csvHead: ['SAP Code', 'Description', 'Category', 'Unit of Measure', 'Barcode', 'Status'],
    csvRow: (r) => { const c = findItemCategory(r.categoryId); return [r.sapCode, r.description, c ? c.name : '', r.uom, r.barcode, r.active ? 'Active' : 'Inactive']; }
  },

  additionalCharges: {
    title: 'Additional Charge Master',
    singular: 'Additional Charge',
    section: '4.7',
    blurb: 'Non-barcoded billable items such as Oxygen in Theatre or Bone Cement. Link each charge to the templates that may use it.',
    prefix: 'ac',
    collection: () => appState.masters.additionalCharges,
    label: (r) => r.name,
    searchText: (r) => [r.name, r.uom, ...r.chargeSheetIds.map((id) => (findChargeSheet(id) || {}).name || '')].join(' '),
    sort: (a, b) => a.name.localeCompare(b.name),
    filter: {
      label: 'Charge Sheet',
      options: () => appState.masters.chargeSheets.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.id, label: c.name })),
      match: (r, v) => r.chargeSheetIds.includes(v)
    },
    columns: [
      { label: 'Additional Charge', cell: (r) => `<span class="font-semibold">${esc(r.name)}</span>` },
      { label: 'Unit', cell: (r) => esc(r.uom) },
      { label: 'Linked Charge Sheets', cell: (r) => chipList(r.chargeSheetIds.map((id) => (findChargeSheet(id) || { name: 'Unknown' }).name)) }
    ],
    fields: [
      { id: 'name', label: 'Charge Name', type: 'text', required: true, full: true, placeholder: 'e.g. Oxygen In Theatre' },
      { id: 'uom', label: 'Unit of Measure', type: 'select', required: true, options: () => UNITS_OF_MEASURE.map((u) => ({ value: u, label: u })) },
      { id: 'active', label: 'Active (selectable by nurses)', type: 'checkbox' },
      { id: 'chargeSheetIds', label: 'Linked Charge Sheets', type: 'multi', required: true, full: true, options: (v) => chargeSheetOptions(v.chargeSheetIds || []) }
    ],
    defaults: (ui) => ({ name: '', uom: 'Each', chargeSheetIds: ui.filter !== 'all' ? [ui.filter] : [], active: true }),
    validate: (v, id) => {
      return appState.masters.additionalCharges.some((a) => a.id !== id && sameText(a.name, v.name))
        ? `An additional charge named "${v.name}" already exists. Edit it to link more charge sheets.` : null;
    },
    csvHead: ['Additional Charge', 'Unit', 'Linked Charge Sheets', 'Status'],
    csvRow: (r) => [r.name, r.uom, r.chargeSheetIds.map((id) => (findChargeSheet(id) || {}).name || '').join('; '), r.active ? 'Active' : 'Inactive']
  }
};

function nextStaffNo() {
  let max = 0;
  appState.masters.staff.forEach((s) => {
    const m = /(\d+)$/.exec(s.staffNo);
    if (m && parseInt(m[1], 10) > max) max = parseInt(m[1], 10);
  });
  return 'ST-' + String(max + 1).padStart(4, '0');
}

/* ------------------------------ list data ------------------------------ */

function getMasterRows(key) {
  const cfg = MASTER_CONFIGS[key];
  const ui = getMasterUi(key);
  const q = ui.search.trim().toLowerCase();
  return cfg.collection().filter((r) => {
    if (ui.status === 'active' && !r.active) return false;
    if (ui.status === 'inactive' && r.active) return false;
    if (ui.filter !== 'all' && !cfg.filter.match(r, ui.filter)) return false;
    if (q && !cfg.searchText(r).toLowerCase().includes(q)) return false;
    return true;
  }).sort(cfg.sort);
}

/* ------------------------------ list UI actions ------------------------------ */

function setMasterSearch(key, value) {
  const ui = getMasterUi(key);
  ui.search = value;
  ui.page = 1;
  renderApp();
}

function setMasterFilter(key, value) {
  const ui = getMasterUi(key);
  ui.filter = value;
  ui.page = 1;
  renderApp();
}

function setMasterStatus(key, value) {
  const ui = getMasterUi(key);
  ui.status = value;
  ui.page = 1;
  renderApp();
}

function changeMasterPage(key, delta) {
  const ui = getMasterUi(key);
  ui.page = Math.max(1, ui.page + delta);
  renderApp();
}

function clearMasterFilters(key) {
  masterUi[key] = { search: '', filter: 'all', status: 'all', page: 1 };
  renderApp();
}

function exportMasterCsv(key) {
  const cfg = MASTER_CONFIGS[key];
  const rows = getMasterRows(key);
  const cell = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const lines = [cfg.csvHead.map(cell).join(',')].concat(rows.map((r) => cfg.csvRow(r).map(cell).join(',')));
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${key}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  addAuditEntry(appState, {
    user: masterActor(), role: 'Administrator', action: `Exported ${cfg.title}`,
    details: `Downloaded ${rows.length} record(s) as CSV`, status: 'Success'
  });
}

/* ------------------------------ add / edit modal ------------------------------ */

function openMasterModal(key, mode, id) {
  if (!requireAdmin()) return;
  const cfg = MASTER_CONFIGS[key];
  let values;
  if (mode === 'edit') {
    const row = cfg.collection().find((r) => r.id === id);
    if (!row) return;
    values = JSON.parse(JSON.stringify(row));
  } else {
    values = cfg.defaults(getMasterUi(key));
  }
  masterModal = { key, mode, id: id || null, values, error: null };
  renderApp();
}

function closeMasterModal() {
  masterModal = null;
  renderApp();
}

function masterMultiSelect(fieldId, checked) {
  document.querySelectorAll(`input[name="mf-${fieldId}"]`).forEach((box) => { box.checked = checked; });
}

function collectMasterForm(cfg) {
  const out = {};
  cfg.fields.forEach((f) => {
    if (f.type === 'checkbox') {
      out[f.id] = document.getElementById('mf-' + f.id).checked;
    } else if (f.type === 'multi') {
      out[f.id] = Array.from(document.querySelectorAll(`input[name="mf-${f.id}"]:checked`)).map((i) => i.value);
    } else {
      let v = (document.getElementById('mf-' + f.id).value || '').replace(/\s+/g, ' ').trim();
      if (f.upper) v = v.toUpperCase();
      out[f.id] = v;
    }
  });
  return out;
}

function validateMasterValues(cfg, values, editId) {
  for (const f of cfg.fields) {
    if (!f.required) continue;
    const v = values[f.id];
    if (f.type === 'multi' ? !v.length : !v) {
      return f.type === 'multi' ? `Select at least one value for "${f.label}".` : `"${f.label}" is required.`;
    }
  }
  return cfg.validate ? cfg.validate(values, editId) : null;
}

function saveMasterModal(event) {
  if (event) event.preventDefault();
  if (!masterModal || !requireAdmin()) return;
  const cfg = MASTER_CONFIGS[masterModal.key];
  const values = collectMasterForm(cfg);
  masterModal.values = Object.assign({}, masterModal.values, values);

  const error = validateMasterValues(cfg, values, masterModal.id);
  if (error) {
    masterModal.error = error;
    renderApp();
    return;
  }

  const list = cfg.collection();
  let row;
  if (masterModal.mode === 'edit') {
    row = list.find((r) => r.id === masterModal.id);
    Object.assign(row, values);
  } else {
    row = Object.assign({ id: nextMasterId(cfg.prefix, list) }, masterModal.values);
    list.push(row);
  }

  const verb = masterModal.mode === 'edit' ? 'Edited' : 'Created';
  addAuditEntry(appState, {
    user: masterActor(), role: 'Administrator', action: `${verb} ${cfg.singular} (${cfg.title})`,
    details: `${verb} "${cfg.label(row)}"`, status: 'Success'
  });
  saveState(appState);
  masterModal = null;
  showBanner('success', `${cfg.singular} "${cfg.label(row)}" ${masterModal === null && verb === 'Edited' ? 'updated' : 'created'}.`);
}

function toggleMasterActive(key, id) {
  if (!requireAdmin()) return;
  const cfg = MASTER_CONFIGS[key];
  const row = cfg.collection().find((r) => r.id === id);
  if (!row) return;
  const next = !row.active;
  if (!next) {
    const warn = cfg.deactivateWarning ? cfg.deactivateWarning(row) + '\n\n' : '';
    const ok = window.confirm(`Deactivate "${cfg.label(row)}"?\n\n${warn}Records are never deleted, so past charge sheets keep their history.`);
    if (!ok) return;
  }
  row.active = next;
  addAuditEntry(appState, {
    user: masterActor(), role: 'Administrator', action: `${next ? 'Activated' : 'Deactivated'} ${cfg.singular} (${cfg.title})`,
    details: `"${cfg.label(row)}" is now ${next ? 'ACTIVE' : 'INACTIVE'}`, status: 'Success'
  });
  saveState(appState);
  showBanner('info', `"${cfg.label(row)}" is now ${next ? 'active' : 'inactive'}.`);
}

/* ------------------------------ rendering ------------------------------ */

const FIELD_CLASS = 'w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-xs text-[#0f294a] focus:outline-none focus:border-[#0f294a] focus:ring-1 focus:ring-[#0f294a]';

function renderMasterField(f, values) {
  const id = 'mf-' + f.id;
  const v = values[f.id];
  const label = `<label class="block text-xs font-semibold mb-1 text-[#0f294a]" for="${id}">${esc(f.label)}${f.required ? ' <span class="text-blue-600">*</span>' : ''}</label>`;
  const help = f.help ? `<p class="text-[11px] text-blue-700 mt-1">${esc(f.help)}</p>` : '';
  let control = '';

  if (f.type === 'checkbox') {
    control = `<label class="flex items-center gap-2 text-xs font-semibold text-[#0f294a] pt-6">
      <input id="${id}" type="checkbox" class="w-4 h-4 accent-[#0f294a]" ${v ? 'checked' : ''} /> ${esc(f.label)}
    </label>`;
    return `<div class="${f.full ? 'col-span-2' : ''}">${control}</div>`;
  }

  if (f.type === 'textarea') {
    control = `<textarea id="${id}" rows="2" class="${FIELD_CLASS}" placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea>`;
  } else if (f.type === 'select') {
    const opts = f.options(values).map((o) =>
      `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
    control = `<select id="${id}" class="${FIELD_CLASS}"><option value="">Select...</option>${opts}</select>`;
  } else if (f.type === 'multi') {
    const chosen = v || [];
    const boxes = f.options(values).map((o) => `
      <label class="flex items-center gap-2 text-xs text-[#0f294a] py-0.5">
        <input type="checkbox" name="${id}" value="${esc(o.value)}" class="accent-[#0f294a]" ${chosen.includes(o.value) ? 'checked' : ''} />
        <span>${esc(o.label)}</span>
      </label>`).join('');
    control = `
      <div class="flex items-center justify-end gap-3 mb-1 text-[11px] font-semibold text-blue-700">
        <button type="button" onclick="masterMultiSelect('${f.id}', true)" class="hover:underline">Select all</button>
        <button type="button" onclick="masterMultiSelect('${f.id}', false)" class="hover:underline">Clear</button>
      </div>
      <div class="grid grid-cols-2 gap-x-3 max-h-44 overflow-y-auto p-2.5 rounded-lg border border-blue-200 bg-white">${boxes}</div>`;
  } else {
    const listAttr = f.datalist ? `list="dl-${f.id}"` : '';
    const dl = f.datalist ? `<datalist id="dl-${f.id}">${f.datalist().map((o) => `<option value="${esc(o)}"></option>`).join('')}</datalist>` : '';
    control = `<input id="${id}" type="text" ${listAttr} maxlength="${f.maxlength || 120}" class="${FIELD_CLASS}" placeholder="${esc(f.placeholder || '')}" value="${esc(v)}" />${dl}`;
  }
  return `<div class="${f.full ? 'col-span-2' : ''}">${label}${control}${help}</div>`;
}

function renderMasterModal() {
  if (!masterModal) return '';
  const cfg = MASTER_CONFIGS[masterModal.key];
  const editing = masterModal.mode === 'edit';
  return `
    <div class="fixed inset-0 bg-[#0f294a]/60 flex items-center justify-center p-4 z-50">
      <div class="bg-white border border-blue-200 rounded-xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-5 shadow-xl text-[#0f294a]">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <span class="text-[11px] font-semibold text-blue-600">Section ${cfg.section} - ${esc(cfg.title)}</span>
            <h3 class="font-bold text-base">${editing ? 'Edit' : 'Add'} ${esc(cfg.singular)}</h3>
          </div>
          <button type="button" onclick="closeMasterModal()" class="text-xs text-blue-700 hover:underline">Close</button>
        </div>
        ${masterModal.error ? `<div class="mb-3 px-3 py-2 rounded-lg border border-[#0f294a] bg-blue-50 text-xs font-medium">${esc(masterModal.error)}</div>` : ''}
        <form onsubmit="saveMasterModal(event)" class="grid grid-cols-2 gap-3">
          ${cfg.fields.map((f) => renderMasterField(f, masterModal.values)).join('')}
          <div class="col-span-2 flex justify-end gap-2 pt-3 border-t border-blue-100">
            <button type="button" onclick="closeMasterModal()" class="px-3.5 py-2 rounded-lg border border-blue-200 text-xs font-semibold hover:bg-blue-50">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-lg bg-[#0f294a] hover:bg-blue-900 text-white text-xs font-semibold">${editing ? 'Save Changes' : 'Create ' + esc(cfg.singular)}</button>
          </div>
        </form>
      </div>
    </div>`;
}

function renderMasterScreen(key) {
  const cfg = MASTER_CONFIGS[key];
  const ui = getMasterUi(key);
  const all = cfg.collection();
  const rows = getMasterRows(key);
  const pages = Math.max(1, Math.ceil(rows.length / MASTER_PAGE_SIZE));
  if (ui.page > pages) ui.page = pages;
  const start = (ui.page - 1) * MASTER_PAGE_SIZE;
  const pageRows = rows.slice(start, start + MASTER_PAGE_SIZE);
  const activeCount = all.filter((r) => r.active).length;
  const filtersOn = ui.search || ui.filter !== 'all' || ui.status !== 'all';

  const statusPills = [['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, text]) => `
    <button onclick="setMasterStatus('${key}','${val}')"
      class="px-3 py-1.5 text-xs font-semibold ${ui.status === val ? 'bg-[#0f294a] text-white' : 'bg-white text-[#0f294a] hover:bg-blue-50'}">${text}</button>`).join('');

  return `
    <div class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="max-w-2xl">
          <span class="text-xs font-semibold text-blue-600">SECTION ${cfg.section} - MASTER DATA</span>
          <h2 class="text-lg font-bold text-[#0f294a]">${esc(cfg.title)}</h2>
          <p class="text-xs text-blue-700 mt-0.5">${esc(cfg.blurb)}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="exportMasterCsv('${key}')" class="px-3.5 py-2 rounded-lg border border-blue-200 bg-white text-xs font-semibold text-[#0f294a] hover:bg-blue-50">Export CSV</button>
          <button onclick="openMasterModal('${key}','add')" class="px-3.5 py-2 rounded-lg bg-[#0f294a] hover:bg-blue-900 text-white text-xs font-semibold shadow-sm">+ Add ${esc(cfg.singular)}</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 max-w-md">
        <div class="p-3 rounded-xl bg-white border border-blue-200"><div class="text-[11px] text-blue-700">Total</div><div class="text-lg font-bold">${all.length}</div></div>
        <div class="p-3 rounded-xl bg-white border border-blue-200"><div class="text-[11px] text-blue-700">Active</div><div class="text-lg font-bold text-blue-600">${activeCount}</div></div>
        <div class="p-3 rounded-xl bg-white border border-blue-200"><div class="text-[11px] text-blue-700">Inactive</div><div class="text-lg font-bold">${all.length - activeCount}</div></div>
      </div>

      <div class="bg-white border border-blue-200 rounded-xl shadow-sm">
        <div class="p-3 flex flex-wrap items-center gap-2 border-b border-blue-100">
          <input id="ms-${key}" type="text" placeholder="Search ${esc(cfg.title.replace(' Master', '').toLowerCase())}..."
            value="${esc(ui.search)}" oninput="setMasterSearch('${key}', this.value)"
            class="flex-1 min-w-[200px] ${FIELD_CLASS}" />
          <select id="mfilter-${key}" onchange="setMasterFilter('${key}', this.value)" class="${FIELD_CLASS} !w-auto max-w-[240px]">
            <option value="all">All ${esc(cfg.filter.label)}s</option>
            ${cfg.filter.options().map((o) => `<option value="${esc(o.value)}" ${ui.filter === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
          </select>
          <div class="inline-flex rounded-lg border border-blue-200 overflow-hidden">${statusPills}</div>
          ${filtersOn ? `<button onclick="clearMasterFilters('${key}')" class="text-xs font-semibold text-blue-700 hover:underline">Clear</button>` : ''}
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-blue-100 text-blue-700 bg-blue-50/60">
                ${cfg.columns.map((c) => `<th class="px-3 py-2 font-semibold">${esc(c.label)}</th>`).join('')}
                <th class="px-3 py-2 font-semibold">Status</th>
                <th class="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-blue-100">
              ${pageRows.length ? pageRows.map((r) => `
                <tr class="${r.active ? '' : 'bg-blue-50/50 text-blue-700'}">
                  ${cfg.columns.map((c) => `<td class="px-3 py-2.5 align-top">${c.cell(r)}</td>`).join('')}
                  <td class="px-3 py-2.5 align-top">${activeBadge(r.active)}</td>
                  <td class="px-3 py-2.5 align-top text-right whitespace-nowrap space-x-1.5">
                    <button onclick="openMasterModal('${key}','edit','${r.id}')" class="px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">Edit</button>
                    <button onclick="toggleMasterActive('${key}','${r.id}')" class="px-2 py-1 rounded border ${r.active ? 'border-[#0f294a] text-[#0f294a]' : 'border-blue-300 text-blue-600'} hover:bg-blue-50">${r.active ? 'Deactivate' : 'Activate'}</button>
                  </td>
                </tr>`).join('') : `
                <tr><td colspan="${cfg.columns.length + 2}" class="px-3 py-10 text-center text-blue-700">
                  No ${esc(cfg.singular.toLowerCase())} records match your search.
                </td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="p-3 flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 text-xs text-blue-700">
          <span>${rows.length ? `Showing ${start + 1}-${Math.min(start + MASTER_PAGE_SIZE, rows.length)} of ${rows.length}` : 'Showing 0 of 0'}</span>
          <div class="flex items-center gap-2">
            <button ${ui.page <= 1 ? 'disabled' : ''} onclick="changeMasterPage('${key}', -1)" class="px-2.5 py-1 rounded border border-blue-200 ${ui.page <= 1 ? 'opacity-40' : 'hover:bg-blue-50'}">Previous</button>
            <span class="font-semibold text-[#0f294a]">Page ${ui.page} of ${pages}</span>
            <button ${ui.page >= pages ? 'disabled' : ''} onclick="changeMasterPage('${key}', 1)" class="px-2.5 py-1 rounded border border-blue-200 ${ui.page >= pages ? 'opacity-40' : 'hover:bg-blue-50'}">Next</button>
          </div>
        </div>
      </div>
    </div>`;
}

/* ------------------------------ admin shell (sidebar + content) ------------------------------ */

function renderMasterCards() {
  const cards = [
    { tab: 'users', title: 'User Master', section: '4.1', total: appState.users.length, active: appState.users.filter((u) => u.active).length },
    ...Object.entries(MASTER_CONFIGS).map(([key, cfg]) => ({
      tab: key, title: cfg.title, section: cfg.section,
      total: cfg.collection().length, active: cfg.collection().filter((r) => r.active).length
    }))
  ];
  const locked = [
    { title: 'Item Category Master', section: '4.6', note: `${appState.masters.itemCategories.length} categories seeded - screen comes next` },
    { title: 'Charge Sheet Configuration Master', section: '4.8', note: 'Rules engine - screen comes next' }
  ];
  return `
    <div>
      <h3 class="font-bold text-sm text-[#0f294a] mb-2">Master Data Modules</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${cards.map((c) => `
          <button onclick="adminSubTab='${c.tab}';renderApp()" class="text-left p-3.5 rounded-xl bg-white border border-blue-200 hover:border-[#0f294a] shadow-sm transition">
            <div class="text-[11px] font-mono font-bold text-blue-600">Section ${c.section}</div>
            <div class="font-bold text-sm text-[#0f294a] mt-1">${esc(c.title)}</div>
            <div class="mt-2 text-xs text-blue-700"><span class="text-lg font-bold text-[#0f294a]">${c.active}</span> active / ${c.total} total</div>
          </button>`).join('')}
        ${locked.map((c) => `
          <div class="p-3.5 rounded-xl bg-blue-50 border border-dashed border-blue-200">
            <div class="text-[11px] font-mono font-bold text-blue-400">Section ${c.section}</div>
            <div class="font-bold text-sm text-blue-700 mt-1">${esc(c.title)}</div>
            <div class="mt-2 text-xs text-blue-700">${esc(c.note)}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderAdminKpis() {
  const activeUsers = appState.users.filter((u) => u.active).length;
  const submitted = appState.recentSubmissions.filter((s) => s.status === 'Submitted').length + 15;
  const pending = appState.recentSubmissions.filter((s) => s.status === 'Pending').length;
  const kpi = (label, value, note, cls = 'text-blue-600') => `
    <div class="p-4 rounded-xl bg-white border border-blue-200 shadow-sm">
      <div class="text-xs text-blue-700">${label}</div>
      <div class="text-2xl font-bold mt-1 ${cls}">${value}</div>
      <div class="text-[11px] text-blue-400 mt-1">${note}</div>
    </div>`;
  return `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    ${kpi('Charge Sheets Completed Today', submitted, 'Submitted from theatre iPads')}
    ${kpi('Pending / Active Theatre Sheets', pending, 'Currently in progress', 'text-blue-500')}
    ${kpi('Theatre Utilisation Today', '83%', 'Across 6 Operating Theatres')}
    ${kpi('User Master Accounts', `${activeUsers} <span class="text-xs font-normal text-blue-400">/ ${appState.users.length} Active</span>`, 'Admins & Theatre Nurses', 'text-[#0f294a]')}
  </div>`;
}

function renderAdminContent() {
  if (adminSubTab === 'users') return renderAdminUserMasterTab();
  if (adminSubTab === 'roles') return renderAdminRolesTab();
  if (adminSubTab === 'audit') return renderAdminAuditTab();
  if (MASTER_CONFIGS[adminSubTab]) return renderMasterScreen(adminSubTab);
  return `<div class="space-y-5">${renderAdminKpis()}${renderMasterCards()}${renderAdminOverviewTab()}</div>`;
}

function renderAdminShell() {
  const navBtn = (id, label, count) => `
    <button onclick="adminSubTab='${id}';renderApp()"
      class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition ${
        adminSubTab === id ? 'bg-[#0f294a] text-white shadow-sm' : 'text-[#0f294a] hover:bg-blue-100'}">
      <span>${label}</span>${count !== undefined ? `<span class="px-1.5 py-0.5 rounded text-[10px] ${adminSubTab === id ? 'bg-white/20' : 'bg-blue-100 text-blue-700'}">${count}</span>` : ''}
    </button>`;
  const groupTitle = (t) => `<div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">${t}</div>`;
  const validTab = adminSubTab === 'overview' || adminSubTab === 'users' || adminSubTab === 'roles' || adminSubTab === 'audit' || MASTER_CONFIGS[adminSubTab];
  if (!validTab) adminSubTab = 'overview';

  return `
    <div class="max-w-7xl mx-auto py-5 px-4">
      <div class="mb-4">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">Administrator Portal</span>
          <span class="text-xs text-blue-400">Phase 2 - Admin Masters</span>
        </div>
        <h1 class="text-lg font-bold mt-0.5 text-[#0f294a]">Hospital Theatre Administration & Master Control</h1>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[236px_minmax(0,1fr)] gap-5 items-start">
        <nav class="bg-white border border-blue-200 rounded-xl p-2 shadow-sm lg:sticky lg:top-4">
          ${navBtn('overview', 'Dashboard')}
          ${groupTitle('Master Data')}
          ${navBtn('users', 'User Master', appState.users.length)}
          ${navBtn('chargeSheets', 'Charge Sheet Master', appState.masters.chargeSheets.length)}
          ${navBtn('procedures', 'Procedure Master', appState.masters.procedures.length)}
          ${navBtn('staff', 'Staff Master', appState.masters.staff.length)}
          ${navBtn('sapItems', 'SAP Item Master', appState.masters.sapItems.length)}
          ${navBtn('additionalCharges', 'Additional Charge Master', appState.masters.additionalCharges.length)}
          ${groupTitle('System')}
          ${navBtn('roles', 'Roles & Access')}
          ${navBtn('audit', 'Audit Logs', appState.auditLogs.length)}
        </nav>
        <section class="min-w-0">${renderAdminContent()}</section>
      </div>
    </div>`;
}

/* ------------------------------ nurse-side view of the masters ------------------------------ */

// Nurse screens read ONLY from master data: active templates, their active procedures and active additional charges.
function getChargeSheetViews() {
  const m = appState.masters;
  return m.chargeSheets.filter((c) => c.active).map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    category: c.specialty,
    active: true,
    procedures: m.procedures.filter((p) => p.chargeSheetId === c.id && p.active).map((p) => p.name),
    additionalCharges: m.additionalCharges.filter((a) => a.active && a.chargeSheetIds.includes(c.id)).map((a) => a.name),
    mandatoryStaff: c.mandatoryStaff || []
  }));
}
