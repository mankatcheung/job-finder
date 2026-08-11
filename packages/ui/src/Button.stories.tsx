import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Actions/Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  render: () => <Button>Sign in</Button>,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="md">Continue</Button>
      <Button size="sm">Continue</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button disabled>Signing in…</Button>
      <Button variant="secondary" disabled>
        Cancel
      </Button>
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-64">
      <Button fullWidth>Sign in</Button>
    </div>
  ),
};
