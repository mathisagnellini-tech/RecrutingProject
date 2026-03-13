export interface Question {
  id: number;
  /** The two choices displayed side by side */
  optionA: string;
  optionB: string;
  /** Category tag shown above the question */
  category: string;
  /** Duration in seconds the candidate has to answer */
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
    duration: 8,
    gradient: "from-purple-600 to-pink-500",
  },
  {
    id: 2,
    optionA: "Travail en équipe",
    optionB: "Travail en solo",
    category: "Façon de bosser",
    duration: 8,
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: 3,
    optionA: "Matin",
    optionB: "Soir",
    category: "Productivité",
    duration: 6,
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: 4,
    optionA: "Créatif",
    optionB: "Analytique",
    category: "Ton cerveau",
    duration: 8,
    gradient: "from-green-400 to-teal-500",
  },
  {
    id: 5,
    optionA: "Café",
    optionB: "Thé",
    category: "Essentiel",
    duration: 5,
    gradient: "from-amber-500 to-yellow-400",
  },
  {
    id: 6,
    optionA: "Bureau",
    optionB: "Télétravail",
    category: "Lifestyle",
    duration: 8,
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: 7,
    optionA: "Planificateur",
    optionB: "Improvisation",
    category: "Organisation",
    duration: 8,
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: 8,
    optionA: "Feedback direct",
    optionB: "Feedback doux",
    category: "Communication",
    duration: 8,
    gradient: "from-sky-400 to-indigo-500",
  },
  {
    id: 9,
    optionA: "Apprendre vite",
    optionB: "Maîtriser à fond",
    category: "Apprentissage",
    duration: 8,
    gradient: "from-emerald-400 to-cyan-500",
  },
  {
    id: 10,
    optionA: "Startup",
    optionB: "Grande entreprise",
    category: "Ambiance",
    duration: 8,
    gradient: "from-fuchsia-500 to-purple-600",
  },
];

/** Transition messages shown between questions */
export const transitions = [
  "C'est parti ! 🔥",
  "Question suivante...",
  "On continue ! 💪",
  "Allez, next !",
  "Encore une...",
  "On accélère ! 🚀",
  "Presque fini !",
  "Dernière ligne droite !",
  "La der des ders !",
];
