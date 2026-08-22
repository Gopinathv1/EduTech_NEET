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
  {
    image: '/admissions/student-success-02.jpg',
    title: 'Guidance Beyond Admission',
    description:
      'At SIVORA UP↑RISING, we support students and families beyond the application stage — from counselling and university selection to documentation, admission, travel preparation and ongoing guidance after students begin their education abroad.',
    country: 'Overseas Admissions',
    category: 'Continuous Guidance',
    tag: 'COUNSELLING -> ADMISSION -> SUPPORT',
    alt: 'Students and family members with admission guidance counsellors during an overseas education support meeting',
  },
];

export const studentJourneySteps = [
  'COUNSELLING',
  'PROFILE & INTEREST ASSESSMENT',
  'UNIVERSITY & COURSE SELECTION',
  'APPLICATION',
  'DOCUMENTATION',
  'ADMISSION SUPPORT',
  'PRE-DEPARTURE GUIDANCE',
  'ARRIVAL & CONTINUOUS SUPPORT',
];

export const admissionGuidancePoints = [
  'Understand the student academic profile and career interests',
  'Identify suitable countries, universities and courses',
  'Consider the student skills, goals and preferred field of study',
  'Guide families based on realistic budget and financial situation',
  'Explain tuition fees, living costs and other expected expenses',
  'Support application and documentation',
  'Assist with admission procedures',
  'Guide on visa and document requirements where applicable',
  'Provide pre-departure guidance',
  'Support students and families during the transition abroad',
  'Continue guidance after admission where appropriate',
];
