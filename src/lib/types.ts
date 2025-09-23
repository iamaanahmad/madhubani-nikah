export type UserProfile = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  village: string;
  education: string;
  occupation: string;
  sect: 'Sunni' | 'Shia' | 'Other';
  religiousPractice: string;
  familyBackground: string;
  skills: string[];
  isVerified: boolean;
  profilePicture: {
    id: string;
    url: string;
    hint: string;
  };
  isPhotoBlurred: boolean;
  bio: string;
  email: string;
  // Additional fields for comprehensive filtering
  familyType?: 'nuclear' | 'joint';
  maritalStatus?: 'single' | 'divorced' | 'widowed';
  createdAt?: string;
  // New comprehensive religious fields
  subSect?: string;
  biradari?: string;
  block?: string;
};

export type IslamicContent = {
  id: number;
  type: 'Quran' | 'Hadith' | 'Quote';
  source?: string;
  textKey: string;
};
