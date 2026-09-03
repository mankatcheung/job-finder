import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

function drag(panel: Element, sequence: number[]) {
  const [startY, ...rest] = sequence;
  fireEvent.pointerDown(panel, { clientY: startY, pointerId: 1 });
  for (const clientY of rest) {
    fireEvent.pointerMove(panel, { clientY, pointerId: 1 });
  }
  fireEvent.pointerUp(panel, { clientY: rest[rest.length - 1] ?? startY, pointerId: 1 });
}

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

  // A bottom sheet is this same dialog with different geometry (JEF-208) — it
  // has to keep the focus trap and Escape handling, not reimplement them.
  describe('position="bottom"', () => {
    it('anchors the panel to the bottom edge and rounds only its top', () => {
      render(
        <Modal open onClose={vi.fn()} position="bottom">
          <button>Confirm</button>
        </Modal>,
      );
      const panel = screen.getByRole('dialog');
      expect(panel.className).toContain('rounded-t-2xl');
      expect(panel.className).not.toContain('max-w-lg');
      expect(panel.parentElement?.className).toContain('items-end');
    });

    it('still closes on Escape', async () => {
      const onClose = vi.fn();
      render(
        <Modal open onClose={onClose} position="bottom">
          <button>Confirm</button>
        </Modal>,
      );
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('dismisses on a swipe down past the distance threshold', async () => {
      const onClose = vi.fn();
      render(
        <Modal open onClose={onClose} position="bottom">
          <button>Confirm</button>
        </Modal>,
      );
      const panel = screen.getByRole('dialog');
      drag(panel, [0, 60, 140]);
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('dismisses on a fast flick that does not cross the distance threshold', async () => {
      // fireEvent's synchronous pointerdown -> pointerup happens in well under
      // a millisecond of wall-clock time, so a modest distance already reads
      // as a high-velocity flick.
      const onClose = vi.fn();
      render(
        <Modal open onClose={onClose} position="bottom">
          <button>Confirm</button>
        </Modal>,
      );
      const panel = screen.getByRole('dialog');
      drag(panel, [0, 30]);
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('springs back open without closing on a short, slow drag', async () => {
      const onClose = vi.fn();
      render(
        <Modal open onClose={onClose} position="bottom">
          <button>Confirm</button>
        </Modal>,
      );
      const panel = screen.getByRole('dialog');
      fireEvent.pointerDown(panel, { clientY: 0, pointerId: 1 });
      await new Promise((resolve) => setTimeout(resolve, 300));
      fireEvent.pointerMove(panel, { clientY: 30, pointerId: 1 });
      fireEvent.pointerUp(panel, { clientY: 30, pointerId: 1 });
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(onClose).not.toHaveBeenCalled();
    });

    it('ignores a drag started on an interactive child', async () => {
      const onClose = vi.fn();
      render(
        <Modal open onClose={onClose} position="bottom">
          <button>Confirm</button>
        </Modal>,
      );
      const button = screen.getByRole('button', { name: 'Confirm' });
      drag(button, [0, 60, 140]);
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('names a title-less dialog from ariaLabel', () => {
    render(
      <Modal open onClose={vi.fn()} position="bottom" ariaLabel="More actions">
        <button>Confirm</button>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'More actions' })).toBeInTheDocument();
  });

  it('prefers a string title over ariaLabel, since the title is already visible', () => {
    render(
      <Modal open onClose={vi.fn()} title="Delete application" ariaLabel="More actions">
        <button>Confirm</button>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Delete application' })).toBeInTheDocument();
  });
});
