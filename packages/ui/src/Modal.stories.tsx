import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from './Modal';
import { Button } from './Button';

const meta = {
  title: 'Overlay/Modal',
  component: Modal,
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => (
    <Modal open onClose={() => {}} title="Delete application?">
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This will permanently remove the application and its notes. This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => {}}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={() => {}}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  ),
};

export const NoTitle: Story = {
  render: () => (
    <Modal open onClose={() => {}}>
      <div className="p-6 text-center space-y-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Link copied</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Share it with anyone to view this application.
        </p>
      </div>
    </Modal>
  ),
};
