-- ============================================================
-- Prepex · Phase 2 · Migration 5/5
-- Seed JEE master syllabus (54 chapters: 18 × 3 subjects)
-- ============================================================
-- Source: onboarding.jsx SYLLABUS reference (matches official JEE Main
-- + Advanced syllabus as of 2026 admit cycle).
-- chapter_order roughly follows the standard NCERT teaching sequence
-- so a fresh student sees them in a familiar order.

insert into public.chapters (subject, name, chapter_order) values
  -- ====== Physics (18) ======
  ('physics', 'Units & Measurements', 1),
  ('physics', 'Kinematics', 2),
  ('physics', 'Newton''s Laws of Motion', 3),
  ('physics', 'Work, Energy, Power', 4),
  ('physics', 'Rotational Dynamics', 5),
  ('physics', 'Gravitation', 6),
  ('physics', 'SHM & Oscillations', 7),
  ('physics', 'Waves', 8),
  ('physics', 'Thermodynamics', 9),
  ('physics', 'Kinetic Theory', 10),
  ('physics', 'Electrostatics', 11),
  ('physics', 'Current Electricity', 12),
  ('physics', 'Magnetism', 13),
  ('physics', 'EM Induction', 14),
  ('physics', 'Ray Optics', 15),
  ('physics', 'Wave Optics', 16),
  ('physics', 'Modern Physics', 17),
  ('physics', 'Semiconductor Devices', 18),

  -- ====== Chemistry (18) ======
  ('chemistry', 'Mole Concept', 1),
  ('chemistry', 'Atomic Structure', 2),
  ('chemistry', 'Chemical Bonding', 3),
  ('chemistry', 'Thermodynamics (Chem)', 4),
  ('chemistry', 'Equilibrium', 5),
  ('chemistry', 'Redox & Electrochemistry', 6),
  ('chemistry', 'Chemical Kinetics', 7),
  ('chemistry', 'Solutions', 8),
  ('chemistry', 'Solid State', 9),
  ('chemistry', 'Coordination Compounds', 10),
  ('chemistry', 'p-Block', 11),
  ('chemistry', 'd & f-Block', 12),
  ('chemistry', 'GOC', 13),
  ('chemistry', 'Hydrocarbons', 14),
  ('chemistry', 'Alkyl Halides', 15),
  ('chemistry', 'Alcohols & Phenols', 16),
  ('chemistry', 'Aldehydes & Ketones', 17),
  ('chemistry', 'Biomolecules', 18),

  -- ====== Mathematics (18) ======
  ('maths', 'Sets, Relations & Functions', 1),
  ('maths', 'Trigonometry', 2),
  ('maths', 'Complex Numbers', 3),
  ('maths', 'Quadratic Equations', 4),
  ('maths', 'Sequences & Series', 5),
  ('maths', 'Permutations & Combinations', 6),
  ('maths', 'Binomial Theorem', 7),
  ('maths', 'Matrices & Determinants', 8),
  ('maths', 'Limits & Continuity', 9),
  ('maths', 'Differentiation', 10),
  ('maths', 'Application of Derivatives', 11),
  ('maths', 'Indefinite Integration', 12),
  ('maths', 'Definite Integration', 13),
  ('maths', 'Differential Equations', 14),
  ('maths', 'Vectors', 15),
  ('maths', '3D Geometry', 16),
  ('maths', 'Coordinate Geometry', 17),
  ('maths', 'Probability', 18)
on conflict (subject, name) do nothing;
