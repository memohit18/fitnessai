export const TRANSFORMATION_TIPS = [
  {
    id: 'hydration',
    title: 'Hydration',
    description:
      'Stay hydrated: aim for at least 3.5L of water today to support metabolism and recovery.',
    icon: 'water-outline' as const,
  },
  {
    id: 'protein',
    title: 'Protein intake',
    description:
      'Consume enough protein at each meal to preserve lean mass during your transformation.',
    icon: 'barbell-outline' as const,
  },
  {
    id: 'sleep',
    title: 'Sleep quality',
    description:
      'Aim for 7–8 hours of rest for optimal recovery and hormone balance.',
    icon: 'moon-outline' as const,
  },
  {
    id: 'consistency',
    title: 'Consistency',
    description:
      'Maintain workout consistency — small daily habits compound into major results.',
    icon: 'flash-outline' as const,
  },
] as const;

export const DAILY_QUOTES = [
  'Discipline is choosing between what you want now and what you want most.',
  'Progress, not perfection — show up for today’s version of you.',
  'Your body can stand almost anything. It’s your mind you have to convince.',
  'Small daily improvements are the key to staggering long-term results.',
  'The only bad workout is the one that didn’t happen.',
  'Fuel your body. Train your mind. Trust the process.',
  'Consistency beats intensity when intensity is inconsistent.',
] as const;

/** Stable daily quote index from local calendar day. */
export function getDailyQuote(date = new Date()) {
  const dayKey =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return DAILY_QUOTES[dayKey % DAILY_QUOTES.length] ?? DAILY_QUOTES[0];
}
