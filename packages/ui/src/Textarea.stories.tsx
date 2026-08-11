import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <Textarea rows={4} placeholder="Job description, notes…" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="max-w-sm">
      <Textarea rows={3} invalid defaultValue="" placeholder="Required" />
    </div>
  ),
};
