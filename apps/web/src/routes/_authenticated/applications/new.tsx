import { createFileRoute } from '@tanstack/react-router';
import { NewApplicationPage } from './-components/NewApplicationPage';

export const Route = createFileRoute('/_authenticated/applications/new')({
  component: NewApplicationPage,
});
