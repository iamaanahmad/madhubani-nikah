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
};

export type IslamicContent = {
  id: number;
  type: 'Quran' | 'Hadith' | 'Quote';
  source?: string;
  text: string;
};
