/**
 * Busamed Hillcrest Private Hospital - Theatre Charging System
 * Phase 2: Master Data seed (Item Categories, Charge Sheets, Procedures, Staff, SAP Items, Additional Charges)
 *
 * Nothing in the nurse workflow is hard-coded: every dropdown, template and item list is read from
 * appState.masters, which the Administrator maintains through the Master screens.
 */

const STAFF_CATEGORIES = [
  'Surgeon',
  'Assistant Surgeon',
  'Paediatrician',
  'Anaesthetist',
  'Scrub Sister',
  'Midwife',
  'Floor Nurse',
  'Anaesthetic Nurse'
];

const UNITS_OF_MEASURE = [
  'Each', 'Pair', 'Pack', 'Box', 'Set', 'Vial', 'Ampoule', 'Bag', 'Bottle', 'Roll', 'ml', 'Per case', 'Per hour'
];

// SRS 4.6 - 21 Item Categories
const ITEM_CATEGORY_NAMES = [
  'Schedule Drugs', 'Antibiotics', 'Injectables', 'Intravenous Fluids', 'Syringes & Needles',
  'Sutures', 'Swabs & Gauze', 'Dressings', 'Gloves', 'Surgical Packs & Drapes',
  'Implants', 'Orthopaedic Consumables', 'Cardiac Consumables', 'Catheters & Drains', 'Baby Items',
  'Diathermy Consumables', 'Endoscopy Consumables', 'Anaesthetic Consumables', 'Theatre Disposables',
  'Staplers & Clips', 'Urology Consumables'
];

const CHARGE_SHEET_CODES = [
  'CAES', 'ARTH', 'CARD', 'EYE', 'ENT', 'GEN', 'GI', 'LAP', 'NEURO', 'NGI', 'OJR', 'ORTH', 'PLAS', 'VASC', 'URO'
];

// [staffNo suffix order] name lists per category (fictional demo staff)
const SEED_STAFF = {
  'Surgeon': ['Dr. L. Mthembu', 'Dr. C. van Wyk', 'Dr. P. Naicker', 'Dr. G. Rossouw', 'Dr. A. Khumalo', 'Dr. T. Botha', 'Dr. H. Moodley', 'Dr. S. Venter'],
  'Assistant Surgeon': ['Dr. B. Sithole', 'Dr. J. Pretorius', 'Dr. N. Ramphele', 'Dr. F. Adams', 'Dr. E. Naidoo'],
  'Paediatrician': ['Dr. M. Pillay', 'Dr. K. Dube', 'Dr. R. Singh', 'Dr. A. Mahlangu'],
  'Anaesthetist': ['Dr. R. Govender', 'Dr. S. Pillay', 'Dr. M. Ndlovu', 'Dr. D. Jacobs', 'Dr. Z. Ismail'],
  'Scrub Sister': ['Sr. A. Mokoena', 'Sr. L. Jacobs', 'Sr. P. Zondi', 'Sr. H. Smit', 'Sr. T. Radebe'],
  'Midwife': ['Sr. N. Mabaso', 'Sr. C. Hlongwane', 'Sr. B. Cele', 'Sr. V. Dhlamini'],
  'Floor Nurse': ['RN K. Ntuli', 'RN M. Fourie', 'RN S. Msimang', 'RN J. Khoza', 'RN D. Ferreira'],
  'Anaesthetic Nurse': ['RN T. Maseko', 'RN L. Bezuidenhout', 'RN F. Ngcobo', 'RN Y. Chetty']
};

