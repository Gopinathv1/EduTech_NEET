import { OFFICIAL_EXAM_SOURCES } from './official-sources';

export type CanonicalTaxonomyEntry = {
  exam: 'NEET' | 'JEE';
  subjectCode: string;
  unitSlug: string;
  unitName: string;
  topicSlugs: readonly string[];
  sourceUrl: string;
};

/**
 * V1 pilot taxonomy. Slugs are repository identities, not claims that NTA
 * publishes slugs or divides either exam into SIVORA practice parts.
 */
export const QUESTION_BANK_V1_TAXONOMY: readonly CanonicalTaxonomyEntry[] = [
  { exam: 'NEET', subjectCode: 'PHYSICS', unitSlug: 'physics-gravitation', unitName: 'Gravitation', topicSlugs: ['universal-law', 'gravity-variation', 'keplers-laws', 'gravitational-potential', 'gravitational-potential-energy', 'escape-velocity', 'satellites', 'satellite-motion'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'CHEMISTRY', unitSlug: 'chemistry-some-basic-concepts', unitName: 'Some Basic Concepts in Chemistry', topicSlugs: ['mole-concept', 'stoichiometry'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'BOTANY', unitSlug: 'biology-genetics-and-evolution', unitName: 'Genetics and Evolution', topicSlugs: ['mendelian-inheritance', 'molecular-basis-of-inheritance'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-human-physiology', unitName: 'Human Physiology', topicSlugs: ['breathing', 'circulation', 'excretion'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'JEE', subjectCode: 'JEE_PHYSICS', unitSlug: 'jee-physics-kinematics', unitName: 'Kinematics', topicSlugs: ['motion-in-line', 'motion-in-plane'], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS },
  { exam: 'JEE', subjectCode: 'JEE_CHEMISTRY', unitSlug: 'jee-chemistry-basic-concepts', unitName: 'Some Basic Concepts in Chemistry', topicSlugs: ['mole-concept', 'stoichiometry'], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS },
  { exam: 'JEE', subjectCode: 'JEE_MATHEMATICS', unitSlug: 'jee-mathematics-sets-relations-functions', unitName: 'Sets, Relations and Functions', topicSlugs: ['sets', 'relations', 'functions'], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS },
  ...[
    ['physics-and-measurement', 'Physics and Measurement', ['units', 'dimensions', 'measurement-errors']],
    ['physics-kinematics', 'Kinematics', ['motion-in-line', 'motion-in-plane', 'projectile-motion']],
    ['physics-laws-of-motion', 'Laws of Motion', ['newtons-laws', 'friction', 'circular-motion']],
    ['physics-work-energy-power', 'Work, Energy and Power', ['work-energy-theorem', 'power', 'collisions']],
    ['physics-rotational-motion', 'Rotational Motion', ['centre-of-mass', 'torque-angular-momentum', 'moment-of-inertia']],
    ['physics-properties-solids-liquids', 'Properties of Solids and Liquids', ['elasticity', 'fluid-mechanics', 'surface-tension']],
    ['physics-thermodynamics', 'Thermodynamics', ['thermal-equilibrium', 'first-law', 'second-law']],
    ['physics-kinetic-theory-gases', 'Kinetic Theory of Gases', ['gas-laws', 'kinetic-theory', 'degrees-of-freedom']],
    ['physics-oscillations-waves', 'Oscillations and Waves', ['simple-harmonic-motion', 'wave-motion', 'standing-waves']],
    ['physics-electrostatics', 'Electrostatics', ['electric-charge-field', 'potential-capacitance', 'dipoles']],
    ['physics-current-electricity', 'Current Electricity', ['ohms-law', 'circuits', 'cells']],
    ['physics-magnetic-effects', 'Magnetic Effects of Current and Magnetism', ['lorentz-force', 'biot-savart-law', 'magnetism']],
    ['physics-emi-ac', 'Electromagnetic Induction and Alternating Currents', ['electromagnetic-induction', 'alternating-current', 'transformers']],
    ['physics-electromagnetic-waves', 'Electromagnetic Waves', ['displacement-current', 'electromagnetic-spectrum']],
    ['physics-optics', 'Optics', ['ray-optics', 'wave-optics', 'optical-instruments']],
    ['physics-dual-nature', 'Dual Nature of Matter and Radiation', ['photoelectric-effect', 'matter-waves']],
    ['physics-atoms-nuclei', 'Atoms and Nuclei', ['atomic-models', 'nuclear-physics', 'radioactivity']],
    ['physics-electronic-devices', 'Electronic Devices', ['semiconductors', 'diodes', 'logic-gates']],
    ['physics-experimental-skills', 'Experimental Skills', ['measurement-experiments', 'electrical-experiments', 'optics-experiments']],
  ].map(([unitSlug, unitName, topicSlugs]) => ({ exam: 'NEET' as const, subjectCode: 'PHYSICS', unitSlug: unitSlug as string, unitName: unitName as string, topicSlugs: topicSlugs as string[], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS })),
  ...[
    ['chemistry-atomic-structure', 'Atomic Structure', ['atomic-models', 'quantum-numbers', 'electronic-configuration']],
    ['chemistry-chemical-bonding', 'Chemical Bonding and Molecular Structure', ['ionic-covalent-bonding', 'vsepr-hybridization', 'molecular-orbital-theory']],
    ['chemistry-thermodynamics', 'Chemical Thermodynamics', ['enthalpy', 'entropy', 'gibbs-energy']],
    ['chemistry-solutions', 'Solutions', ['concentration-terms', 'colligative-properties', 'raoults-law']],
    ['chemistry-equilibrium', 'Equilibrium', ['chemical-equilibrium', 'ionic-equilibrium', 'buffer-solutions']],
    ['chemistry-redox-electrochemistry', 'Redox Reactions and Electrochemistry', ['redox-reactions', 'electrochemical-cells', 'electrolysis']],
    ['chemistry-chemical-kinetics', 'Chemical Kinetics', ['rate-law', 'activation-energy', 'order-molecularity']],
    ['chemistry-periodicity', 'Classification of Elements and Periodicity in Properties', ['periodic-table', 'periodic-trends']],
    ['chemistry-p-block', 'P-Block Elements', ['group-13-14', 'group-15-18']],
    ['chemistry-d-f-block', 'D- and F-Block Elements', ['transition-elements', 'lanthanoids-actinoids']],
    ['chemistry-coordination-compounds', 'Coordination Compounds', ['nomenclature-isomerism', 'bonding', 'stability-applications']],
    ['chemistry-purification-characterisation', 'Purification and Characterisation of Organic Compounds', ['purification', 'qualitative-analysis', 'quantitative-analysis']],
    ['chemistry-organic-principles', 'Some Basic Principles of Organic Chemistry', ['nomenclature-isomerism', 'electronic-effects', 'reaction-intermediates']],
    ['chemistry-hydrocarbons', 'Hydrocarbons', ['alkanes', 'alkenes-alkynes', 'aromatic-hydrocarbons']],
    ['chemistry-halogens', 'Organic Compounds Containing Halogens', ['preparation-properties', 'substitution-reactions', 'environmental-effects']],
    ['chemistry-oxygen', 'Organic Compounds Containing Oxygen', ['alcohols-phenols-ethers', 'aldehydes-ketones', 'carboxylic-acids']],
    ['chemistry-nitrogen', 'Organic Compounds Containing Nitrogen', ['amines', 'diazonium-salts']],
    ['chemistry-biomolecules', 'Biomolecules', ['carbohydrates', 'proteins', 'nucleic-acids-vitamins']],
    ['chemistry-practical', 'Principles Related to Practical Chemistry', ['titrimetric-analysis', 'salt-analysis', 'laboratory-experiments']],
  ].map(([unitSlug, unitName, topicSlugs]) => ({ exam: 'NEET' as const, subjectCode: 'CHEMISTRY', unitSlug: unitSlug as string, unitName: unitName as string, topicSlugs: topicSlugs as string[], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS })),
  ...[
    ['biology-diversity-living-world', 'Diversity in Living World', ['taxonomy-systematics', 'biological-classification', 'plant-kingdom']],
    ['biology-structural-organisation', 'Structural Organisation in Animals and Plants', ['plant-morphology', 'plant-anatomy', 'animal-tissues']],
    ['biology-cell-structure-function', 'Cell Structure and Function', ['cell-organelles', 'biomolecules', 'cell-division']],
    ['biology-plant-physiology', 'Plant Physiology', ['photosynthesis', 'respiration', 'plant-growth']],
    ['biology-reproduction', 'Reproduction', ['sexual-reproduction-plants', 'human-reproduction', 'reproductive-health']],
    ['biology-human-welfare', 'Biology and Human Welfare', ['human-health-disease', 'microbes-human-welfare']],
    ['biology-biotechnology', 'Biotechnology and Its Applications', ['biotechnology-principles', 'biotechnology-applications']],
    ['biology-ecology-environment', 'Ecology and Environment', ['organisms-populations', 'ecosystems', 'biodiversity-conservation']],
  ].map(([unitSlug, unitName, topicSlugs]) => ({ exam: 'NEET' as const, subjectCode: 'BOTANY', unitSlug: unitSlug as string, unitName: unitName as string, topicSlugs: topicSlugs as string[], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS })),
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-structural-organisation', unitName: 'Structural Organisation in Animals and Plants', topicSlugs: ['animal-tissues', 'animal-morphology'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-cell-structure-function', unitName: 'Cell Structure and Function', topicSlugs: ['cell-organelles', 'biomolecules', 'cell-division'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-reproduction', unitName: 'Reproduction', topicSlugs: ['human-reproduction', 'reproductive-health'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-genetics-and-evolution', unitName: 'Genetics and Evolution', topicSlugs: ['mendelian-inheritance', 'molecular-basis-of-inheritance', 'evolution'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-human-welfare', unitName: 'Biology and Human Welfare', topicSlugs: ['human-health-disease', 'microbes-human-welfare'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-biotechnology', unitName: 'Biotechnology and Its Applications', topicSlugs: ['biotechnology-principles', 'biotechnology-applications'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-ecology-environment', unitName: 'Ecology and Environment', topicSlugs: ['organisms-populations', 'ecosystems', 'biodiversity-conservation'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  ...[
    ['jee-physics-units-measurements', 'Units and Measurements', ['units', 'dimensions', 'measurement-errors']], ['jee-physics-laws-motion', 'Laws of Motion', ['newtons-laws', 'friction', 'circular-motion']], ['jee-physics-work-energy-power', 'Work, Energy and Power', ['work-energy-theorem', 'power', 'collisions']], ['jee-physics-rotational-motion', 'Rotational Motion', ['centre-of-mass', 'torque-angular-momentum', 'moment-of-inertia']], ['jee-physics-gravitation', 'Gravitation', ['gravity-variation', 'keplers-laws', 'satellite-motion']], ['jee-physics-properties-solids-liquids', 'Properties of Solids and Liquids', ['elasticity', 'fluid-mechanics', 'surface-tension']], ['jee-physics-thermodynamics', 'Thermodynamics', ['first-law', 'second-law', 'heat-transfer']], ['jee-physics-kinetic-theory-gases', 'Kinetic Theory of Gases', ['gas-laws', 'kinetic-theory', 'degrees-of-freedom']], ['jee-physics-oscillations-waves', 'Oscillations and Waves', ['simple-harmonic-motion', 'wave-motion', 'standing-waves']], ['jee-physics-electrostatics', 'Electrostatics', ['electric-charge-field', 'potential-capacitance', 'dipoles']], ['jee-physics-current-electricity', 'Current Electricity', ['ohms-law', 'circuits', 'cells']], ['jee-physics-magnetic-effects', 'Magnetic Effects of Current and Magnetism', ['lorentz-force', 'biot-savart-law', 'magnetism']], ['jee-physics-emi-ac', 'Electromagnetic Induction and Alternating Currents', ['electromagnetic-induction', 'alternating-current', 'transformers']], ['jee-physics-electromagnetic-waves', 'Electromagnetic Waves', ['electromagnetic-spectrum', 'displacement-current']], ['jee-physics-optics', 'Optics', ['ray-optics', 'wave-optics', 'optical-instruments']], ['jee-physics-dual-nature', 'Dual Nature of Matter and Radiation', ['photoelectric-effect', 'matter-waves']], ['jee-physics-atoms-nuclei', 'Atoms and Nuclei', ['atomic-models', 'nuclear-physics', 'radioactivity']], ['jee-physics-electronic-devices', 'Electronic Devices', ['semiconductors', 'diodes', 'logic-gates']], ['jee-physics-experimental-skills', 'Experimental Skills', ['measurement-experiments', 'electrical-experiments', 'optics-experiments']],
  ].map(([unitSlug, unitName, topicSlugs]) => ({ exam: 'JEE' as const, subjectCode: 'JEE_PHYSICS', unitSlug: unitSlug as string, unitName: unitName as string, topicSlugs: topicSlugs as string[], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS })),
  ...[
    ['atomic-structure', 'Atomic Structure', ['atomic-models', 'quantum-numbers', 'electronic-configuration']], ['chemical-bonding', 'Chemical Bonding and Molecular Structure', ['ionic-covalent-bonding', 'vsepr-hybridization', 'molecular-orbital-theory']], ['thermodynamics', 'Chemical Thermodynamics', ['enthalpy', 'entropy', 'gibbs-energy']], ['solutions', 'Solutions', ['concentration-terms', 'colligative-properties', 'raoults-law']], ['equilibrium', 'Equilibrium', ['chemical-equilibrium', 'ionic-equilibrium', 'buffer-solutions']], ['redox-electrochemistry', 'Redox Reactions and Electrochemistry', ['redox-reactions', 'electrochemical-cells', 'electrolysis']], ['chemical-kinetics', 'Chemical Kinetics', ['rate-law', 'activation-energy', 'order-molecularity']], ['periodicity', 'Classification of Elements and Periodicity in Properties', ['periodic-table', 'periodic-trends']], ['p-block', 'P-Block Elements', ['group-13-14', 'group-15-18']], ['d-f-block', 'D- and F-Block Elements', ['transition-elements', 'lanthanoids-actinoids']], ['coordination-compounds', 'Coordination Compounds', ['nomenclature-isomerism', 'bonding', 'stability-applications']], ['purification-characterisation', 'Purification and Characterisation of Organic Compounds', ['purification', 'qualitative-analysis', 'quantitative-analysis']], ['organic-principles', 'Some Basic Principles of Organic Chemistry', ['nomenclature-isomerism', 'electronic-effects', 'reaction-intermediates']], ['hydrocarbons', 'Hydrocarbons', ['alkanes', 'alkenes-alkynes', 'aromatic-hydrocarbons']], ['halogens', 'Organic Compounds Containing Halogens', ['preparation-properties', 'substitution-reactions', 'environmental-effects']], ['oxygen', 'Organic Compounds Containing Oxygen', ['alcohols-phenols-ethers', 'aldehydes-ketones', 'carboxylic-acids']], ['nitrogen', 'Organic Compounds Containing Nitrogen', ['amines', 'diazonium-salts']], ['biomolecules', 'Biomolecules', ['carbohydrates', 'proteins', 'nucleic-acids-vitamins']], ['practical', 'Principles Related to Practical Chemistry', ['titrimetric-analysis', 'salt-analysis', 'laboratory-experiments']],
  ].map(([slug, unitName, topicSlugs]) => ({ exam: 'JEE' as const, subjectCode: 'JEE_CHEMISTRY', unitSlug: `jee-chemistry-${slug}`, unitName: unitName as string, topicSlugs: topicSlugs as string[], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS })),
  ...[
    ['complex-quadratic', 'Complex Numbers and Quadratic Equations', ['complex-numbers', 'quadratic-equations']], ['matrices-determinants', 'Matrices and Determinants', ['matrices', 'determinants']], ['permutations-combinations', 'Permutations and Combinations', ['counting-principle', 'permutations', 'combinations']], ['binomial-theorem', 'Binomial Theorem and Its Simple Applications', ['binomial-expansion', 'general-term']], ['sequence-series', 'Sequence and Series', ['arithmetic-progression', 'geometric-progression']], ['limits-continuity-differentiability', 'Limit, Continuity and Differentiability', ['limits', 'continuity', 'differentiation']], ['integral-calculus', 'Integral Calculus', ['indefinite-integrals', 'definite-integrals', 'area-under-curves']], ['differential-equations', 'Differential Equations', ['order-degree', 'variable-separable']], ['coordinate-geometry', 'Coordinate Geometry', ['straight-lines', 'circles', 'conic-sections']], ['three-dimensional-geometry', 'Three Dimensional Geometry', ['direction-cosines', 'lines-in-space']], ['vector-algebra', 'Vector Algebra', ['vector-operations', 'scalar-vector-products']], ['statistics-probability', 'Statistics and Probability', ['measures-dispersion', 'probability', 'bayes-theorem']], ['trigonometry', 'Trigonometry', ['trigonometric-identities', 'inverse-trigonometric-functions']],
  ].map(([slug, unitName, topicSlugs]) => ({ exam: 'JEE' as const, subjectCode: 'JEE_MATHEMATICS', unitSlug: `jee-mathematics-${slug}`, unitName: unitName as string, topicSlugs: topicSlugs as string[], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS })),
] as const;

export function validateTaxonomy(entries: readonly CanonicalTaxonomyEntry[] = QUESTION_BANK_V1_TAXONOMY): string[] {
  const errors: string[] = [];
  const unitKeys = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.exam}:${entry.subjectCode}:${entry.unitSlug}`;
    if (unitKeys.has(key)) errors.push(`Duplicate unit identity: ${key}`);
    unitKeys.add(key);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.unitSlug)) errors.push(`Invalid unit slug: ${entry.unitSlug}`);
    if (new Set(entry.topicSlugs).size !== entry.topicSlugs.length) errors.push(`Duplicate topic in ${key}`);
  }
  return errors;
}
