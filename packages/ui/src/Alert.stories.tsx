import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';

const meta = {
  title: 'Feedback/Alert',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof Alert>;

export const Error: Story = {
  render: () => <Alert>Invalid email or password.</Alert>,
};

export const Success: Story = {
  render: () => (
    <Alert tone="success">
      If an account exists for that email, we&apos;ve sent a recovery link. Check your inbox.
    </Alert>
  ),
};
