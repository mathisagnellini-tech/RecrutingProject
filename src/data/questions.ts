export interface Question {
  id: number;
  /** The question text displayed on screen */
  text: string;
  /** Category tag shown above the question */
  category: string;
  /** Emoji for visual flair */
  emoji: string;
  /** Max duration in seconds (safety net - voice detection handles normal advance) */
  duration: number;
  /** Background gradient for visual variety */
  gradient: string;
}

export const questions: Question[] = [
  {
    id: 1,
    text: "Présente-toi en 10 secondes chrono !",
    category: "Ice Breaker",
    emoji: "👋",
    duration: 15,
    gradient: "from-burgundy-500 to-navy-500",
  },
  {
    id: 2,
    text: "Ton plus grand talent caché ?",
    category: "Perso",
    emoji: "✨",
    duration: 15,
    gradient: "from-navy-500 to-burgundy-500",
  },
  {
    id: 3,
    text: "Pourquoi toi et pas quelqu'un d'autre ?",
    category: "Motivation",
    emoji: "🔥",
    duration: 20,
    gradient: "from-burgundy-400 to-navy-400",
  },
  {
    id: 4,
    text: "Ta plus grande fierté ?",
    category: "Perso",
    emoji: "🏆",
    duration: 15,
    gradient: "from-navy-400 to-burgundy-400",
  },
  {
    id: 5,
    text: "Un mot pour te décrire ?",
    category: "Flash",
    emoji: "⚡",
    duration: 10,
    gradient: "from-burgundy-500 to-navy-400",
  },
  {
    id: 6,
    text: "Qu'est-ce qui te fait vibrer ?",
    category: "Passion",
    emoji: "💥",
    duration: 15,
    gradient: "from-navy-500 to-burgundy-400",
  },
  {
    id: 7,
    text: "Ton pire défaut, version honnête ?",
    category: "Honnêteté",
    emoji: "😅",
    duration: 15,
    gradient: "from-burgundy-400 to-navy-500",
  },
  {
    id: 8,
    text: "Si t'avais un super pouvoir ?",
    category: "Fun",
    emoji: "🦸",
    duration: 15,
    gradient: "from-navy-400 to-burgundy-500",
  },
  {
    id: 9,
    text: "C'est quoi ton rêve de ouf ?",
    category: "Ambition",
    emoji: "🚀",
    duration: 15,
    gradient: "from-burgundy-500 to-navy-500",
  },
  {
    id: 10,
    text: "Un dernier mot pour convaincre ?",
    category: "Closing",
    emoji: "🎤",
    duration: 15,
    gradient: "from-navy-500 to-burgundy-500",
  },
];

/** Transition messages shown between questions */
export const transitions = [
  "C'est parti ! 🔥",
  "Suivante ! 💪",
  "On continue ! 🎯",
  "Allez, next ! ⚡",
  "Encore une ! 🚀",
  "On accélère ! 💨",
  "T'assures ! 🔥",
  "Presque fini ! 🏁",
  "La der des ders ! 🎬",
];
