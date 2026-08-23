export type ExamConfig = {
  slug: string;
  name: string;
  description: string;
  subjects: readonly string[];
  features: readonly string[];
  active: boolean;
};

export const EXAMS: ExamConfig[] = [
  {
    slug: 'neet',
    name: 'NEET',
    description: 'Medical entrance preparation',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    features: [
      'Question Bank',
      'Chapter-wise Practice',
      'Mock Tests',
      'Previous-pattern Practice',
      'Performance Analytics',
      'English/Tamil Support',
    ],
    active: true,
  },
  {
    slug: 'jee',
    name: 'JEE',
    description: 'Engineering entrance preparation',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    features: [
      'Question Bank',
      'Chapter-wise Practice',
      'Mock Tests',
      'Previous-pattern Practice',
      'Performance Analytics',
    ],
    active: true,
  },
  {
    slug: 'future-exams',
    name: 'Future Exams',
    description: 'Reserved for additional competitive exams later',
    subjects: ['Scalable exam categories'],
    features: ['Question Bank', 'Mock Tests', 'Chapter Practice', 'Performance Analytics'],
    active: false,
  },
] as const;

export const EXAM_HUB_FEATURES = [
  'Question Bank',
  'Mock Tests',
  'Chapter Practice',
  'Performance Analytics',
  'Previous-pattern Practice',
  'Multilingual Support',
] as const;
