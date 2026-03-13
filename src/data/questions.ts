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
    optionA: "Aventure",
    optionB: "Galère",
    category: "Mobilité",
    duration: 20,
    gradient: "from-burgundy-500 to-navy-500",
  },
  {
    id: 2,
    optionA: "Toujours prête",
    optionB: "Je déteste",
    category: "Lifestyle",
    duration: 20,
    gradient: "from-navy-500 to-burgundy-500",
  },
  {
    id: 3,
    optionA: "Stress total",
    optionB: "Excitation totale",
    category: "Premier jour",
    duration: 20,
    gradient: "from-burgundy-400 to-navy-400",
  },
  {
    id: 4,
    optionA: "J'insiste",
    optionB: "Je lâche l'affaire",
    category: "Terrain",
    duration: 20,
    gradient: "from-navy-400 to-burgundy-400",
  },
  {
    id: 5,
    optionA: "Débriefing d'équipe",
    optionB: "Moment solo",
    category: "Décompression",
    duration: 20,
    gradient: "from-burgundy-500 to-navy-400",
  },
  {
    id: 6,
    optionA: "Speech bien rodé",
    optionB: "Impro au feeling",
    category: "Approche",
    duration: 20,
    gradient: "from-navy-500 to-burgundy-400",
  },
  {
    id: 7,
    optionA: "Motivation en berne",
    optionB: "Encore plus déterminé",
    category: "Résilience",
    duration: 20,
    gradient: "from-burgundy-400 to-navy-500",
  },
  {
    id: 8,
    optionA: "Leader naturel",
    optionB: "Bras droit de confiance",
    category: "Rôle en équipe",
    duration: 20,
    gradient: "from-navy-400 to-burgundy-500",
  },
  {
    id: 9,
    optionA: "Je profite",
    optionB: "J'en remets une couche",
    category: "Mentalité",
    duration: 20,
    gradient: "from-burgundy-500 to-navy-500",
  },
  {
    id: 10,
    optionA: "Esprit d'équipe",
    optionB: "Impact pour l'asso",
    category: "Motivation",
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
