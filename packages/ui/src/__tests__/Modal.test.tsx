import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Delete application">
        Body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog with title and content when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="Delete application">
        Are you sure?
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Delete application' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open onClose={onClose} title="Delete application">
        Body
      </Modal>,
    );
    const backdrop = container.ownerDocument.querySelector('[aria-hidden="true"]');
    await userEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Delete application">
        Body
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the first focusable element in the panel when opened', () => {
    render(
      <Modal open onClose={vi.fn()} title="Delete application">
        <button>Confirm</button>
      </Modal>,
    );
    // The header's Close button precedes the body in DOM order, so it's first in tab order.
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('moves focus into the body when there is no title/header', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <button>Confirm</button>
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
  });
});
