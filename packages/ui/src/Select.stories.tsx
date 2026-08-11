import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta = {
  title: 'Forms/Select',
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

const STATUSES = ['draft', 'applied', 'interviewing', 'offered', 'rejected', 'accepted'];

export const Default: Story = {
  render: () => (
    <div className="max-w-xs">
      <Select defaultValue="applied">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </Select>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="max-w-xs">
      <Select invalid defaultValue="">
        <option value="" disabled>
          Select a status…
        </option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </Select>
    </div>
  ),
};
