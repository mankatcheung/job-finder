import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormLabel } from './FormLabel';
import { Input } from './Input';

const meta = {
  title: 'Forms/FormLabel',
  component: FormLabel,
} satisfies Meta<typeof FormLabel>;

export default meta;
type Story = StoryObj<typeof FormLabel>;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <FormLabel htmlFor="email">Email</FormLabel>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="max-w-sm">
      <FormLabel size="xs">Name *</FormLabel>
      <Input placeholder="Jane Smith" />
    </div>
  ),
};
