export type StudentJourney = {
  image: string;
  title: string;
  description: string;
  country: string;
  university?: string;
  category: string;
  tag: string;
  alt: string;
};

export const studentJourneys: StudentJourney[] = [
  {
    image: '/admissions/student-departure-01.jpg',
    title: 'Students Begin Their MBBS Journey Abroad',
    description:
      'Celebrating an important milestone as students and their families begin their international medical education journey.',
    country: 'International Medical Education',
    category: 'Student Departure',
    tag: 'ADMISSION -> DEPARTURE -> UNIVERSITY',
    alt: 'Students and families with luggage at an airport before beginning an international medical education journey',
  },
  {
    image: '/admissions/student-departure-02.jpg',
    title: 'Students Begin Their MBBS Journey Abroad',
    description:
      'Celebrating an important milestone as students and their families begin their international medical education journey.',
    country: 'International Medical Education',
    category: 'Pre-Departure Support',
    tag: 'ADMISSION -> DEPARTURE -> UNIVERSITY',
    alt: 'A group of students and families at an airport with luggage before departure for medical studies abroad',
  },
  {
    image: '/admissions/andijan-students-01.jpg',
    title: 'Beginning Their Medical Journey in Uzbekistan',
    description:
      'A glimpse of students beginning their international medical education journey at Andijan State Medical Institute.',
    country: 'Uzbekistan',
    university: 'Andijan State Medical Institute',
    category: 'Student Destination',
    tag: 'STUDENT JOURNEYS',
    alt: 'Students standing outside Andijan State Medical Institute in Uzbekistan',
  },
];

export const studentJourneySteps = [
  'COUNSELLING',
  'UNIVERSITY SELECTION',
  'APPLICATION',
  'DOCUMENTATION',
  'PRE-DEPARTURE SUPPORT',
  'ARRIVAL',
];
