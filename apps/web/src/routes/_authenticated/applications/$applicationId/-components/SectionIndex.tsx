import { ChevronRightIcon } from 'lucide-react';
import { useLocale } from '#/lib/i18n';
import { Card } from '@trakwyn/ui';
import { SECTION_GROUPS, type SectionCounts, type SectionDef, type SectionId } from '../-sections';

interface SectionIndexProps {
  counts?: SectionCounts;
  onOpen: (id: SectionId) => void;
}

/**
 * The phone view of an application's nine sections: grouped, counted, and one
 * per row rather than nine in a horizontal scroller where five of them are
 * off-screen with nothing to suggest they exist (JEF-208).
 *
 * Rows are 56px so every one clears the 44px minimum the old 32px icon-button
 * header did not.
 */
export function SectionIndex({ counts, onOpen }: SectionIndexProps) {
  const { t } = useLocale();

  const countFor = (section: SectionDef): number | null =>
    counts && section.countOf ? section.countOf(counts) : null;

  return (
    <div className="flex flex-col gap-5 md:hidden">
      {SECTION_GROUPS.map((group) => (
        <div key={group.titleKey} className="flex flex-col gap-1.5">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t(group.titleKey)}
          </h2>
          <Card className="overflow-hidden">
            {group.sections.map((section, i) => {
              const count = countFor(section);
              // A zero count means the section is genuinely empty, so it reads
              // quieter — still reachable, visibly not worth a tap. A null
              // count is a section with nothing to count, not an empty one.
              const isEmpty = count === 0;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onOpen(section.id)}
                  className={`flex w-full items-center gap-3 px-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                  }`}
                  style={{ minHeight: '56px' }}
                >
                  <section.icon
                    size={18}
                    className={isEmpty ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'}
                  />
                  <span
                    className={`flex-1 text-[15px] ${
                      isEmpty
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {t(section.labelKey)}
                  </span>{' '}
                  {count !== null && count > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {count}
                    </span>
                  )}
                  <ChevronRightIcon
                    size={16}
                    className={isEmpty ? 'text-gray-200 dark:text-gray-700' : 'text-gray-300'}
                  />
                </button>
              );
            })}
          </Card>
        </div>
      ))}
    </div>
  );
}
