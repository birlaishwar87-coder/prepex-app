// ============================================================
// PDF filename → DB chapter mapping for Phase 2.5 library seed.
// ============================================================
// The DB has 18 chapters per subject (54 total) using canonical JEE names.
// Source PDFs use looser / more granular names (e.g. "Motion in a Plane" and
// "Motion in a Straight Line" both belong under DB chapter "Kinematics").
//
// Each entry is keyed by the PDF basename WITHOUT extension and WITHOUT the
// `JEE_Formula-Sheets_${grade}_${subject}_` prefix on formula sheets, and
// WITHOUT the leading `${n}.` ordinal on notes filenames. Lookup is done by
// substring-matching this normalized key against the PDF filename — first hit
// wins. Order matters for ambiguous cases — put more specific keys first.
//
// Value of `null` means "skip this PDF" (not a JEE chapter — e.g. study aids,
// out-of-syllabus content).

// Physics: 18 canonical chapters
export const PHYSICS_ALIASES = {
  // --- 11th ---
  "Units and Measurements": "Units & Measurements",
  "Units & Measurements": "Units & Measurements",
  "Error Analysis": "Units & Measurements",
  "Kinematics": "Kinematics",
  "Vectors & Scalers": "Kinematics",
  "Motion in a Straight Line": "Kinematics",
  "Motion in a Plane": "Kinematics",
  "Projectile Motion": "Kinematics",
  "Circular Motion": "Kinematics",
  "Laws of Motion": "Newton's Laws of Motion",
  "Laws Of Motion": "Newton's Laws of Motion",
  "Friction": "Newton's Laws of Motion",
  "Work, Energy and Power": "Work, Energy, Power",
  "Work, Power & Energy": "Work, Energy, Power",
  "Power": "Work, Energy, Power",
  "Conservation of Momentum": "Work, Energy, Power",
  "Collision": "Work, Energy, Power",
  "Centre of Mass & System of Particles": "Rotational Dynamics",
  "Rotational Motion": "Rotational Dynamics",
  "Rotational Mechanics": "Rotational Dynamics",
  "Gravitation": "Gravitation",
  "Oscillations": "SHM & Oscillations",
  "Simple Harmonic Motion": "SHM & Oscillations",
  "Waves": "Waves",
  "Waves & Sounds": "Waves",
  "Mechanical Properties of Solids": "Waves", // Elasticity material — closest, can revisit
  "Elasticity": "Waves",
  "Mechanical Properties of Fluids": "Waves", // closest of the existing 18
  "Fluids": "Waves",
  "Thermal Properties of Matter": "Thermodynamics",
  "Heat & Thermodynamics": "Thermodynamics",
  "Calorimetry": "Thermodynamics",
  "Thermodynamics": "Thermodynamics",
  "Kinetic Theory of Gases & Thermodynamics": "Kinetic Theory",
  // --- 12th ---
  "Electric Charges and Fields": "Electrostatics",
  "Electrostatic Potential and Capacitance": "Electrostatics",
  "Electrostatics": "Electrostatics",
  "Properties of Conductors": "Electrostatics",
  "Capacitors": "Electrostatics",
  "Dielectric": "Electrostatics",
  "Current Electricity": "Current Electricity",
  "Electrical Instruments": "Current Electricity",
  "Magnetism and Matter": "Magnetism",
  "Moving Charges and Magnetism": "Magnetism",
  "Magnetics": "Magnetism",
  "Electromagnetic Induction": "EM Induction",
  "Electro Magnetic Induction": "EM Induction",
  "Alternating Current": "EM Induction",
  "Electromagnetic Waves": "EM Induction",
  "Ray Optics and Optical Instruments": "Ray Optics",
  "Geometrical Optics": "Ray Optics",
  "Human Eye": "Ray Optics",
  "Wave Optics": "Wave Optics",
  "Dual Nature of Radiation and Matter": "Modern Physics",
  "Atoms": "Modern Physics",
  "Nuclei": "Modern Physics",
  "Modern Physics": "Modern Physics",
  "Semiconductor Electronics: Materials, Devices and Simple Circuits":
    "Semiconductor Devices",
  "Semiconductor Electronics_ Materials, Devices and Simple Circuits":
    "Semiconductor Devices",
  "Semiconductor Electronics": "Semiconductor Devices",
  "Solids & Semiconductors": "Semiconductor Devices",
  "Logic Gate": "Semiconductor Devices",
  "Communication System": "Semiconductor Devices",
  // Out-of-syllabus / utility
  "Mathematical Tools": null,
};

