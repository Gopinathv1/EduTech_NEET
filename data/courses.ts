export const ENGINEERING_STUDY_AREAS = [
  'Computer Science',
  'Artificial Intelligence',
  'Data Science',
  'Cybersecurity',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics Engineering',
  'Electronics & Communication Engineering',
  'Robotics',
  'Biotechnology',
  'Information Technology',
] as const;

export const LIVE_COURSE_AREAS = [
  'NEET',
  'JEE',
  'AI / Artificial Intelligence',
  'Python',
  'Data Science',
  'Machine Learning',
  'Generative AI',
  'Coding / Programming',
  'Future education and technology programs',
] as const;

export const AI_COURSE_TOPICS = [
  'AI Foundations',
  'Python for AI',
  'Machine Learning',
  'Data Science',
  'Generative AI',
  'Prompt Engineering',
  'RAG / LLM Foundations',
  'AI for Students',
  'Coding Foundations',
] as const;

export const ACADEMIC_COURSE_STREAMS = [
  { key: 'neet', href: '/exam-preparation/neet' },
  { key: 'jee', href: '/exam-preparation/jee' },
] as const;

export const AI_FUTURE_SKILL_CATEGORIES = [
  'aiFoundations',
  'pythonForAi',
  'machineLearning',
  'deepLearning',
  'generativeAi',
  'largeLanguageModels',
  'promptEngineering',
  'rag',
  'aiAgents',
  'dataAnalytics',
  'computerVision',
  'nlp',
  'aiToolsAutomation',
  'futureTechnologySkills',
] as const;

export const AI_LEARNING_PATH = [
  'aiFoundations',
  'python',
  'machineLearning',
  'deepLearning',
  'generativeAi',
  'llmRag',
  'aiAgents',
] as const;

export const ASTROLOGY_LEARNING_AREAS = [
  { key: 'astrologyFoundations', level: 'BEGINNER', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'vedicAstrology', level: 'BEGINNER', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'zodiacPlanets', level: 'BEGINNER', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'houses', level: 'BEGINNER', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'nakshatras', level: 'INTERMEDIATE', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'birthChartFundamentals', level: 'INTERMEDIATE', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'dashaSystems', level: 'INTERMEDIATE', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'transits', level: 'INTERMEDIATE', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'chartInterpretation', level: 'ADVANCED', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'numerology', level: 'BEGINNER', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'panchangaFundamentals', level: 'BEGINNER', status: 'COMING_SOON', href: '/courses#astrology' },
  { key: 'advancedAstrology', level: 'ADVANCED', status: 'COMING_SOON', href: '/courses#astrology' },
] as const;

export const ASTROLOGY_LEARNING_PATH = [
  'foundations',
  'zodiacPlanets',
  'houses',
  'nakshatras',
  'birthCharts',
  'dashaTransits',
  'chartInterpretation',
  'advancedStudy',
] as const;

export const ASTROLOGY_RELATED_AREAS = [
  'numerology',
  'astronomyForAstrologyStudents',
  'calendarPanchanga',
  'indianCalendarSystems',
  'mythologySymbolism',
  'historyOfAstrology',
  'basicSanskritTerminology',
] as const;

export type PlannedCourse = {
  title: string;
  category: string;
  duration?: string;
  modules?: readonly string[];
  tracks?: readonly { title: string; duration: string; modules: readonly string[] }[];
};

export const PLANNED_COURSES: readonly PlannedCourse[] = [
  { title: 'NEET Physics', category: 'NEET preparation', duration: '80–100 hours', modules: ['Physics & Measurement + Vectors', 'Kinematics', 'Laws of Motion', 'Work, Energy & Power', 'Rotational Motion & Gravitation', 'Properties of Matter & Thermodynamics', 'Oscillations & Waves', 'Electrostatics & Current Electricity', 'Magnetism, EMI & Optics', 'Modern Physics & Electronics'] },
  { title: 'NEET Chemistry', category: 'NEET preparation', duration: '80–100 hours', modules: ['Some Basic Concepts / Mole Concept', 'Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Solutions & Equilibrium', 'Electrochemistry & Chemical Kinetics', 'Periodicity & Inorganic Foundations', 'Coordination Chemistry', 'Organic Fundamentals & Hydrocarbons', 'Functional Groups, Biomolecules & Revision'] },
  { title: 'NEET Biology', category: 'NEET preparation', tracks: [
    { title: 'Botany', duration: '60–80 hours', modules: ['Cell Biology', 'Plant Diversity', 'Plant Morphology', 'Plant Anatomy', 'Plant Physiology I', 'Plant Physiology II', 'Plant Reproduction', 'Genetics', 'Molecular Biology & Evolution', 'Ecology & Biotechnology'] },
    { title: 'Zoology', duration: '60–80 hours', modules: ['Animal Diversity', 'Structural Organisation', 'Human Physiology I', 'Human Physiology II', 'Neural & Endocrine Control', 'Human Reproduction', 'Genetics', 'Evolution', 'Human Health & Disease', 'Biotechnology & Applied Biology'] },
  ] },
  { title: 'JEE Physics', category: 'JEE Main preparation', duration: '90–120 hours', modules: ['Units, Measurements & Kinematics', 'Laws of Motion & Mechanics', 'Rotation & Gravitation', 'Properties of Matter & Thermodynamics', 'Oscillations & Waves', 'Electrostatics', 'Current Electricity', 'Magnetism, EMI & AC', 'Optics', 'Modern Physics & Electronics'] },
  { title: 'JEE Chemistry', category: 'JEE Main preparation', duration: '90–120 hours', modules: ['Mole Concept & Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Equilibrium', 'Solutions & Electrochemistry', 'Chemical Kinetics', 'Periodic & Inorganic Chemistry', 'Coordination Chemistry', 'Organic Chemistry Fundamentals', 'Organic Reactions, Biomolecules & Practical Chemistry'] },
  { title: 'JEE Mathematics', category: 'JEE Main preparation', duration: '100–130 hours', modules: ['Sets, Relations & Functions', 'Complex Numbers & Quadratic Equations', 'Matrices & Determinants', 'Sequences, Series & Binomial Theorem', 'Permutations, Probability & Statistics', 'Coordinate Geometry', '3D Geometry & Vectors', 'Limits, Continuity & Differentiability', 'Differential Calculus', 'Integral Calculus & Differential Equations'] },
  { title: 'Spoken English', category: 'Language skills', duration: '30–40 hours', modules: ['Foundations', 'Everyday Vocabulary', 'Sentence Building', 'Pronunciation', 'Everyday Conversations', 'Grammar for Speaking', 'Workplace English', 'Public Speaking', 'Interview & Group Discussion', 'Fluency Practice'] },
  { title: 'Spoken Hindi', category: 'Language skills', duration: '30–40 hours', modules: ['Sounds & Basic Vocabulary', 'Greetings & Introductions', 'Sentence Building', 'Numbers, Time & Daily Expressions', 'Everyday Conversations', 'Travel & Shopping', 'Grammar for Speaking', 'Workplace Hindi', 'Situational Conversation', 'Fluency Practice'] },
] as const;
