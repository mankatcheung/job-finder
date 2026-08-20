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
      <Badge tone="gray">gray</Badge>
      <Badge tone="slate">slate</Badge>
      <Badge tone="blue">blue</Badge>
      <Badge tone="purple">purple</Badge>
      <Badge tone="yellow">yellow</Badge>
      <Badge tone="orange">orange</Badge>
      <Badge tone="green">green</Badge>
      <Badge tone="red">red</Badge>
      <Badge tone="emerald">emerald</Badge>
    </div>
  ),
};

/** The tones the application-status palette maps onto. */
export const ApplicationStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="gray">draft</Badge>
      <Badge tone="blue">applied</Badge>
      <Badge tone="purple">interviewing</Badge>
      <Badge tone="orange">offered</Badge>
      <Badge tone="green">accepted</Badge>
      <Badge tone="red">rejected</Badge>
      <Badge tone="slate">withdrawn</Badge>
    </div>
  ),
};
