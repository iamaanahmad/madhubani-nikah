// Madhubani District Geographical Data
// Based on official administrative divisions

export interface Block {
  id: string;
  name: string;
  villages: Village[];
}

export interface Village {
  id: string;
  name: string;
  population?: number;
}

export interface District {
  id: string;
  name: string;
  blocks: Block[];
}

// Madhubani District with all blocks and major villages
export const madhubaniDistrict: District = {
  id: 'madhubani',
  name: 'Madhubani',
  blocks: [
    {
      id: 'madhubani-sadar',
      name: 'Madhubani (Sadar)',
      villages: [
        { id: 'madhubani-town', name: 'Madhubani Town' },
        { id: 'kataiya', name: 'Kataiya' },
        { id: 'bharwara', name: 'Bharwara' },
        { id: 'pandaul', name: 'Pandaul' },
        { id: 'biraul', name: 'Biraul' },
        { id: 'bisfi', name: 'Bisfi' },
        { id: 'ratanpur', name: 'Ratanpur' },
        { id: 'kaluahi', name: 'Kaluahi' }
      ]
    },
    {
      id: 'benipatti',
      name: 'Benipatti',
      villages: [
        { id: 'benipatti-town', name: 'Benipatti' },
        { id: 'mahinam', name: 'Mahinam' },
        { id: 'kukurdaura', name: 'Kukurdaura' },
        { id: 'salkhua', name: 'Salkhua' },
        { id: 'basaith', name: 'Basaith' },
        { id: 'laukahi', name: 'Laukahi' },
        { id: 'ramnagar-benipatti', name: 'Ramnagar' },
        { id: 'belhara', name: 'Belhara' }
      ]
    },
    {
      id: 'jhanjharpur',
      name: 'Jhanjharpur',
      villages: [
        { id: 'jhanjharpur-town', name: 'Jhanjharpur' },
        { id: 'gangapur', name: 'Gangapur' },
        { id: 'bhawanipur', name: 'Bhawanipur' },
        { id: 'laukahi-jhanjharpur', name: 'Laukahi' },
        { id: 'rampatti', name: 'Rampatti' },
        { id: 'biraul-jhanjharpur', name: 'Biraul' },
        { id: 'amgachhi', name: 'Amgachhi' },
        { id: 'phulparas', name: 'Phulparas' }
      ]
    },
    {
      id: 'jaynagar',
      name: 'Jaynagar',
      villages: [
        { id: 'jaynagar-town', name: 'Jaynagar' },
        { id: 'khajauli', name: 'Khajauli' },
        { id: 'bharwara-jaynagar', name: 'Bharwara' },
        { id: 'kahra', name: 'Kahra' },
        { id: 'narayanpur', name: 'Narayanpur' },
        { id: 'raghunathpur', name: 'Raghunathpur' },
        { id: 'sidhawalia', name: 'Sidhawalia' }
      ]
    },
    {
      id: 'rajnagar',
      name: 'Rajnagar',
      villages: [
        { id: 'rajnagar-town', name: 'Rajnagar' },
        { id: 'harlakhi', name: 'Harlakhi' },
        { id: 'maithili', name: 'Maithili' },
        { id: 'ghoghardiha', name: 'Ghoghardiha' },
        { id: 'paranpur', name: 'Paranpur' },
        { id: 'raiganj', name: 'Raiganj' },
        { id: 'sakri', name: 'Sakri' }
      ]
    },
    {
      id: 'khajauli',
      name: 'Khajauli',
      villages: [
        { id: 'khajauli-town', name: 'Khajauli' },
        { id: 'bathnaha', name: 'Bathnaha' },
        { id: 'madhwapur', name: 'Madhwapur' },
        { id: 'sitamarhi-khajauli', name: 'Sitamarhi' },
        { id: 'bindaura', name: 'Bindaura' },
        { id: 'mahishi', name: 'Mahishi' }
      ]
    },
    {
      id: 'ladania',
      name: 'Ladania',
      villages: [
        { id: 'ladania-town', name: 'Ladania' },
        { id: 'sisaut', name: 'Sisaut' },
        { id: 'sonbarsa', name: 'Sonbarsa' },
        { id: 'mahisautha', name: 'Mahisautha' },
        { id: 'keoti', name: 'Keoti' },
        { id: 'bajitpur', name: 'Bajitpur' }
      ]
    },
    {
      id: 'basopatti',
      name: 'Basopatti',
      villages: [
        { id: 'basopatti-town', name: 'Basopatti' },
        { id: 'gangapur-basopatti', name: 'Gangapur' },
        { id: 'parsauni', name: 'Parsauni' },
        { id: 'bisaulia', name: 'Bisaulia' },
        { id: 'babubarhi', name: 'Babubarhi' },
        { id: 'kahra-basopatti', name: 'Kahra' }
      ]
    },
    {
      id: 'andharatharhi',
      name: 'Andharatharhi',
      villages: [
        { id: 'andharatharhi-town', name: 'Andharatharhi' },
        { id: 'parsauni-andharatharhi', name: 'Parsauni' },
        { id: 'marcha', name: 'Marcha' },
        { id: 'sirisia', name: 'Sirisia' },
        { id: 'kataiya-andharatharhi', name: 'Kataiya' }
      ]
    },
    {
      id: 'phulparas',
      name: 'Phulparas',
      villages: [
        { id: 'phulparas-town', name: 'Phulparas' },
        { id: 'mahipura', name: 'Mahipura' },
        { id: 'balrampur', name: 'Balrampur' },
        { id: 'parsa', name: 'Parsa' },
        { id: 'ahiyapur', name: 'Ahiyapur' }
      ]
    },
    {
      id: 'pandaul',
      name: 'Pandaul',
      villages: [
        { id: 'pandaul-town', name: 'Pandaul' },
        { id: 'bhawanipur-pandaul', name: 'Bhawanipur' },
        { id: 'madhopur', name: 'Madhopur' },
        { id: 'rampur-pandaul', name: 'Rampur' },
        { id: 'nawalpur', name: 'Nawalpur' }
      ]
    },
    {
      id: 'ghoghardiha',
      name: 'Ghoghardiha',
      villages: [
        { id: 'ghoghardiha-town', name: 'Ghoghardiha' },
        { id: 'bharwara-ghoghardiha', name: 'Bharwara' },
        { id: 'parsauni-ghoghardiha', name: 'Parsauni' },
        { id: 'raiganj-ghoghardiha', name: 'Raiganj' },
        { id: 'sitamarhi-ghoghardiha', name: 'Sitamarhi' }
      ]
    },
    {
      id: 'harlakhi',
      name: 'Harlakhi',
      villages: [
        { id: 'harlakhi-town', name: 'Harlakhi' },
        { id: 'mahishi-harlakhi', name: 'Mahishi' },
        { id: 'paranpur-harlakhi', name: 'Paranpur' },
        { id: 'khajwali', name: 'Khajwali' },
        { id: 'madhuban', name: 'Madhuban' }
      ]
    },
    {
      id: 'laukaha',
      name: 'Laukaha',
      villages: [
        { id: 'laukaha-town', name: 'Laukaha' },
        { id: 'belhi', name: 'Belhi' },
        { id: 'mahraul', name: 'Mahraul' },
        { id: 'chakia', name: 'Chakia' },
        { id: 'harsinghwa', name: 'Harsinghwa' }
      ]
    },
    {
      id: 'bisfi',
      name: 'Bisfi',
      villages: [
        { id: 'bisfi-town', name: 'Bisfi' },
        { id: 'raghunathpur-bisfi', name: 'Raghunathpur' },
        { id: 'dhabauli', name: 'Dhabauli' },
        { id: 'khagaul', name: 'Khagaul' },
        { id: 'sonbarsa-bisfi', name: 'Sonbarsa' }
      ]
    },
    {
      id: 'kaluahi',
      name: 'Kaluahi',
      villages: [
        { id: 'kaluahi-town', name: 'Kaluahi' },
        { id: 'ahilwara', name: 'Ahilwara' },
        { id: 'bharwara-kaluahi', name: 'Bharwara' },
        { id: 'keoti-kaluahi', name: 'Keoti' },
        { id: 'mahish', name: 'Mahish' }
      ]
    },
    {
      id: 'lalganj',
      name: 'Lalganj',
      villages: [
        { id: 'lalganj-town', name: 'Lalganj' },
        { id: 'bhagwatipur', name: 'Bhagwatipur' },
        { id: 'chainpur', name: 'Chainpur' },
        { id: 'mahadevanand', name: 'Mahadevanand' },
        { id: 'gorthara', name: 'Gorthara' }
      ]
    },
    {
      id: 'katra',
      name: 'Katra',
      villages: [
        { id: 'katra-town', name: 'Katra' },
        { id: 'mahisikaul', name: 'Mahisikaul' },
        { id: 'rampur-katra', name: 'Rampur' },
        { id: 'belwara', name: 'Belwara' },
        { id: 'jhandaha', name: 'Jhandaha' }
      ]
    },
    {
      id: 'bahera',
      name: 'Bahera',
      villages: [
        { id: 'bahera-town', name: 'Bahera' },
        { id: 'mahish-bahera', name: 'Mahish' },
        { id: 'manigachhi', name: 'Manigachhi' },
        { id: 'parsawan', name: 'Parsawan' },
        { id: 'sonma', name: 'Sonma' }
      ]
    },
    {
      id: 'mahishi',
      name: 'Mahishi',
      villages: [
        { id: 'mahishi-town', name: 'Mahishi' },
        { id: 'bindaura-mahishi', name: 'Bindaura' },
        { id: 'keoti-mahishi', name: 'Keoti' },
        { id: 'sitamarhi-mahishi', name: 'Sitamarhi' },
        { id: 'parsauni-mahishi', name: 'Parsauni' }
      ]
    },
    {
      id: 'sakra',
      name: 'Sakra',
      villages: [
        { id: 'sakra-town', name: 'Sakra' },
        { id: 'bhagwatipur-sakra', name: 'Bhagwatipur' },
        { id: 'manikpur', name: 'Manikpur' },
        { id: 'jaynagar-sakra', name: 'Jaynagar' },
        { id: 'ahilwara-sakra', name: 'Ahilwara' }
      ]
    },
    {
      id: 'khutauna',
      name: 'Khutauna',
      villages: [
        { id: 'khutauna-town', name: 'Khutauna' },
        { id: 'ekhatha', name: 'Ekhatha' },
        { id: 'maharajpur', name: 'Maharajpur' },
        { id: 'siswar', name: 'Siswar' },
        { id: 'kusmar', name: 'Kusmar' },
        { id: 'khatauna', name: 'Khatauna' }
      ]
    }
  ]
};

// Nearby districts for reference
export const nearbyDistricts = [
  { id: 'darbhanga', name: 'Darbhanga' },
  { id: 'sitamarhi', name: 'Sitamarhi' },
  { id: 'muzaffarpur', name: 'Muzaffarpur' },
  { id: 'samastipur', name: 'Samastipur' },
  { id: 'supaul', name: 'Supaul' },
  { id: 'araria', name: 'Araria' }
];

// Utility functions
export const getAllVillages = (): Village[] => {
  return madhubaniDistrict.blocks.flatMap(block => block.villages);
};

export const getVillagesByBlock = (blockId: string): Village[] => {
  const block = madhubaniDistrict.blocks.find(b => b.id === blockId);
  return block ? block.villages : [];
};

export const searchVillages = (query: string): Village[] => {
  const allVillages = getAllVillages();
  return allVillages.filter(village => 
    village.name.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchBlocks = (query: string): Block[] => {
  return madhubaniDistrict.blocks.filter(block => 
    block.name.toLowerCase().includes(query.toLowerCase())
  );
};