// Chemistry: 18 canonical chapters
export const CHEMISTRY_ALIASES = {
  // --- 11th ---
  "Some Basic Concepts of Chemistry": "Mole Concept",
  "Mole Concept": "Mole Concept",
  "Structure of Atom": "Atomic Structure",
  "Atomic Structure": "Atomic Structure",
  "Chemical Bonding and Molecular Structure": "Chemical Bonding",
  "Chemical Bonding": "Chemical Bonding",
  "Thermodynamics": "Thermodynamics (Chem)",
  "Chemical Thermodynamics and Thermochemistry": "Thermodynamics (Chem)",
  "Chemical Equilibrium": "Equilibrium",
  "Ionic Equilibrium": "Equilibrium",
  "Equilibrium": "Equilibrium",
  "Redox Reaction": "Redox & Electrochemistry",
  "ElectroChemistry": "Redox & Electrochemistry",
  "Electrochemistry": "Redox & Electrochemistry",
  "Chemical Kinetics and Radioactivity": "Chemical Kinetics",
  "Chemical Kinetics": "Chemical Kinetics",
  "Solutions and Colligative Properties": "Solutions",
  "Solutions": "Solutions",
  "The solid state": "Solid State",
  "Solid State": "Solid State",
  "Surface chemistry": "Solid State", // closest; surface chem hangs near solid state
  "Surface Chemistry": "Solid State",
  "Co-ordination Chemistry": "Coordination Compounds",
  "Coordination Compounds": "Coordination Compounds",
  "P-block Elements (Group 13 and 14)": "p-Block",
  "The p-Block Elements (XII)": "p-Block",
  "S-block Element": "p-Block", // grouped with main-group; PRD uses p-Block as catch-all
  "Block Chemistry": "p-Block",
  "Classification of Elements and Periodicity in Properties": "p-Block",
  "Periodic Classification": "p-Block",
  "Hydrogen and its Compound": "p-Block",
  "Hydrogen": "p-Block",
  "Metallurgy": "d & f-Block",
  "General principles and processes of isolation of metals": "d & f-Block",
  "The d and f-Block Elements": "d & f-Block",
  "Some Basic Principles and Techniques General Organic Chemistry": "GOC",
  "Some Basic Principles and Techniques Isomerism": "GOC",
  "Some Basic Principles and Techniques IUPAC Nomenclature": "GOC",
  "Some Basic Principles and Techniques": "GOC",
  "Purification and Analysis of Organic Compound": "GOC",
  "General Organic Chemistry": "GOC",
  "Reaction Mechanism": "GOC",
  "Hydrocarbon": "Hydrocarbons",
  "Hydrocarbons": "Hydrocarbons",
  "Haloalkanes and Haloarenes (Optical Isomerism & Hydrocarbon)": "Alkyl Halides",
  "Alkyl and Aryl Halides": "Alkyl Halides",
  "Alcohols, Phenols and Ethers": "Alcohols & Phenols",
  "Alcohols & Phenols": "Alcohols & Phenols",
  "Aldehydes, Ketones and Carboxylic Acids": "Aldehydes & Ketones",
  "Aldehyde, Ketones & Carboxylic Acids": "Aldehydes & Ketones",
  "Amines": "Aldehydes & Ketones", // closest of organic chapters
  "Aromatic Nitro Compounds": "Aldehydes & Ketones",
  "Biomolecules": "Biomolecules",
  "Carbohydrates": "Biomolecules",
  // States of matter + utility
  "State of matter": "Mole Concept", // closest of physical-chem chapters
  "Gaseous State": "Mole Concept",
  "Qualitative Analysis": "GOC",
  "Practical Organic Chemistry": "GOC",
  "Principles of Qualitative Analysis Salt analysis": "GOC",
  // Skipped (not in DB syllabus)
  "Environmental Chemistry": null,
  "Chemistry in everyday life": null,
  "Polymers": null,
};

