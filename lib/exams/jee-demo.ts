export const JEE_DEMO = {
  id: 'sivora-jee-demo-practice',
  name: 'JEE Main Demo Practice Test',
  totalQuestions: 15,
  durationMinutes: 30,
  mode: 'DEMO_PRACTICE',
} as const;

export const JEE_DEMO_SUBJECTS = [
  ['JEE_PHYSICS', 'JEE Physics'],
  ['JEE_CHEMISTRY', 'JEE Chemistry'],
  ['JEE_MATHEMATICS', 'JEE Mathematics'],
] as const;

export const JEE_DEMO_QUESTIONS = [
  ['JEE_PHYSICS', 'Units', 'The dimensional formula of velocity is:', ['[LT⁻¹]', '[L⁻¹T]', '[MLT⁻¹]', '[T⁻¹]'], 'A'],
  ['JEE_PHYSICS', 'Units', 'A body travels 20 m in 4 s. Its average speed is:', ['2 m/s', '5 m/s', '8 m/s', '80 m/s'], 'B'],
  ['JEE_PHYSICS', 'Mechanics', 'The SI unit of work is:', ['Newton', 'Watt', 'Joule', 'Pascal'], 'C'],
  ['JEE_PHYSICS', 'Electrostatics', 'The force between two point charges varies as:', ['r', '1/r', 'r²', '1/r²'], 'D'],
  ['JEE_PHYSICS', 'Modern Physics', 'The energy of a photon is:', ['mc²', 'hν', '½mv²', 'qV'], 'B'],
  ['JEE_CHEMISTRY', 'Mole Concept', 'One mole contains approximately:', ['6.022×10²³ particles', '3.011×10²³ particles', '9.8 particles', '1.602×10⁻¹⁹ particles'], 'A'],
  ['JEE_CHEMISTRY', 'Atomic Structure', 'The charge on an electron is:', ['+1.602×10⁻¹⁹ C', '0 C', '-1.602×10⁻¹⁹ C', '1 C'], 'C'],
  ['JEE_CHEMISTRY', 'Chemical Bonding', 'The bond in NaCl is predominantly:', ['Metallic', 'Ionic', 'Hydrogen', 'Coordinate'], 'B'],
  ['JEE_CHEMISTRY', 'Equilibrium', 'At 25°C, neutral water has pH:', ['0', '1', '7', '14'], 'C'],
  ['JEE_CHEMISTRY', 'Organic Chemistry', 'The general formula of an alkane is:', ['CₙH₂ₙ₊₂', 'CₙH₂ₙ', 'CₙHₙ', 'CₙH₂ₙ₋₂'], 'A'],
  ['JEE_MATHEMATICS', 'Algebra', 'If x + 3 = 7, then x equals:', ['3', '4', '7', '10'], 'B'],
  ['JEE_MATHEMATICS', 'Coordinate Geometry', 'The slope of y = 2x + 1 is:', ['1', '2', '-2', '0'], 'B'],
  ['JEE_MATHEMATICS', 'Trigonometry', 'sin²θ + cos²θ equals:', ['0', '1', '2', 'sin θ'], 'B'],
  ['JEE_MATHEMATICS', 'Calculus', 'The derivative of x² is:', ['x', '2x', 'x³', '2'], 'B'],
  ['JEE_MATHEMATICS', 'Probability', 'The probability of a certain event is:', ['0', '½', '1', '2'], 'C'],
] as const;
