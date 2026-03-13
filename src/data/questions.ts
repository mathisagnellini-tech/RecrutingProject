export interface Question {
  id: number;
  /** The two choices displayed side by side */
  optionA: string;
  optionB: string;
  /** Category tag shown above the question */
  category: string;
  /** Max duration in seconds (safety net - voice detection handles normal advance) */
  duration: number;
  /** Background gradient for visual variety */
  gradient: string;
}

export const questions: Question[] = [
  {
    id: 1,
    optionA: "Plutôt extraverti(e)",
    optionB: "Plutôt introverti(e)",
    category: "Personnalité",
    duration: 20,
    gradient: "from-burgundy-500 to-navy-500",
  },
  {
    id: 2,
    optionA: "Travail en équipe",
    optionB: "Travail en solo",
    category: "Façon de bosser",
    duration: 20,
    gradient: "from-navy-500 to-burgundy-500",
  },
  {
    id: 3,
    optionA: "Matin",
    optionB: "Soir",
    category: "Productivité",
    duration: 15,
    gradient: "from-burgundy-400 to-navy-400",
  },
  {
    id: 4,
    optionA: "Créatif",
    optionB: "Analytique",
    category: "Ton cerveau",
    duration: 20,
    gradient: "from-navy-400 to-burgundy-400",
  },
  {
    id: 5,
    optionA: "Café",
    optionB: "Thé",
    category: "Essentiel",
    duration: 15,
    gradient: "from-burgundy-500 to-navy-400",
  },
  {
    id: 6,
    optionA: "Bureau",
    optionB: "Télétravail",
    category: "Lifestyle",
    duration: 20,
    gradient: "from-navy-500 to-burgundy-400",
  },
  {
    id: 7,
    optionA: "Planificateur",
    optionB: "Improvisation",
    category: "Organisation",
    duration: 20,
    gradient: "from-burgundy-400 to-navy-500",
  },
  {
    id: 8,
    optionA: "Feedback direct",
    optionB: "Feedback doux",
    category: "Communication",
    duration: 20,
    gradient: "from-navy-400 to-burgundy-500",
  },
  {
    id: 9,
    optionA: "Apprendre vite",
    optionB: "Maîtriser à fond",
    category: "Apprentissage",
    duration: 20,
    gradient: "from-burgundy-500 to-navy-500",
  },
  {
    id: 10,
    optionA: "Startup",
    optionB: "Grande entreprise",
    category: "Ambiance",
    duration: 20,
    gradient: "from-navy-500 to-burgundy-500",
  },
];

/** Transition messages shown between questions */
export const transitions = [
  "C'est parti !",
  "Question suivante...",
  "On continue !",
  "Allez, next !",
  "Encore une...",
  "On accélère !",
  "Presque fini !",
  "Dernière ligne droite !",
  "La der des ders !",
];
