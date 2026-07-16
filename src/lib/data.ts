export const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card', icon: '🆔', color: '#2563EB' },
  { value: 'pan', label: 'PAN Card', icon: '💳', color: '#059669' },
  { value: 'passport', label: 'Passport', icon: '📘', color: '#7C3AED' },
  { value: 'driving_licence', label: 'Driving Licence', icon: '🚗', color: '#DC2626' },
  { value: 'birth_certificate', label: 'Birth Certificate', icon: '📋', color: '#D97706' },
  { value: 'voter_id', label: 'Voter ID', icon: '🗳️', color: '#BE185D' },
  { value: 'ration_card', label: 'Ration Card', icon: '📄', color: '#4F46E5' },
  { value: 'income_certificate', label: 'Income Certificate', icon: '💰', color: '#0891B2' },
  { value: 'caste_certificate', label: 'Caste Certificate', icon: '📜', color: '#65A30D' },
  { value: 'domicile_certificate', label: 'Domicile Certificate', icon: '🏠', color: '#9333EA' },
  { value: 'bank_passbook', label: 'Bank Passbook', icon: '🏦', color: '#0D9488' },
  { value: 'marksheet_10th', label: '10th Marksheet', icon: '🎓', color: '#EA580C' },
  { value: 'marksheet_12th', label: '12th Marksheet', icon: '🎓', color: '#CA8A04' },
  { value: 'leaving_certificate', label: 'Leaving Certificate', icon: '📑', color: '#6D28D9' },
  { value: 'other', label: 'Other Government Document', icon: '📄', color: '#64748B' },
] as const;

export const EXTRACTED_FIELDS = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'fatherName', label: "Father's Name" },
  { key: 'motherName', label: "Mother's Name" },
  { key: 'address', label: 'Address' },
  { key: 'aadhaarNumber', label: 'Aadhaar Number' },
  { key: 'panNumber', label: 'PAN Number' },
  { key: 'passportNumber', label: 'Passport Number' },
  { key: 'mobileNumber', label: 'Mobile Number' },
  { key: 'email', label: 'Email' },
  { key: 'documentNumber', label: 'Document Number' },
  { key: 'issueDate', label: 'Issue Date' },
  { key: 'expiryDate', label: 'Expiry Date' },
] as const;

export const GOVERNMENT_PORTALS = [
  {
    name: 'UIDAI - Aadhaar Services',
    url: 'https://uidai.gov.in',
    description: 'Aadhaar enrollment, update, and download',
    icon: '🆔',
  },
  {
    name: 'NSDL - PAN Services',
    url: 'https://www.tin-nsdl.com',
    description: 'PAN application and correction',
    icon: '💳',
  },
  {
    name: 'UTIITSL - PAN Services',
    url: 'https://www.utiitsl.com',
    description: 'PAN application and correction alternative',
    icon: '💳',
  },
  {
    name: 'Passport Seva',
    url: 'https://www.passportindia.gov.in',
    description: 'Passport application and renewal',
    icon: '📘',
  },
  {
    name: 'DigiLocker',
    url: 'https://www.digilocker.gov.in',
    description: 'Digital document storage and verification',
    icon: '🔐',
  },
  {
    name: 'National Scholarship Portal',
    url: 'https://scholarships.gov.in',
    description: 'Central and state scholarship applications',
    icon: '🎓',
  },
  {
    name: 'Parivahan - Driving Licence',
    url: 'https://parivahan.gov.in',
    description: 'Driving licence and vehicle services',
    icon: '🚗',
  },
  {
    name: 'Election Commission - Voter ID',
    url: 'https://www.nvsp.in',
    description: 'Voter ID registration and correction',
    icon: '🗳️',
  },
  {
    name: 'Income Certificate Portal',
    url: 'https://serviceonline.gov.in',
    description: 'State-specific income certificate services',
    icon: '💰',
  },
] as const;

export const OFFLINE_CENTERS = [
  {
    name: 'CSC Center (Common Service Center)',
    description: 'Government service delivery points in rural and urban areas',
    services: ['Aadhaar enrollment/update', 'PAN application', 'Certificate applications', 'DigiLocker services'],
  },
  {
    name: 'Maha e-Seva Kendra',
    description: 'Maharashtra state e-governance centers',
    services: ['Income certificate', 'Caste certificate', 'Domicile certificate', 'Various government services'],
  },
  {
    name: 'Tehsil / Talathi Office',
    description: 'Local revenue administration office',
    services: ['Income certificate', 'Caste certificate', 'Domicile certificate', 'Land records', '7/12 extract'],
  },
  {
    name: 'Passport Seva Kendra',
    description: 'Passport application and verification centers',
    services: ['New passport', 'Passport renewal', 'Passport correction', 'Tatkal services'],
  },
  {
    name: 'Aadhaar Enrollment Center',
    description: 'UIDAI authorized centers for Aadhaar services',
    services: ['New Aadhaar enrollment', 'Aadhaar update', 'Biometric update', 'Mobile/email update'],
  },
] as const;

