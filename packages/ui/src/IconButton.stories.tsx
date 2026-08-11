import type { Meta, StoryObj } from '@storybook/react-vite';
import { XIcon, ExternalLinkIcon, TrashIcon } from 'lucide-react';
import { IconButton } from './IconButton';

const meta = {
  title: 'Actions/IconButton',
  component: IconButton,
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  render: () => <IconButton label="Close" icon={<XIcon size={16} />} />,
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton label="Open in new tab" icon={<ExternalLinkIcon size={16} />} />
      <IconButton label="Delete" icon={<TrashIcon size={16} />} variant="danger" />
      <IconButton label="Options" icon={<TrashIcon size={16} />} variant="subtle" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton label="Close" icon={<XIcon size={20} />} size="md" />
      <IconButton label="Close" icon={<XIcon size={16} />} size="sm" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <IconButton label="Delete" icon={<TrashIcon size={16} />} variant="danger" disabled />
  ),
};
