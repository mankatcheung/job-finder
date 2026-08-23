import { createFileRoute } from '@tanstack/react-router';
import { AccessibilityPage } from './-components/AccessibilityPage';

export const Route = createFileRoute('/accessibility')({
  head: () => ({
    meta: [
      { title: 'Accessibility — Trakwyn' },
      {
        name: 'description',
        content: 'Trakwyn’s accessibility target and how to report an accessibility barrier.',
      },
    ],
  }),
  component: AccessibilityPage,
});