// [SAP code, description, category number (1-21), unit of measure]
const SEED_SAP_ITEMS = [
  ['300071316', 'Diprivan 20ml', 1, 'Vial'],
  ['300071402', 'Fentanyl 100mcg/2ml', 1, 'Ampoule'],
  ['300071455', 'Morphine Sulphate 10mg/ml', 1, 'Ampoule'],
  ['300071501', 'Midazolam 5mg/5ml', 1, 'Ampoule'],
  ['300071577', 'Ketamine 50mg/ml 10ml', 1, 'Vial'],
  ['300085717', 'Cefazolin 1g', 2, 'Vial'],
  ['300085730', 'Augmentin IV 1.2g', 2, 'Vial'],
  ['300085744', 'Metronidazole 500mg/100ml', 2, 'Bag'],
  ['300085761', 'Gentamicin 80mg/2ml', 2, 'Ampoule'],
  ['300085790', 'Ceftriaxone 1g', 2, 'Vial'],
  ['300066101', 'Ondansetron 4mg/2ml', 3, 'Ampoule'],
  ['300066118', 'Dexamethasone 4mg/ml', 3, 'Ampoule'],
  ['300066134', 'Oxytocin 10IU/ml', 3, 'Ampoule'],
  ['300066152', 'Lignocaine 2% 20ml', 3, 'Vial'],
  ['300066170', 'Bupivacaine Heavy 0.5% 4ml', 3, 'Ampoule'],
  ['300066188', 'Neostigmine 2.5mg/ml', 3, 'Ampoule'],
  ['300066205', 'Rocuronium 50mg/5ml', 3, 'Vial'],
  ['300061204', 'Ringer Lactate 1000ml', 4, 'Bag'],
  ['300061219', 'Sodium Chloride 0.9% 1000ml', 4, 'Bag'],
  ['300061233', 'Sodium Chloride 0.9% 500ml', 4, 'Bag'],
  ['300061250', 'Dextrose 5% 1000ml', 4, 'Bag'],
  ['300072090', 'Syringe 10ml', 5, 'Each'],
  ['300072104', 'Syringe 5ml', 5, 'Each'],
  ['300072118', 'Syringe 20ml', 5, 'Each'],
  ['300072133', 'Needle 21G', 5, 'Each'],
  ['300072147', 'Spinal Needle 25G', 5, 'Each'],
  ['300094112', 'Vicryl 2-0 Absorbable Suture', 6, 'Pack'],
  ['300094126', 'Vicryl 3-0 Absorbable Suture', 6, 'Pack'],
  ['300094141', 'Monocryl 4-0 Suture', 6, 'Pack'],
  ['300094155', 'Prolene 2-0 Suture', 6, 'Pack'],
  ['300094170', 'Ethilon 3-0 Suture', 6, 'Pack'],
  ['300094185', 'PDS II Size 1 Suture', 6, 'Pack'],
  ['300055010', 'Raytec Swabs 10x10cm', 7, 'Pack'],
  ['300055024', 'Abdominal Swabs 45x45cm', 7, 'Pack'],
  ['300055039', 'Gauze Swabs Sterile 10x10cm', 7, 'Pack'],
  ['300056110', 'Opsite Post-Op Dressing 15cm', 8, 'Each'],
  ['300056124', 'Mepore Dressing 9x10cm', 8, 'Each'],
  ['300056139', 'Crepe Bandage 10cm', 8, 'Each'],
  ['300058901', 'Sterile Surgical Gloves Size 7.5', 9, 'Pair'],
  ['300058915', 'Sterile Surgical Gloves Size 7.0', 9, 'Pair'],
  ['300058929', 'Sterile Surgical Gloves Size 8.0', 9, 'Pair'],
  ['300052010', 'Caesarian Drape Pack', 10, 'Set'],
  ['300052025', 'Universal Drape Pack', 10, 'Set'],
  ['300052040', 'Orthopaedic Drape Pack', 10, 'Set'],
  ['300090101', 'Hip Prosthesis Femoral Stem', 11, 'Each'],
  ['300090118', 'Knee Tibial Insert', 11, 'Each'],
  ['300091210', 'Orthopaedic Saw Blade', 12, 'Each'],
  ['300091225', 'Drill Bit 3.2mm', 12, 'Each'],
  ['300093310', 'Cardioplegia Solution 1000ml', 13, 'Bag'],
  ['300093325', 'Vascular Graft 6mm', 13, 'Each'],
  ['300064410', 'Foley Catheter 16Fr', 14, 'Each'],
  ['300064425', 'Redivac Drain 14Fr', 14, 'Each'],
  ['300064440', 'Urine Bag 2L', 14, 'Each'],
  ['300073510', 'Umbilical Cord Clamp', 15, 'Each'],
  ['300073525', 'Baby Identification Band Set', 15, 'Set'],
  ['300073540', 'Neonatal Suction Catheter 8Fr', 15, 'Each'],
  ['300074610', 'Diathermy Pencil Disposable', 16, 'Each'],
  ['300074625', 'Diathermy Return Pad Adult', 16, 'Each'],
  ['300075710', 'Biopsy Forceps Disposable', 17, 'Each'],
  ['300075725', 'Endoscopy Bite Block', 17, 'Each'],
  ['300076810', 'Endotracheal Tube 7.5 Cuffed', 18, 'Each'],
  ['300076825', 'Laryngeal Mask Airway Size 4', 18, 'Each'],
  ['300076840', 'Breathing Circuit Adult', 18, 'Each'],
  ['300077910', 'Surgical Face Mask', 19, 'Each'],
  ['300077925', 'Theatre Cap', 19, 'Each'],
  ['300077940', 'Scalpel Blade No. 15', 19, 'Each'],
  ['300078010', 'Skin Stapler 35W', 20, 'Each'],
  ['300078025', 'Ligaclip Medium', 20, 'Pack'],
  ['300079110', 'JJ Ureteric Stent 6Fr', 21, 'Each'],
  ['300079125', 'Glycine Irrigation Bag 3L', 21, 'Bag']
];

