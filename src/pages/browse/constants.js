export const VIEW_OPTIONS = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'stream', label: 'Stream' },
  { id: 'table', label: 'Table' },
  { id: 'groups', label: 'Type Deck' },
];

export const SORT_OPTIONS = [
  { id: 'name-asc', label: 'Name A-Z' },
  { id: 'name-desc', label: 'Name Z-A' },
  { id: 'type-asc', label: 'Type A-Z' },
  { id: 'degree-desc', label: 'Highest degree' },
  { id: 'properties-desc', label: 'Most details' },
];

export const TYPE_STYLES = {
  Herb: {
    chip: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    icon: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    glow: 'from-emerald-500/16 via-emerald-400/8 to-transparent',
  },
  PlantPart: {
    chip: 'border-lime-500/30 bg-lime-500/12 text-lime-700 dark:text-lime-300',
    icon: 'border-lime-500/25 bg-lime-500/15 text-lime-700 dark:text-lime-300',
    glow: 'from-lime-500/14 via-lime-400/7 to-transparent',
  },
  Phytochemical: {
    chip: 'border-fuchsia-500/30 bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300',
    icon: 'border-fuchsia-500/25 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',
    glow: 'from-fuchsia-500/16 via-pink-400/8 to-transparent',
  },
  TherapeuticUse: {
    chip: 'border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300',
    icon: 'border-sky-500/25 bg-sky-500/15 text-sky-700 dark:text-sky-300',
    glow: 'from-sky-500/16 via-cyan-400/8 to-transparent',
  },
  default: {
    chip: 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    icon: 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    glow: 'from-slate-500/12 via-slate-400/5 to-transparent',
  },
};

export const PAGE_SIZE = 24;
