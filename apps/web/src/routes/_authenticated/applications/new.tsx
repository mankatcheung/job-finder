import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

const NewApplicationPage = lazy(() =>
  import('./-components/NewApplicationPage').then((m) => ({ default: m.NewApplicationPage })),
);

export const Route = createFileRoute('/_authenticated/applications/new')({
  component: NewApplicationPage,
});