function guessChargeUom(name) {
  if (/per ml/i.test(name)) return 'ml';
  if (/oxygen/i.test(name)) return 'Per hour';
  if (/(charge|charges|use|used|reprocessing|insufflation|infusion|microscope|perfusion)/i.test(name)) return 'Per case';
  return 'Each';
}

function buildSeedMasters() {
  const itemCategories = ITEM_CATEGORY_NAMES.map((name, i) => ({
    id: 'cat-' + (i + 1), name, active: true
  }));

  const chargeSheets = INITIAL_STATE.chargeSheets.map((c, i) => ({
    id: c.id,
    code: CHARGE_SHEET_CODES[i] || ('CS' + (i + 1)),
    name: c.name,
    specialty: c.category,
    description: '',
    active: true,
    mandatoryStaff: [...c.mandatoryStaff]
  }));

  const procedures = [];
  let procNo = 0;
  INITIAL_STATE.chargeSheets.forEach((c) => {
    c.procedures.forEach((p) => {
      procNo += 1;
      procedures.push({ id: 'pr-' + procNo, name: p, chargeSheetId: c.id, active: true });
    });
  });

  const chargeLinks = new Map();
  INITIAL_STATE.chargeSheets.forEach((c) => {
    c.additionalCharges.forEach((name) => {
      if (!chargeLinks.has(name)) chargeLinks.set(name, []);
      chargeLinks.get(name).push(c.id);
    });
  });
  const additionalCharges = [];
  let chargeNo = 0;
  chargeLinks.forEach((ids, name) => {
    chargeNo += 1;
    additionalCharges.push({
      id: 'ac-' + chargeNo, name, uom: guessChargeUom(name), chargeSheetIds: ids, active: true
    });
  });

  const staff = [];
  let staffNo = 0;
  STAFF_CATEGORIES.forEach((category) => {
    (SEED_STAFF[category] || []).forEach((fullName) => {
      staffNo += 1;
      const isDoctor = ['Surgeon', 'Assistant Surgeon', 'Paediatrician', 'Anaesthetist'].includes(category);
      staff.push({
        id: 'st-' + staffNo,
        staffNo: 'ST-' + String(staffNo).padStart(4, '0'),
        fullName,
        category,
        registrationNo: (isDoctor ? 'MP' : 'SANC') + String(100000 + staffNo * 137),
        active: true
      });
    });
  });

  const sapItems = SEED_SAP_ITEMS.map((row, i) => ({
    id: 'sap-' + (i + 1),
    sapCode: row[0],
    description: row[1],
    categoryId: 'cat-' + row[2],
    uom: row[3],
    barcode: '600' + row[0] + '1',
    active: true
  }));

  return { itemCategories, chargeSheets, procedures, staff, sapItems, additionalCharges };
}

function ensureMasters(state) {
  if (!state.masters) {
    state.masters = buildSeedMasters();
  }
  return state;
}
