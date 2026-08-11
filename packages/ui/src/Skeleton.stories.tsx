import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => <Skeleton className="h-8 w-64 rounded" />,
};

export const Shapes: Story = {
  render: () => (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  ),
};

export const StatPlaceholder: Story = {
  render: () => <Skeleton className="h-7 w-12 rounded" />,
};
