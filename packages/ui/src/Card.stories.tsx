import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
import { Button } from './Button';

const meta = {
  title: 'Layout/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="p-4 space-y-3 max-w-sm">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Add a note</p>
      <textarea
        className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
        placeholder="Add a note…"
        readOnly
      />
      <div className="flex justify-end">
        <Button size="sm">Add note</Button>
      </div>
    </Card>
  ),
};

export const ListRow: Story = {
  render: () => (
    <Card className="px-4 py-3 max-w-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Jane Smith</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Technical Recruiter</p>
      </div>
      <span className="text-xs text-blue-600">Edit</span>
    </Card>
  ),
};
