import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Forms/Input',
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => <Input placeholder="you@example.com" defaultValue="jamie@acme.com" />,
};

export const Invalid: Story = {
  render: () => (
    <div className="space-y-1">
      <Input placeholder="you@example.com" defaultValue="not-an-email" invalid />
      <p className="text-xs text-red-600">Invalid email</p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => <Input placeholder="you@example.com" defaultValue="jamie@acme.com" disabled />,
};
