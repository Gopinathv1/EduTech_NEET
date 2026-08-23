export type AdmissionJourneyStep = {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  image?: {
    src: string;
    alt: string;
  };
};

export const admissionJourneySteps: AdmissionJourneyStep[] = [
  {
    id: 'counselling',
    number: '01',
    title: 'Counselling',
    shortTitle: 'COUNSELLING',
    description:
      "Understand the student's goals, preferred career path, academic expectations and family requirements.",
    href: '/admission-journey#counselling',
  },
  {
    id: 'profile-assessment',
    number: '02',
    title: 'Profile Assessment',
    shortTitle: 'PROFILE ASSESSMENT',
    description:
      'Review relevant academic background, eligibility, interests, skills and other admission considerations.',
    href: '/admission-journey#profile-assessment',
  },
  {
    id: 'course-selection',
    number: '03',
    title: 'Course Selection',
    shortTitle: 'COURSE SELECTION',
    description:
      'Help students explore courses aligned with their interests, academic background and career goals.',
    href: '/admission-journey#course-selection',
  },
  {
    id: 'university-shortlisting',
    number: '04',
    title: 'University Shortlisting',
    shortTitle: 'UNIVERSITY SHORTLISTING',
    description:
      "Identify suitable university options by considering factors such as eligibility, course availability, destination, expected costs and the student's preferences.",
    href: '/admission-journey#university-shortlisting',
  },
  {
    id: 'application',
    number: '05',
    title: 'Application',
    shortTitle: 'APPLICATION',
    description:
      'Guide students through the university application process and required information.',
    href: '/admission-journey#application',
  },
  {
    id: 'documentation',
    number: '06',
    title: 'Documentation',
    shortTitle: 'DOCUMENTATION',
    description:
      'Help students understand and organize the documents required for the relevant admission process.',
    href: '/admission-journey#documentation',
  },
  {
    id: 'admission-confirmation',
    number: '07',
    title: 'Admission Confirmation',
    shortTitle: 'ADMISSION CONFIRMATION',
    description:
      'Support students through the applicable admission/offer process and explain the next steps after receiving university communication.',
    href: '/admission-journey#admission-confirmation',
  },
  {
    id: 'visa-guidance',
    number: '08',
    title: 'Visa Guidance',
    shortTitle: 'VISA GUIDANCE',
    description:
      'Guide students and families through applicable visa/document requirements for their chosen study destination.',
    href: '/admission-journey#visa-guidance',
  },
  {
    id: 'pre-departure',
    number: '09',
    title: 'Pre-Departure',
    shortTitle: 'PRE-DEPARTURE',
    description:
      'Help students prepare for travel, university onboarding, important documents and their transition to studying abroad.',
    href: '/admission-journey#pre-departure',
    image: {
      src: '/admissions/student-departure-01.jpg',
      alt: 'Students and families with luggage at an airport before beginning an international medical education journey',
    },
  },
  {
    id: 'travel-arrival',
    number: '10',
    title: 'Travel & Arrival',
    shortTitle: 'TRAVEL & ARRIVAL',
    description:
      "Provide appropriate guidance around the student's transition from India to their study destination.",
    href: '/admission-journey#travel-arrival',
    image: {
      src: '/admissions/student-departure-02.jpg',
      alt: 'A group of students and families at an airport with luggage before departure for medical studies abroad',
    },
  },
  {
    id: 'university-onboarding',
    number: '11',
    title: 'University Onboarding',
    shortTitle: 'UNIVERSITY ONBOARDING',
    description:
      'Help students understand the next steps for beginning their academic journey at their university.',
    href: '/admission-journey#university-onboarding',
    image: {
      src: '/admissions/andijan-students-01.jpg',
      alt: 'Students standing outside Andijan State Medical Institute in Uzbekistan',
    },
  },
  {
    id: 'continued-support',
    number: '12',
    title: 'Continued Support',
    shortTitle: 'CONTINUED SUPPORT',
    description:
      'Where applicable, continue supporting students and families after the student has started their education abroad.',
    href: '/admission-journey#continued-support',
    image: {
      src: '/admissions/student-success-02.jpg',
      alt: 'Students and family members with admission guidance counsellors during an overseas education support meeting',
    },
  },
];
