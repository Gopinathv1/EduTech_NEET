import { AI_COURSE_TOPICS, ENGINEERING_STUDY_AREAS, LIVE_COURSE_AREAS } from './courses';
import { EUROPE_DESTINATION_COPY, EUROPE_STUDY_DESTINATIONS } from './study-destinations';

export type PublicService = {
  title: string;
  body: string;
  href: string;
  cta?: string;
  chips?: readonly string[];
  note?: string;
};

export const STUDY_ABROAD_SERVICES: PublicService[] = [
  {
    title: 'MBBS Abroad',
    body: 'Explore overseas medical education pathways with guidance for country, university, course, application and documentation steps.',
    href: '/admissions',
    cta: 'EXPLORE MBBS',
  },
  {
    title: 'Study in Europe',
    body: EUROPE_DESTINATION_COPY,
    href: '/admissions',
    cta: 'EXPLORE EUROPE',
    chips: EUROPE_STUDY_DESTINATIONS,
    note: 'Destination suggestions depend on course availability, eligibility, budget and student preferences.',
  },
  {
    title: 'International Higher Education',
    body: 'Explore medical, engineering, technology and higher-education opportunities across selected international destinations.',
    href: '/admissions',
    cta: 'GET GUIDANCE',
  },
  {
    title: 'Application & University Guidance',
    body: 'Get support with course selection, university shortlisting, application pathways, budgeting, documentation and student-life preparation.',
    href: '/admissions',
    cta: 'VIEW JOURNEY',
  },
  {
    title: 'Engineering & Technology Abroad',
    body: 'Explore international engineering and technology programs with guidance on suitable courses, universities, destination options, application requirements and expected costs.',
    href: '/admissions',
    cta: 'EXPLORE OPTIONS',
    chips: ENGINEERING_STUDY_AREAS,
    note: 'University and course recommendations are based on student interests, academic background, eligibility and budget.',
  },
  {
    title: 'Student Life & Part-Time Work Guidance',
    body: 'We guide students with practical information about student life abroad, local rules, permitted work options where applicable, budgeting and adapting to a new country.',
    href: '/admissions',
    cta: 'ASK ABOUT STUDENT LIFE',
    note: "Part-time work eligibility and permitted working hours depend on the student's visa type, country-specific regulations and university policies.",
  },
] as const;

export const EXAM_PREPARATION_SERVICES: PublicService[] = [
  {
    title: 'NEET Preparation',
    body: 'Question bank practice, chapter-wise practice, previous-pattern questions, mock tests, scoring and performance analytics for NEET aspirants.',
    href: '/exam-preparation/neet',
    cta: 'START NEET PREPARATION',
    chips: ['Physics', 'Chemistry', 'Biology', 'Chapter-wise practice', 'Mock tests', 'Performance analytics'],
  },
  {
    title: 'JEE Preparation',
    body: 'Structured practice, concept reinforcement, chapter-wise tests and mock assessments for students preparing for engineering entrance examinations.',
    href: '/exam-preparation/jee',
    cta: 'ASK ABOUT JEE',
    chips: ['Physics', 'Chemistry', 'Mathematics', 'Chapter-wise practice', 'Mock tests', 'Previous-pattern practice', 'Performance analytics'],
    note: 'No official NTA affiliation is claimed.',
  },
] as const;

export const COURSE_SERVICES: PublicService[] = [
  {
    title: 'Live Courses & Future Skills',
    body: 'Learn through guided programs in competitive exam preparation and emerging technology skills.',
    href: '/courses',
    cta: 'VIEW COURSES',
    chips: LIVE_COURSE_AREAS,
  },
  {
    title: 'AI & Future Technology Courses',
    body: 'Explore guided learning options for students and learners interested in AI, programming, data and future technology foundations.',
    href: '/courses',
    cta: 'EXPLORE AI COURSES',
    chips: AI_COURSE_TOPICS,
    note: 'Certification, placement or accreditation is not claimed unless verified.',
  },
] as const;
