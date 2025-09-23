// Islamic Sect and Biradari/Sub-sect Data
// Comprehensive classification for Madhubani and surrounding areas

export interface SectOption {
  id: string;
  name: string;
  subSects?: SubSectOption[];
}

export interface SubSectOption {
  id: string;
  name: string;
  description?: string;
}

export interface BiradariOption {
  id: string;
  name: string;
  commonIn?: string[]; // regions where this biradari is common
  description?: string;
}

// Main Sect Categories
export const mainSects: SectOption[] = [
  {
    id: 'sunni',
    name: 'Sunni',
    subSects: [
      { id: 'deobandi', name: 'Deobandi', description: 'Follows Deoband school of thought' },
      { id: 'barelvi', name: 'Barelvi', description: 'Traditional Sunni practices' },
      { id: 'ahle-hadees', name: 'Ahle Hadees (Salafi)', description: 'Follows Quran and Hadith directly' },
      { id: 'tableeghi-jamaat', name: 'Tableeghi Jamaat', description: 'Islamic revivalist movement' },
      { id: 'sufi', name: 'Sufi', description: 'Mystical Islamic practices' },
      { id: 'hanafi', name: 'Hanafi', description: 'Hanafi school of jurisprudence' },
      { id: 'shafii', name: 'Shafii', description: 'Shafii school of jurisprudence' }
    ]
  },
  {
    id: 'shia',
    name: 'Shia',
    subSects: [
      { id: 'ithna-ashari', name: 'Ithna Ashari (Twelver)', description: 'Believes in 12 Imams' },
      { id: 'bohra', name: 'Bohra/Dawoodi', description: 'Dawoodi Bohra community' },
      { id: 'ismaili', name: 'Ismaili', description: 'Followers of Aga Khan' },
      { id: 'zaidi', name: 'Zaidi', description: 'Zaidi sect of Shia Islam' }
    ]
  },
  {
    id: 'other',
    name: 'Other',
    subSects: [
      { id: 'quranist', name: 'Quranist', description: 'Follows Quran only' },
      { id: 'progressive', name: 'Progressive Muslim', description: 'Modern interpretation' },
      { id: 'non-denominational', name: 'Non-denominational', description: 'No specific sect' }
    ]
  }
];

// Biradari/Social Groups commonly found in Madhubani and Bihar
export const biradariGroups: BiradariOption[] = [
  // Ashraf Groups (Noble lineage)
  {
    id: 'sayed',
    name: 'Sayed/Syed',
    description: 'Descendants of Prophet Muhammad (PBUH)',
    commonIn: ['madhubani', 'darbhanga', 'bihar']
  },
  {
    id: 'shaikh',
    name: 'Shaikh/Sheikh',
    description: 'Learned/Scholar families',
    commonIn: ['madhubani', 'bihar', 'eastern-up']
  },
  {
    id: 'pathan',
    name: 'Pathan',
    description: 'Afghan/Pashtun origin',
    commonIn: ['bihar', 'jharkhand']
  },
  {
    id: 'mughal',
    name: 'Mughal',
    description: 'Mongol/Turkish origin',
    commonIn: ['bihar', 'up']
  },

  // Ajlaf Groups (Occupational)
  {
    id: 'ansari',
    name: 'Ansari',
    description: 'Traditional weavers and helpers',
    commonIn: ['madhubani', 'bihar', 'up', 'jharkhand']
  },
  {
    id: 'qureshi',
    name: 'Qureshi',
    description: 'Traditional butchers/meat sellers',
    commonIn: ['madhubani', 'bihar', 'up']
  },
  {
    id: 'khan',
    name: 'Khan',
    description: 'Various backgrounds with Khan title',
    commonIn: ['madhubani', 'bihar', 'up']
  },
  {
    id: 'malik',
    name: 'Malik',
    description: 'Traditional landlords/farmers',
    commonIn: ['bihar', 'up', 'haryana']
  },

  // Regional/Local Groups
  {
    id: 'mansoori',
    name: 'Mansoori',
    description: 'Traditional tailors/cloth workers',
    commonIn: ['madhubani', 'bihar']
  },
  {
    id: 'faqir',
    name: 'Faqir',
    description: 'Religious mendicants',
    commonIn: ['bihar', 'up']
  },
  {
    id: 'rayeen',
    name: 'Rayeen',
    description: 'Traditional vegetable growers',
    commonIn: ['bihar', 'up']
  },
  {
    id: 'kunjra',
    name: 'Kunjra',
    description: 'Traditional traders',
    commonIn: ['bihar', 'up']
  },
  {
    id: 'dhunia',
    name: 'Dhunia',
    description: 'Cotton carders',
    commonIn: ['bihar', 'up']
  },
  {
    id: 'bhishti',
    name: 'Bhishti',
    description: 'Water carriers',
    commonIn: ['bihar', 'delhi', 'up']
  },
  {
    id: 'darzi',
    name: 'Darzi',
    description: 'Tailors',
    commonIn: ['bihar', 'up']
  },
  {
    id: 'halwai',
    name: 'Halwai',
    description: 'Sweet makers',
    commonIn: ['bihar', 'up']
  },
  {
    id: 'nai',
    name: 'Nai',
    description: 'Barbers',
    commonIn: ['bihar', 'up']
  },
  {
    id: 'dhobi',
    name: 'Dhobi',
    description: 'Washermen',
    commonIn: ['bihar', 'up']
  },

  // Professional/Modern Groups
  {
    id: 'doctor',
    name: 'Medical Family',
    description: 'Healthcare professionals',
    commonIn: ['urban-areas']
  },
  {
    id: 'engineer',
    name: 'Engineering Family',
    description: 'Technical professionals',
    commonIn: ['urban-areas']
  },
  {
    id: 'teacher',
    name: 'Educational Family',
    description: 'Teachers and educators',
    commonIn: ['madhubani', 'bihar']
  },
  {
    id: 'business',
    name: 'Business Family',
    description: 'Traders and businessmen',
    commonIn: ['madhubani', 'bihar']
  },
  {
    id: 'government',
    name: 'Government Service',
    description: 'Civil service families',
    commonIn: ['bihar']
  }
];

// Utility functions
export const getSectById = (sectId: string): SectOption | undefined => {
  return mainSects.find(sect => sect.id === sectId);
};

export const getSubSectsBySect = (sectId: string): SubSectOption[] => {
  const sect = getSectById(sectId);
  return sect?.subSects || [];
};

export const getBiradariById = (biradariId: string): BiradariOption | undefined => {
  return biradariGroups.find(biradari => biradari.id === biradariId);
};

export const searchBiradari = (query: string): BiradariOption[] => {
  return biradariGroups.filter(biradari =>
    biradari.name.toLowerCase().includes(query.toLowerCase()) ||
    biradari.description?.toLowerCase().includes(query.toLowerCase())
  );
};

export const getBiradariByRegion = (region: string): BiradariOption[] => {
  return biradariGroups.filter(biradari =>
    biradari.commonIn?.includes(region.toLowerCase())
  );
};

// Common combinations in Madhubani area
export const commonCombinations = [
  { sect: 'sunni', subSect: 'hanafi', biradari: 'ansari' },
  { sect: 'sunni', subSect: 'deobandi', biradari: 'sayed' },
  { sect: 'sunni', subSect: 'barelvi', biradari: 'shaikh' },
  { sect: 'sunni', subSect: 'hanafi', biradari: 'qureshi' },
  { sect: 'shia', subSect: 'ithna-ashari', biradari: 'sayed' }
];