export type StudentJourney = {
  image: string;
  key: string;
  imagePosition?: string;
};

export const studentJourneys: StudentJourney[] = [
  {
    image: '/admissions/student-departure-01.jpg',
    key: 'departureOne',
  },

  {
    image: '/admissions/student-departure-02.jpg',
    key: 'departureTwo',
  },

  {
    image: '/admissions/andijan-students-01.jpg',
    key: 'andijan',
  },

  {
    image: '/admissions/student-success-02.jpg',
    key: 'guidance',
  },

  {
    image: '/admissions/georgia.jpg',
    key: 'georgia',
  },

  {
    image: '/admissions/russia.jpg',
    key: 'russia',
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
