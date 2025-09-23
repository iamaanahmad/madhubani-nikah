import type { UserProfile, IslamicContent } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const getImage = (id: string) => {
  const image = PlaceHolderImages.find(img => img.id === id);
  if (!image) {
    return { id: 'default', url: 'https://picsum.photos/seed/default/400/400', hint: 'person' };
  }
  return { id: image.id, url: image.imageUrl, hint: image.imageHint };
};

export const currentUser: UserProfile = {
  id: 'user-0',
  name: 'Ahmed Khan',
  age: 30,
  gender: 'male',
  village: 'Benipatti',
  education: 'Masters in Computer Science',
  occupation: 'Software Engineer',
  sect: 'Sunni',
  religiousPractice: 'Prays 5 times a day, Fasts in Ramadan',
  familyBackground: 'Respectable family, father is a retired teacher.',
  skills: ['Web Development', 'Public Speaking'],
  isVerified: true,
  profilePicture: getImage('profile1'),
  isPhotoBlurred: false,
  bio: "I am a dedicated professional looking for a pious and understanding partner to build a life based on Islamic values. I value honesty, family, and continuous learning.",
  email: "ahmed.khan@example.com",
  subSect: 'hanafi',
  biradari: 'khan',
  block: 'benipatti',
  familyType: 'nuclear',
  maritalStatus: 'single'
};

export const mockMatches: UserProfile[] = [
  {
    id: 'user-1',
    name: 'Fatima Begum',
    age: 24,
    gender: 'female',
    village: 'Madhubani',
    education: 'B.A. in Islamic Studies',
    occupation: 'Teacher at a local school',
    sect: 'Sunni',
    religiousPractice: 'Observes hijab, active in community',
    familyBackground: 'Well-known family of scholars.',
    skills: ['Calligraphy', 'Teaching'],
    isVerified: true,
    profilePicture: getImage('profile2'),
    isPhotoBlurred: true,
    bio: "Seeking a partner who is kind, respectful, and has a strong connection with his deen.",
    email: "fatima.b@example.com",
    subSect: 'barelvi',
    biradari: 'ansari',
    block: 'madhubani-sadar',
    familyType: 'joint',
    maritalStatus: 'single'
  },
  {
    id: 'user-2',
    name: 'Imran Ansari',
    age: 29,
    gender: 'male',
    village: 'Rajnagar',
    education: 'MBA',
    occupation: 'Business Owner',
    sect: 'Sunni',
    religiousPractice: 'Regularly attends Jummah',
    familyBackground: 'Family runs a local business.',
    skills: ['Business Management', 'Negotiation'],
    isVerified: true,
    profilePicture: getImage('profile3'),
    isPhotoBlurred: false,
    bio: "An ambitious and family-oriented man looking for a supportive partner. I believe in a balance of deen and dunya.",
    email: "imran.a@example.com"
  },
  {
    id: 'user-3',
    name: 'Aisha Siddiqui',
    age: 26,
    gender: 'female',
    village: 'Jhanjharpur',
    education: 'Doctor (MBBS)',
    occupation: 'Resident Doctor',
    sect: 'Sunni',
    religiousPractice: 'Follows principles of modesty',
    familyBackground: 'Family of doctors and engineers.',
    skills: ['Medical Knowledge', 'Patience'],
    isVerified: true,
    profilePicture: getImage('profile4'),
    isPhotoBlurred: true,
    bio: "I am a caring and compassionate person, dedicated to my profession and my faith. Looking for someone with a good character and educational background.",
    email: "aisha.s@example.com"
  },
  {
    id: 'user-4',
    name: 'Yusuf Ahmed',
    age: 32,
    gender: 'male',
    village: 'Pandaul',
    education: 'PhD in History',
    occupation: 'Professor',
    sect: 'Sunni',
    religiousPractice: 'Enjoys reading Islamic literature',
    familyBackground: 'Academically inclined family.',
    skills: ['Research', 'Writing'],
    isVerified: false,
    profilePicture: getImage('profile5'),
    isPhotoBlurred: false,
    bio: "A simple man with a love for knowledge and history. I am looking for a partner who is intellectually curious and shares a passion for learning.",
    email: "yusuf.a@example.com"
  },
    {
    id: 'user-5',
    name: 'Zainab Khatun',
    age: 22,
    gender: 'female',
    village: 'Benipatti',
    education: 'Completed Alimah course',
    occupation: 'Homemaker',
    sect: 'Sunni',
    religiousPractice: 'Strong adherence to sunnah',
    familyBackground: 'Pious and traditional family.',
    skills: ['Quranic Recitation', 'Cooking'],
    isVerified: true,
    profilePicture: getImage('profile6'),
    isPhotoBlurred: true,
    bio: "I am looking for a righteous and protective husband who will be the leader of our family according to Quran and Sunnah.",
    email: "zainab.k@example.com"
  },
  {
    id: 'user-6',
    name: 'Bilal Khan',
    age: 27,
    gender: 'male',
    village: 'Madhubani',
    education: 'Diploma in Civil Engineering',
    occupation: 'Construction Supervisor',
    sect: 'Sunni',
    religiousPractice: 'Active in local masjid activities',
    familyBackground: 'Middle-class, hardworking family.',
    skills: ['Project Management', 'Team Leadership'],
    isVerified: false,
    profilePicture: getImage('profile7'),
    isPhotoBlurred: false,
bio: "A practical and straightforward person. Looking for an honest and simple partner to start a family with.",
    email: "bilal.k@example.com"
  },
];

export const islamicContent: IslamicContent[] = [
  {
    id: 1,
    type: 'Quran',
    source: 'Ar-Rum, 30:21',
    textKey: 'quote1',
  },
  {
    id: 2,
    type: 'Hadith',
    source: 'Sahih al-Bukhari',
    textKey: 'quote2',
  },
  {
    id: 3,
    type: 'Quote',
    source: 'Nouman Ali Khan',
    textKey: 'quote3',
  },
  {
    id: 4,
    type: 'Hadith',
    source: 'Mishkat al-Masabih',
    textKey: 'quote4',
  },
  {
    id: 5,
    type: 'Quran',
    source: '24:32',
    textKey: 'quote5',
  }
];