export const SCHOLARSHIPS = [
  {
    id: 'post-matric',
    name: 'Post-Matric Scholarship',
    description: 'For students from SC/ST/OBC/minority communities pursuing post-matriculation studies',
    requiredDocs: ['aadhaar', 'income_certificate', 'caste_certificate', 'marksheet_10th', 'bank_passbook'],
    category: ['SC', 'ST', 'OBC', 'Minority'],
  },
  {
    id: 'pre-matric',
    name: 'Pre-Matric Scholarship',
    description: 'For students from minority communities studying in classes I to X',
    requiredDocs: ['aadhaar', 'income_certificate', 'caste_certificate', 'bank_passbook'],
    category: ['Minority'],
  },
  {
    id: 'merit-cum-means',
    name: 'Merit-cum-Means Scholarship',
    description: 'For meritorious students from minority communities pursuing professional/technical courses',
    requiredDocs: ['aadhaar', 'income_certificate', 'marksheet_12th', 'bank_passbook'],
    category: ['Minority'],
  },
  {
    id: 'national-fellowship',
    name: 'National Fellowship for Higher Education',
    description: 'For ST students pursuing MPhil/PhD',
    requiredDocs: ['aadhaar', 'caste_certificate', 'marksheet_12th', 'bank_passbook'],
    category: ['ST'],
  },
  {
    id: 'up-scholarship',
    name: 'UP Scholarship',
    description: 'For students of Uttar Pradesh from economically weaker sections',
    requiredDocs: ['aadhaar', 'income_certificate', 'caste_certificate', 'domicile_certificate', 'bank_passbook', 'marksheet_10th'],
    category: ['General', 'OBC', 'SC', 'ST'],
  },
  {
    id: 'pm-yasasvi',
    name: 'PM YASASVI',
    description: 'Top Class Education for OBC, EBC, and DNT students',
    requiredDocs: ['aadhaar', 'income_certificate', 'caste_certificate', 'marksheet_10th', 'bank_passbook'],
    category: ['OBC', 'EBC', 'DNT'],
  },
] as const;

export const GOVERNMENT_SCHEMES = [
  {
    id: 'pm-jan-dhan',
    name: 'PM Jan Dhan Yojana',
    description: 'Financial inclusion scheme for opening bank accounts',
    eligibility: { minAge: 18, category: ['All'], maxIncome: 'No limit' },
    benefits: 'Zero balance bank account, Rs. 2 lakh accident insurance, overdraft facility',
  },
  {
    id: 'pm-awas',
    name: 'PM Awas Yojana',
    description: 'Housing for All - affordable housing scheme',
    eligibility: { minAge: 18, category: ['EWS', 'LIG', 'MIG'], maxIncome: 'Varies by category' },
    benefits: 'Subsidy up to ₹2.67 lakh on home loan interest',
  },
  {
    id: 'pm-kisan',
    name: 'PM Kisan Samman Nidhi',
    description: 'Income support of ₹6,000/year to farmer families',
    eligibility: { minAge: 18, category: ['Farmer'], maxIncome: 'No limit' },
    benefits: '₹6,000 per year in three installments',
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat - PMJAY',
    description: 'Health insurance scheme covering up to ₹5 lakh per family per year',
    eligibility: { minAge: 0, category: ['SECC 2011 deprived'], maxIncome: 'Based on SECC data' },
    benefits: 'Health cover up to ₹5 lakh per family per year for secondary and tertiary hospitalization',
  },
  {
    id: 'pm-udyog',
    name: 'PM MUDRA Yojana',
    description: 'Micro Units Development and Refinance Agency loan scheme',
    eligibility: { minAge: 18, category: ['All'], maxIncome: 'No limit' },
    benefits: 'Loans up to ₹10 lakh for non-corporate, non-farm micro enterprises',
  },
  {
    id: 'sukanya-samriddhi',
    name: 'Sukanya Samriddhi Yojana',
    description: 'Savings scheme for girl child',
    eligibility: { minAge: 0, maxAge: 10, category: ['Girl Child'], maxIncome: 'No limit' },
    benefits: 'High interest rate savings account with tax benefits',
  },
  {
    id: 'pm-shram-yogi',
    name: 'PM Shram Yogi Maan-dhan',
    description: 'Pension scheme for unorganized sector workers',
    eligibility: { minAge: 18, maxAge: 40, category: ['Unorganized Workers'], maxIncome: '₹15,000/month' },
    benefits: 'Monthly pension of ₹3,000 after age 60',
  },
  {
    id: 'national-pension',
    name: 'National Pension System (NPS)',
    description: 'Voluntary retirement savings scheme',
    eligibility: { minAge: 18, maxAge: 65, category: ['All'], maxIncome: 'No limit' },
    benefits: 'Market-linked returns with tax benefits up to ₹2 lakh under Section 80C',
  },
] as const;
