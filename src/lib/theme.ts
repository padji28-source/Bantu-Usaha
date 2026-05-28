export type ThemeName = 'blue' | 'green' | 'purple' | 'orange' | 'brown' | 'dark' | 'neon' | 'red';

export interface ThemeColors {
  name: string;
  bg: string;          // Main background button / active state
  text: string;        // Primary active text color
  hover: string;       // Button hover
  light: string;       // Card background highlight
  textLight: string;   // Text color inside light card
  border: string;      // Border alert / accent colors
  ring: string;        // Input focus outline ring
  badge: string;       // Badge highlight
  gradient: string;    // Gradient accents
}

export const themeMap: Record<ThemeName, ThemeColors> = {
  blue: {
    name: 'Ocean Blue',
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    hover: 'hover:bg-blue-700',
    light: 'bg-blue-50/70',
    textLight: 'text-blue-700',
    border: 'border-blue-200',
    ring: 'focus:ring-blue-500 focus:border-blue-500',
    badge: 'bg-blue-100/80 text-blue-800',
    gradient: 'from-blue-600 to-indigo-700'
  },
  green: {
    name: 'Emerald Mint',
    bg: 'bg-emerald-600',
    text: 'text-emerald-600',
    hover: 'hover:bg-emerald-700',
    light: 'bg-emerald-50/70',
    textLight: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'focus:ring-emerald-500 focus:border-emerald-500',
    badge: 'bg-emerald-100/80 text-emerald-800',
    gradient: 'from-emerald-600 to-teal-700'
  },
  purple: {
    name: 'Sunset Violet',
    bg: 'bg-purple-600',
    text: 'text-purple-600',
    hover: 'hover:bg-purple-700',
    light: 'bg-purple-50/70',
    textLight: 'text-purple-700',
    border: 'border-purple-200',
    ring: 'focus:ring-purple-500 focus:border-purple-500',
    badge: 'bg-purple-100/80 text-purple-800',
    gradient: 'from-purple-600 to-pink-700'
  },
  orange: {
    name: 'Retro Orange',
    bg: 'bg-orange-600',
    text: 'text-orange-600',
    hover: 'hover:bg-orange-700',
    light: 'bg-orange-50/70',
    textLight: 'text-orange-700',
    border: 'border-orange-200',
    ring: 'focus:ring-orange-500 focus:border-orange-500',
    badge: 'bg-orange-100/80 text-orange-800',
    gradient: 'from-orange-500 to-amber-600'
  },
  brown: {
    name: 'Coffee Latte',
    bg: 'bg-amber-800',
    text: 'text-amber-800',
    hover: 'hover:bg-amber-900',
    light: 'bg-amber-50/70',
    textLight: 'text-amber-900',
    border: 'border-amber-200',
    ring: 'focus:ring-amber-700 focus:border-amber-700',
    badge: 'bg-amber-100/80 text-amber-900',
    gradient: 'from-amber-700 to-amber-900'
  },
  dark: {
    name: 'Slate Stealth',
    bg: 'bg-slate-800',
    text: 'text-slate-800',
    hover: 'hover:bg-slate-950',
    light: 'bg-slate-100/80',
    textLight: 'text-slate-800',
    border: 'border-slate-300',
    ring: 'focus:ring-slate-800 focus:border-slate-800',
    badge: 'bg-slate-200 text-slate-800',
    gradient: 'from-slate-700 to-slate-900'
  },
  neon: {
    name: 'Cyberpunk Neon',
    bg: 'bg-fuchsia-600',
    text: 'text-fuchsia-600',
    hover: 'hover:bg-fuchsia-700',
    light: 'bg-fuchsia-50/70',
    textLight: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
    ring: 'focus:ring-fuchsia-500 focus:border-fuchsia-500',
    badge: 'bg-fuchsia-100/80 text-fuchsia-800',
    gradient: 'from-fuchsia-600 to-violet-800'
  },
  red: {
    name: 'Crimson Rose',
    bg: 'bg-rose-600',
    text: 'text-rose-600',
    hover: 'hover:bg-rose-700',
    light: 'bg-rose-50/70',
    textLight: 'text-rose-700',
    border: 'border-rose-200',
    ring: 'focus:ring-rose-500 focus:border-rose-500',
    badge: 'bg-rose-100/80 text-rose-800',
    gradient: 'from-rose-600 to-red-700'
  }
};
