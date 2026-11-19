/**
 * Busamed Hillcrest Private Hospital - Theatre Charging System
 * Phase 1: Master Data Seed & Persistent State (Users, Roles, Dashboards, Audit Trail)
 */

const STORAGE_KEY = 'busamed_theatre_system_v1';

const INITIAL_STATE = {
  currentUser: null,
  users: [
    {
      id: 'usr-1',
      employeeNumber: 'EMP-1001',
      fullName: 'Sr. Thandi Nkosi',
      username: 'admin.hillcrest',
      password: 'Admin@2026',
      department: 'Theatre Administration & Billing',
      role: 'Administrator',
      active: true,
      lastLogin: '2026-11-19 07:15'
    },
    {
      id: 'usr-2',
      employeeNumber: 'EMP-1008',
      fullName: 'Johan Pretorius',
      username: 'johan.admin',
      password: 'Admin@2026',
      department: 'SAP & Inventory Control',
      role: 'Administrator',
      active: true,
      lastLogin: '2026-11-18 16:40'
    },
    {
      id: 'usr-3',
      employeeNumber: 'EMP-2045',
      fullName: 'RN Sarah van der Merwe',
      username: 'nurse.sarah',
      password: 'Nurse@2026',
      department: 'Main Operating Theatre (Theatres 1-4)',
      role: 'Nurse',
      active: true,
      lastLogin: '2026-11-19 08:02'
    },
    {
      id: 'usr-4',
      employeeNumber: 'EMP-2088',
      fullName: 'RN Zanele Dlamini',
      username: 'nurse.zanele',
      password: 'Nurse@2026',
      department: 'Maternity & Caesarian Theatre',
      role: 'Nurse',
      active: true,
      lastLogin: '2026-11-19 06:50'
    },
    {
      id: 'usr-5',
      employeeNumber: 'EMP-2092',
      fullName: 'RN Priya Naidoo',
      username: 'nurse.priya',
      password: 'Nurse@2026',
      department: 'Cardiac & Vascular Theatre',
      role: 'Nurse',
      active: true,
      lastLogin: '2026-11-19 07:30'
    },
    {
      id: 'usr-6',
      employeeNumber: 'EMP-2104',
      fullName: 'RN David Mokoena',
      username: 'nurse.suspended',
      password: 'Nurse@2026',
      department: 'Orthopaedic Theatre',
      role: 'Nurse',
      active: false,
      lastLogin: '2026-11-10 14:12'
    }
  ],

  rolePermissions: {
    Administrator: {
      badge: 'Full System Access',
      description: 'Maintains all 8 Master Data modules, manages nurse accounts & passwords, configures charge sheets, views audit logs, and generates hospital reports.',
      capabilities: [
        'Create, edit, disable users & reset passwords (User Master)',
        'Configure 15+ Charge Sheet templates & validation rules',
        'Maintain Procedure Master, Staff Master & SAP Item Master',
        'Maintain Item Category Master (21 categories) & Additional Charges',
        'Access Daily Theatre Activity, Item Usage, Charge Sheet & User Activity Reports',
        'Inspect security & activity Audit Trail'
      ]
    },
    Nurse: {
      badge: 'Charge Sheet Capture Access Only',
      description: 'Frontline iPad workflow for capturing theatre procedures, selecting surgical staff, scanning SAP consumable barcodes, and submitting verified charge sheets.',
      capabilities: [
        'Select from active Master-Data-Driven Charge Sheet templates',
        'Capture Theatre Number, Date, Time In & Time Out',
        'Select filtered Procedures & searchable Staff Master dropdowns',
        'Scan SAP Consumable Barcodes via iPad camera & enter quantities',
        'Capture pre-linked Additional Charges & save drafts / submit sheets',
        'Restricted from modifying master data, SAP codes, or user accounts'
      ]
    }
  },

  // Section 4.2: 15 Initial Charge Sheets from SRS
  chargeSheets: [
    {
      id: 'cs-1',
      name: 'Caesarian Charge Sheet',
      category: 'Maternity & Obstetrics',
      icon: 'baby',
      active: true,
      procedures: ['Elective Caesarian Section', 'Emergency Caesarian Section', 'Repeat Caesarian Section'],
      additionalCharges: ['Oxygen In Theatre', 'Ultane Per ml', 'Diprivan Infusion Used', 'Cord Clamp', 'Baby Consumables', 'Neonatal Consumables'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Midwife', 'Scrub Sister 1'],
      casesToday: 4
    },
    {
      id: 'cs-2',
      name: 'Arthroscopy Charge Sheet',
      category: 'Orthopaedics & Sports',
      icon: 'bone',
      active: true,
      procedures: ['Knee Arthroscopy & Meniscectomy', 'Shoulder Arthroscopy & Decompression', 'ACL Reconstruction'],
      additionalCharges: ['Arthroscopy Pump Tubing', 'Shaver Blade Consumables', 'Tourniquet Charge'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Scrub Sister 1', 'Floor Nurse 1'],
      casesToday: 2
    },
    {
      id: 'cs-3',
      name: 'Cardiac Charge Sheet',
      category: 'Cardiothoracic',
      icon: 'heart',
      active: true,
      procedures: ['CABG (Coronary Artery Bypass Graft)', 'Aortic Valve Replacement', 'Mitral Valve Repair'],
      additionalCharges: ['Perfusion Charges', 'Cardiac Packs', 'Cardiac Consumables', 'Cell Saver Set'],
      mandatoryStaff: ['Surgeon 1', 'Assistant 1', 'Anaesthetist', 'Scrub Sister 1', 'Anaesthetic Nurse'],
      casesToday: 1
    },
    {
      id: 'cs-4',
      name: 'Eye Charge Sheet',
      category: 'Ophthalmology',
      icon: 'eye',
      active: true,
      procedures: ['Cataract Phacoemulsification + IOL', 'Vitrectomy', 'Trabeculectomy'],
      additionalCharges: ['Microscope Drape', 'Phaco Cassette Pack', 'BSS Irrigation Solution'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Scrub Sister 1'],
      casesToday: 3
    },
    {
      id: 'cs-5',
      name: 'ENT Charge Sheet',
      category: 'Ear, Nose & Throat',
      icon: 'ear',
      active: true,
      procedures: ['Tonsillectomy & Adenoidectomy', 'Functional Endoscopic Sinus Surgery (FESS)', 'Myringotomy & Grommets'],
      additionalCharges: ['Coblation Wand', 'Microdebrider Blade', 'Oxygen In Theatre'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Scrub Sister 1'],
      casesToday: 2
    },
    {
      id: 'cs-6',
      name: 'General Charge Sheet',
      category: 'General Surgery',
      icon: 'activity',
      active: true,
      procedures: ['Appendectomy', 'Cholecystectomy', 'Hernia Repair', 'Laparotomy'],
      additionalCharges: ['Oxygen In Theatre', 'Ultane Per ml', 'Diathermy Pad & Pencil'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Scrub Sister 1', 'Floor Nurse 1'],
      casesToday: 3
    },
    {
      id: 'cs-7',
      name: 'GI Charge Sheet',
      category: 'Gastroenterology',
      icon: 'clipboard',
      active: true,
      procedures: ['Gastroscopy & Biopsy', 'Colonoscopy & Polypectomy', 'ERCP'],
      additionalCharges: ['CO2 Insufflation', 'Endoscopy Scope Reprocessing', 'Diprivan Infusion Used'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Floor Nurse 1'],
      casesToday: 2
    },
    {
      id: 'cs-8',
      name: 'Laparoscopic Charge Sheet',
      category: 'Minimally Invasive',
      icon: 'layers',
      active: true,
      procedures: ['Laparoscopic Cholecystectomy', 'Laparoscopic Appendectomy', 'Laparoscopic Nissen Fundoplication'],
      additionalCharges: ['CO2 Insufflation Gas', 'Trocar Seal Pack', 'Harmonic Scalpel Use'],
      mandatoryStaff: ['Surgeon 1', 'Assistant 1', 'Anaesthetist', 'Scrub Sister 1'],
      casesToday: 2
    },
    {
      id: 'cs-9',
      name: 'Neuro Spinal Surgery Charge Sheet',
      category: 'Neurosurgery & Spine',
      icon: 'cpu',
      active: true,
      procedures: ['Lumbar Microdiscectomy', 'Anterior Cervical Discectomy & Fusion (ACDF)', 'Craniotomy'],
      additionalCharges: ['Neuro Microscope Charge', 'High-Speed Burrs', 'Neuromonitoring Consumables'],
      mandatoryStaff: ['Surgeon 1', 'Assistant 1', 'Anaesthetist', 'Scrub Sister 1'],
      casesToday: 1
    },
    {
      id: 'cs-10',
      name: 'New GI Charge Sheet',
      category: 'Advanced GI Unit',
      icon: 'file-plus',
      active: true,
      procedures: ['Endoscopic Mucosal Resection', 'Banding of Oesophageal Varices', 'PEG Tube Insertion'],
      additionalCharges: ['Argon Plasma Coagulation', 'Diprivan Infusion Used', 'Oxygen In Theatre'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Scrub Sister 1'],
      casesToday: 1
    },
    {
      id: 'cs-11',
      name: 'Ortho Joint Replacement Charge Sheet',
      category: 'Arthroplasty',
      icon: 'shield',
      active: true,
      procedures: ['Total Hip Replacement', 'Total Knee Replacement', 'Revision Arthroplasty'],
      additionalCharges: ['Bone Cement', 'Orthopaedic Implants', 'Pulse Lavage Gun', 'Space Suit Hoods'],
      mandatoryStaff: ['Surgeon 1', 'Assistant 1', 'Anaesthetist', 'Scrub Sister 1', 'Floor Nurse 1'],
      casesToday: 2
    },
    {
      id: 'cs-12',
      name: 'Orthopaedic Charge Sheet',
      category: 'Trauma & Orthopaedics',
      icon: 'tool',
      active: true,
      procedures: ['ORIF Femur', 'ORIF Tibia', 'ORIF Distal Radius', 'Removal of Internal Fixation'],
      additionalCharges: ['Bone Cement', 'Orthopaedic Implants', 'K-Wires', 'Drill Bits', 'C-Arm Fluoroscopy Drape'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Scrub Sister 1', 'Floor Nurse 1'],
      casesToday: 2
    },
    {
      id: 'cs-13',
      name: 'Plastic Charge Sheet',
      category: 'Plastic & Reconstructive',
      icon: 'scissors',
      active: true,
      procedures: ['Split Thickness Skin Graft', 'Breast Reconstruction', 'Flap Repair'],
      additionalCharges: ['Dermatome Blade', 'Bipolar Forceps Single Use', 'Negative Pressure Dressing'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Scrub Sister 1'],
      casesToday: 1
    },
    {
      id: 'cs-14',
      name: 'Vascular Charge Sheet',
      category: 'Vascular Surgery',
      icon: 'git-branch',
      active: true,
      procedures: ['AV Fistula Creation', 'Femoro-Popliteal Bypass', 'Endovascular Aneurysm Repair (EVAR)'],
      additionalCharges: ['Heparin Flush Infusion', 'Vascular Graft Charge', 'Contrast Media'],
      mandatoryStaff: ['Surgeon 1', 'Assistant 1', 'Anaesthetist', 'Scrub Sister 1'],
      casesToday: 1
    },
    {
      id: 'cs-15',
      name: 'Urology Charge Sheet',
      category: 'Urology',
      icon: 'droplet',
      active: true,
      procedures: ['TURP (Transurethral Resection of Prostate)', 'Cystoscopy & JJ Stent Insertion', 'Laser Lithotripsy'],
      additionalCharges: ['Holmium Laser Fibre', 'Glycine / Saline Irrigation Bags', 'Resectoscope Loop'],
      mandatoryStaff: ['Surgeon 1', 'Anaesthetist', 'Scrub Sister 1'],
      casesToday: 2
    }
  ],

  // Recent Charge Sheet Submissions & Drafts
  recentSubmissions: [
    {
      sheetNumber: 'CS-2026-0894',
      patientRef: 'PT-94821 (M. Khumalo)',
      chargeSheet: 'Caesarian Charge Sheet',
      procedure: 'Elective Caesarian Section',
      theatre: 'Theatre 3 (Maternity)',
      date: '2026-11-19',
      timeIn: '07:30',
      timeOut: '08:45',
      surgeon: 'Dr. L. Mthembu',
      anaesthetist: 'Dr. R. Govender',
      nurse: 'RN Zanele Dlamini',
      nurseUsername: 'nurse.zanele',
      sapItemsCount: 14,
      additionalCount: 4,
      status: 'Submitted'
    },
    {
      sheetNumber: 'CS-2026-0893',
      patientRef: 'PT-94819 (A. Botha)',
      chargeSheet: 'Ortho Joint Replacement Charge Sheet',
      procedure: 'Total Knee Replacement',
      theatre: 'Theatre 2 (Ortho)',
      date: '2026-11-19',
      timeIn: '08:00',
      timeOut: '10:15',
      surgeon: 'Dr. C. van Wyk',
      anaesthetist: 'Dr. S. Pillay',
      nurse: 'RN Sarah van der Merwe',
      nurseUsername: 'nurse.sarah',
      sapItemsCount: 22,
      additionalCount: 5,
      status: 'Submitted'
    },
    {
      sheetNumber: 'CS-2026-0892',
      patientRef: 'PT-94815 (K. Maharaj)',
      chargeSheet: 'Cardiac Charge Sheet',
      procedure: 'CABG (Coronary Artery Bypass Graft)',
      theatre: 'Theatre 1 (Cardiac)',
      date: '2026-11-19',
      timeIn: '07:00',
      timeOut: '11:20',
      surgeon: 'Dr. P. Naicker',
      anaesthetist: 'Dr. M. Ndlovu',
      nurse: 'RN Priya Naidoo',
      nurseUsername: 'nurse.priya',
      sapItemsCount: 38,
      additionalCount: 6,
      status: 'Submitted'
    },
    {
      sheetNumber: 'CS-2026-0895-DRAFT',
      patientRef: 'PT-94829 (T. Cele)',
      chargeSheet: 'General Charge Sheet',
      procedure: 'Laparoscopic Cholecystectomy',
      theatre: 'Theatre 4 (General)',
      date: '2026-11-19',
      timeIn: '12:45',
      timeOut: '--:--',
      surgeon: 'Dr. G. Rossouw',
      anaesthetist: 'Dr. R. Govender',
      nurse: 'RN Sarah van der Merwe',
      nurseUsername: 'nurse.sarah',
      sapItemsCount: 9,
      additionalCount: 2,
      status: 'Pending'
    },
    {
      sheetNumber: 'CS-2026-0896-DRAFT',
      patientRef: 'PT-94833 (N. Zulu)',
      chargeSheet: 'Caesarian Charge Sheet',
      procedure: 'Emergency Caesarian Section',
      theatre: 'Theatre 3 (Maternity)',
      date: '2026-11-19',
      timeIn: '13:20',
      timeOut: '--:--',
      surgeon: 'Dr. L. Mthembu',
      anaesthetist: 'Dr. S. Pillay',
      nurse: 'RN Zanele Dlamini',
      nurseUsername: 'nurse.zanele',
      sapItemsCount: 11,
      additionalCount: 3,
      status: 'Pending'
    }
  ],

  // Top Used SAP Items (Section 4.5 & Section 8 Dashboard)
  topSapItems: [
    { sapCode: '300071316', description: 'Diprivan 20ml', category: 'Schedule Drugs', uom: 'Vial', qtyToday: 34 },
    { sapCode: '300085717', description: 'Cefazolin 1g', category: 'Antibiotics', uom: 'Vial', qtyToday: 29 },
    { sapCode: '300072090', description: 'Syringe 10ml', category: 'Syringes & Needles', uom: 'Each', qtyToday: 118 },
    { sapCode: '300094112', description: 'Vicryl 2-0 Absorbable Suture', category: 'Sutures', uom: 'Pack', qtyToday: 46 },
    { sapCode: '300061204', description: 'Ringer Lactate 1000ml', category: 'Intravenous Fluids', uom: 'Bag', qtyToday: 62 },
    { sapCode: '300058901', description: 'Sterile Surgical Gloves Size 7.5', category: 'Gloves', uom: 'Pair', qtyToday: 84 }
  ],

  // Theatre Utilisation Statistics (Section 6 & 8)
  theatreUtilisation: [
    { theatre: 'Theatre 1 (Cardiac & Vascular)', cases: 3, utilisation: 92, status: 'In Session' },
    { theatre: 'Theatre 2 (Orthopaedic & Joint)', cases: 5, utilisation: 88, status: 'In Session' },
    { theatre: 'Theatre 3 (Maternity / Caesarian)', cases: 6, utilisation: 85, status: 'In Session' },
    { theatre: 'Theatre 4 (General & Laparoscopic)', cases: 5, utilisation: 79, status: 'In Session' },
    { theatre: 'Theatre 5 (Neuro & Spinal)', cases: 2, utilisation: 72, status: 'Turnaround' },
    { theatre: 'Theatre 6 (Ophthalmology, ENT & GI)', cases: 8, utilisation: 81, status: 'In Session' }
  ],

  // 8 Master Modules Overview (Section 4)
  masterModulesSummary: [
    { code: '4.1', name: 'User Master', count: '6 Users', status: 'Live in Phase 1', phase: 1, desc: 'Create/edit/disable accounts, reset passwords & assign Admin/Nurse roles.' },
    { code: '4.2', name: 'Charge Sheet Master', count: '15 Templates', status: 'Seeded (Phase 2 CRUD)', phase: 2, desc: 'Caesarian, Cardiac, Ortho, GI, ENT, Neuro, Urology & 8 more templates.' },
    { code: '4.3', name: 'Procedure Master', count: '48 Procedures', status: 'Seeded (Phase 2 CRUD)', phase: 2, desc: 'Surgical procedures strictly linked to parent Charge Sheet templates.' },
    { code: '4.4', name: 'Staff Master', count: '64 Staff Members', status: 'Seeded (Phase 2 CRUD)', phase: 2, desc: '8 categories (Surgeons, Anaesthetists, Scrub Sisters, Midwives, etc.).' },
    { code: '4.5', name: 'SAP Item Master', count: '1,240 SAP Items', status: 'Seeded (Phase 2 CRUD)', phase: 2, desc: 'Unique SAP Codes, descriptions, categories, units of measure & barcodes.' },
    { code: '4.6', name: 'Item Category Master', count: '21 Categories', status: 'Seeded (Phase 2 CRUD)', phase: 2, desc: 'Injectables, Antibiotics, Schedule Drugs, Sutures, Dressings, Baby Items, etc.' },
    { code: '4.7', name: 'Additional Charge Master', count: '52 Charges', status: 'Seeded (Phase 2 CRUD)', phase: 2, desc: 'Non-barcoded theatre charges (Oxygen, Ultane, Bone Cement, Perfusion, etc.).' },
    { code: '4.8', name: 'Charge Sheet Config Master', count: '15 Rulesets', status: 'Seeded (Phase 2 CRUD)', phase: 2, desc: 'Links procedures, additional charges, default SAP items & mandatory staff.' }
  ],

  // Audit Log (Section 2.1 & 8)
  auditLogs: [
    {
      id: 'aud-104',
      timestamp: '2026-11-19 13:20:14',
      user: 'RN Zanele Dlamini (EMP-2088)',
      role: 'Nurse',
      action: 'Started Draft Charge Sheet',
      details: 'Opened Caesarian Charge Sheet (CS-2026-0896-DRAFT) in Theatre 3',
      status: 'Success'
    },
    {
      id: 'aud-103',
      timestamp: '2026-11-19 10:16:02',
      user: 'RN Sarah van der Merwe (EMP-2045)',
      role: 'Nurse',
      action: 'Submitted Charge Sheet',
      details: 'Submitted CS-2026-0893 (Total Knee Replacement - 22 SAP Items, 5 Add. Charges)',
      status: 'Success'
    },
    {
      id: 'aud-102',
      timestamp: '2026-11-19 08:02:11',
      user: 'RN Sarah van der Merwe (EMP-2045)',
      role: 'Nurse',
      action: 'User Login',
      details: 'Authenticated via iPad Terminal (Main Theatre 2)',
      status: 'Success'
    },
    {
      id: 'aud-101',
      timestamp: '2026-11-19 07:15:44',
      user: 'Sr. Thandi Nkosi (EMP-1001)',
      role: 'Administrator',
      action: 'User Master Update',
      details: 'Verified active status for Main Theatre nursing roster',
      status: 'Success'
    }
  ]
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return JSON.parse(JSON.stringify(INITIAL_STATE));
    }
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not persist state to localStorage', e);
  }
}

function resetDemoState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}
