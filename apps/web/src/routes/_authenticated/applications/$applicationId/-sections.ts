import { z } from 'zod';
import {
  ActivityIcon,
  Building2Icon,
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  PenLineIcon,
  UploadIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

/**
 * The nine sections of an application, grouped as the detail page presents
 * them, in one place.
 *
 * The index, the desktop sidebar and the `?section=` URL schema all read this,
 * so a section cannot exist in the navigation and not in the URL — or be
 * grouped one way in the list and another in the sidebar.
 *
 * Ids are kebab-case, not display-ish strings with spaces: they are URL
 * query-param values.
 */
export const SECTION_IDS = [
  'notes',
  'interviews',
  'contacts',
  'activity',
  'documents',
  'cover-letter',
  'resume-match',
  'company-briefing',
  'offers',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** Unknown or absent falls back to Notes rather than erroring the route. */
export const sectionSearchSchema = z.object({
  section: z.enum(SECTION_IDS).optional(),
});

export interface SectionCounts {
  notes: number;
  interviews: number;
  contacts: number;
  documents: number;
  documentDrafts: number;
  offers: number;
}

export interface SectionDef {
  id: SectionId;
  labelKey: string;
  icon: LucideIcon;
  /**
   * Which count decides whether this section reads as empty. Sections without
   * one (activity, résumé match, company briefing) are never dimmed — they
   * hold generated or derived content, not a list the user has filled.
   */
  countOf?: (counts: SectionCounts) => number;
}

export interface SectionGroup {
  titleKey: string;
  sections: SectionDef[];
}

export const SECTION_GROUPS: SectionGroup[] = [
  {
    titleKey: 'applicationDetail.groupTrack',
    sections: [
      {
        id: 'notes',
        labelKey: 'applicationDetail.tabNotes',
        icon: FileTextIcon,
        countOf: (c) => c.notes,
      },
      {
        id: 'interviews',
        labelKey: 'applicationDetail.tabInterviews',
        icon: CalendarIcon,
        countOf: (c) => c.interviews,
      },
      {
        id: 'contacts',
        labelKey: 'applicationDetail.tabContacts',
        icon: UsersIcon,
        countOf: (c) => c.contacts,
      },
      { id: 'activity', labelKey: 'applicationDetail.tabActivity', icon: ActivityIcon },
    ],
  },
  {
    titleKey: 'applicationDetail.groupDocuments',
    sections: [
      {
        id: 'documents',
        labelKey: 'applicationDetail.tabDocuments',
        icon: UploadIcon,
        countOf: (c) => c.documents,
      },
      {
        id: 'cover-letter',
        labelKey: 'applicationDetail.tabCoverLetter',
        icon: PenLineIcon,
        countOf: (c) => c.documentDrafts,
      },
      { id: 'resume-match', labelKey: 'applicationDetail.tabResumeMatch', icon: FileTextIcon },
      {
        id: 'company-briefing',
        labelKey: 'applicationDetail.tabCompanyBriefing',
        icon: Building2Icon,
      },
    ],
  },
  {
    titleKey: 'applicationDetail.groupOutcome',
    sections: [
      {
        id: 'offers',
        labelKey: 'applicationDetail.tabOffers',
        icon: DollarSignIcon,
        countOf: (c) => c.offers,
      },
    ],
  },
];

export const ALL_SECTIONS: SectionDef[] = SECTION_GROUPS.flatMap((g) => g.sections);

export function sectionById(id: SectionId): SectionDef {
  return ALL_SECTIONS.find((s) => s.id === id) ?? ALL_SECTIONS[0];
}
