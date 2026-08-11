import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'Feedback/Badge',
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  render: () => <Badge tone="blue">applied</Badge>,
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="gray">draft</Badge>
      <Badge tone="blue">applied</Badge>
      <Badge tone="yellow">interviewing</Badge>
      <Badge tone="green">offered</Badge>
      <Badge tone="red">rejected</Badge>
      <Badge tone="emerald">accepted</Badge>
    </div>
  ),
};