// Maths: 18 canonical chapters
export const MATHS_ALIASES = {
  // --- 11th ---
  "Sets": "Sets, Relations & Functions",
  "Relations & Functions": "Sets, Relations & Functions",
  "Relations and Functions": "Sets, Relations & Functions",
  "RELATION & Function": "Sets, Relations & Functions",
  "Trigonometric Functions": "Trigonometry",
  "Trigonometric  Equation": "Trigonometry",
  "Trigonometric Equation": "Trigonometry",
  "Trigonometry": "Trigonometry",
  "Inverse Trigonometric Functions": "Trigonometry",
  "Complex Number-1": "Complex Numbers",
  "Complex Numbers": "Complex Numbers",
  "Quadratic Equations": "Quadratic Equations",
  "Quadratic_Equations": "Quadratic Equations",
  "Sequences and Series": "Sequences & Series",
  "Sequence And Series": "Sequences & Series",
  "Permutations and Combinations": "Permutations & Combinations",
  "Permutation And Combination": "Permutations & Combinations",
  "Binomial theorem": "Binomial Theorem",
  "Binomial Theorem": "Binomial Theorem",
  "Matrices": "Matrices & Determinants",
  "Determinants": "Matrices & Determinants",
  "Determinant": "Matrices & Determinants",
  "Limits and Derivatives": "Limits & Continuity",
  "Limit, Continuity and Differentiability": "Limits & Continuity",
  "Limit": "Limits & Continuity",
  "Continuity": "Limits & Continuity",
  "Differentiability": "Limits & Continuity",
  "Differential Equations": "Differential Equations",
  "Differential_Equations": "Differential Equations",
  "Methods of Differentiation": "Differentiation",
  "Application of Derivatives": "Application of Derivatives",
  "Indefinite Integration": "Indefinite Integration",
  "Definite Integration": "Definite Integration",
  "Applications of Integrals": "Definite Integration",
  "Application of Integrals": "Definite Integration",
  "Vector Algebra": "Vectors",
  "Vector": "Vectors",
  "Three Dimensional Geometry": "3D Geometry",
  "Three_Dimensional_Geometry": "3D Geometry",
  "Introduction to Three Dimensional Geometry": "3D Geometry",
  "Straight Lines": "Coordinate Geometry",
  "Straight line": "Coordinate Geometry",
  "Circles": "Coordinate Geometry",
  "Conic Section (Ellipse)": "Coordinate Geometry",
  "Conic Section (Hyperbola)": "Coordinate Geometry",
  "Conic Section (Parabola)": "Coordinate Geometry",
  "Probability": "Probability",
  "Statistics": "Probability", // closest topical match
  // Utility / skipped
  "Basic Maths": null,
  "Mathematical Reasoning": null,
};

export const ALIASES_BY_SUBJECT = {
  physics: PHYSICS_ALIASES,
  chemistry: CHEMISTRY_ALIASES,
  maths: MATHS_ALIASES,
};

/**
 * Normalize a PDF filename to a lookup key.
 * Strips known prefixes (`JEE_Formula-Sheets_${grade}_${subject}_`),
 * leading ordinals (`12. `, `12.`), trailing course markers
 * ("_ Hand Written Notes", "_ Handwritten Notes __ Lakshya JEE 2024",
 *  "_Handwritten_Short_Notes_Arjuna_JEE_2_0_2023", etc.), and .pdf.
 */
export function normalizeFilename(filename) {
  let n = filename.replace(/\.pdf$/i, "");

  // Strip formula-sheet prefix
  n = n.replace(/^JEE_Formula-Sheets_(11|12)th_(Physics|Chemistry|Maths)_/i, "");

  // Strip leading number + dot + optional space (e.g. "12.", "12. ")
  n = n.replace(/^\d+\.\s*/, "");

  // Strip trailing course/source markers
  n = n.replace(
    /\s*[_@]?\s*(Hand[_ ]Written|Handwritten)[_ ]Short[_ ]Notes.*$/i,
    ""
  );
  n = n.replace(/\s*[_@]?\s*(Hand[_ ]Written|Handwritten)[_ ]Notes.*$/i, "");
  n = n.replace(/\s*_\s*Hand Written Notes\s*$/i, "");
  n = n.replace(/\s*Handwritten Notes\s*__.*$/i, "");
  n = n.replace(/\s*Handwritten Notes Lakshya JEE.*$/i, "");
  n = n.replace(/\s*@_?$/g, "");

  // Convert remaining underscores to spaces (Lakshya files use _ as word sep)
  n = n.replace(/_/g, " ");

  // Collapse multiple whitespace
  n = n.replace(/\s{2,}/g, " ").trim();

  return n;
}

/**
 * Match a normalized filename against the alias map for a subject.
 * Returns canonical DB chapter name, null if explicitly skipped, or
 * undefined if no match (caller should warn and skip with a flag).
 */
export function resolveChapter(subject, normalizedName) {
  const aliases = ALIASES_BY_SUBJECT[subject];
  if (!aliases) return undefined;

  // 1. Exact case-insensitive match
  for (const [key, value] of Object.entries(aliases)) {
    if (key.toLowerCase() === normalizedName.toLowerCase()) return value;
  }
  // 2. Substring — the alias key appears in the filename
  for (const [key, value] of Object.entries(aliases)) {
    if (normalizedName.toLowerCase().includes(key.toLowerCase())) return value;
  }
  // 3. Reverse substring — filename appears in the alias key
  for (const [key, value] of Object.entries(aliases)) {
    if (key.toLowerCase().includes(normalizedName.toLowerCase())) return value;
  }
  return undefined;
}
