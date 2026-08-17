import { useState } from 'react';
import { useLocale } from '#/lib/i18n';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

export type HealthScoreCriterion = {
  key: string;
  label: string;
  points: number;
  earned: number;
  met: boolean;
};
export type HealthScore = { score: number; label: string; criteria: HealthScoreCriterion[] };

export const SCORE_COLORS = {
  green: {
    ring: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    bar: 'bg-green-500',
  },
  blue: {
    ring: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
  amber: {
    ring: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  red: {
    ring: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    bar: 'bg-red-500',
  },
} as const;

export function scoreColor(score: number): keyof typeof SCORE_COLORS {
  if (score >= 91) return 'green';
  if (score >= 71) return 'blue';
  if (score >= 41) return 'amber';
  return 'red';
}

export function HealthScorePanel({ healthScore }: { healthScore: HealthScore }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const color = SCORE_COLORS[scoreColor(healthScore.score)];
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (healthScore.score / 100) * circumference;

  return (
    <div className={`mt-4 rounded-xl border border-gray-100 dark:border-gray-700 ${color.bg} p-3`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              strokeWidth="5"
              className="text-gray-200 dark:text-gray-700"
              stroke="currentColor"
            />
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              strokeWidth="5"
              stroke="currentColor"
              className={color.ring}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
            <text
              x="26"
              y="30"
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill="currentColor"
              className={color.ring}
            >
              {healthScore.score}
            </text>
          </svg>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {t('healthScore.applicationHealth')}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color.badge}`}
            >
              {healthScore.label}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUpIcon size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDownIcon size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <ul className="mt-3 space-y-1.5">
          {healthScore.criteria.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${c.met ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  {c.met && <CheckIcon size={10} className="text-white" />}
                </span>
                <span className={c.met ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                  {c.label}
                </span>
              </div>
              <span
                className={`shrink-0 font-medium ${c.met ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}
              >
                +{c.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
