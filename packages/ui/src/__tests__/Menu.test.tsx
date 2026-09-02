import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu, type MenuItem } from '../Menu';

/**
 * jsdom ships no `matchMedia`, and the component treats its absence as
 * "narrow" — so every desktop test has to say so explicitly.
 */
function stubViewport(wide: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: wide,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia');
});

const ITEMS: MenuItem[] = [
  { id: 'edit', label: 'Edit monthly limit' },
  { id: 'test', label: 'Test key' },
  { id: 'default', label: 'Make default' },
  { id: 'remove', label: 'Remove key', destructive: true, separated: true },
];

function renderMenu(props: Partial<React.ComponentProps<typeof Menu>> = {}) {
  const onSelect = props.onSelect ?? vi.fn();
  render(
    <Menu
      label="Key actions"
      items={props.items ?? ITEMS}
      onSelect={onSelect}
      align={props.align}
      trigger={(triggerProps) => (
        <button type="button" {...triggerProps}>
          More actions
        </button>
      )}
    />,
  );
  return { onSelect };
}

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
};

describe('Menu', () => {
  it('renders only the trigger until opened', () => {
    stubViewport(true);
    renderMenu();

    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('marks the trigger as a menu button and tracks its expanded state', async () => {
    stubViewport(true);
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'More actions' });

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await openMenu();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows every item with its label', async () => {
    stubViewport(true);
    renderMenu();
    await openMenu();

    expect(screen.getByRole('menu', { name: 'Key actions' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
    expect(screen.getByRole('menuitem', { name: 'Remove key' })).toBeInTheDocument();
  });

  it('reports the chosen item and closes', async () => {
    stubViewport(true);
    const { onSelect } = renderMenu();
    await openMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Test key' }));

    expect(onSelect).toHaveBeenCalledWith('test');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    stubViewport(true);
    renderMenu();
    await openMenu();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions' })).toHaveFocus();
  });

  it('closes when a click lands outside it', async () => {
    stubViewport(true);
    render(<div data-testid="outside">elsewhere</div>);
    renderMenu();
    await openMenu();

    await userEvent.click(screen.getByTestId('outside'));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('stays open when a click lands inside it', async () => {
    stubViewport(true);
    renderMenu();
    await openMenu();

    await userEvent.click(screen.getByRole('menu', { name: 'Key actions' }));

    expect(screen.getByRole('menu', { name: 'Key actions' })).toBeInTheDocument();
  });

  describe('keyboard', () => {
    it('opens on ArrowDown with the first item focused', async () => {
      stubViewport(true);
      renderMenu();
      screen.getByRole('button', { name: 'More actions' }).focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(screen.getByRole('menuitem', { name: 'Edit monthly limit' })).toHaveFocus();
    });

    it('opens on ArrowUp with the last item focused', async () => {
      stubViewport(true);
      renderMenu();
      screen.getByRole('button', { name: 'More actions' }).focus();

      await userEvent.keyboard('{ArrowUp}');

      expect(screen.getByRole('menuitem', { name: 'Remove key' })).toHaveFocus();
    });

    it('moves down the list and wraps at the end', async () => {
      stubViewport(true);
      renderMenu();
      await openMenu();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'Remove key' })).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'Edit monthly limit' })).toHaveFocus();
    });

    it('jumps to the ends with Home and End', async () => {
      stubViewport(true);
      renderMenu();
      await openMenu();

      await userEvent.keyboard('{End}');
      expect(screen.getByRole('menuitem', { name: 'Remove key' })).toHaveFocus();

      await userEvent.keyboard('{Home}');
      expect(screen.getByRole('menuitem', { name: 'Edit monthly limit' })).toHaveFocus();
    });

    it('skips a disabled item when moving', async () => {
      stubViewport(true);
      renderMenu({
        items: [
          { id: 'a', label: 'First' },
          { id: 'b', label: 'Second', disabled: true },
          { id: 'c', label: 'Third' },
        ],
      });
      await openMenu();

      await userEvent.keyboard('{ArrowDown}');

      expect(screen.getByRole('menuitem', { name: 'Third' })).toHaveFocus();
    });

    it('closes on Tab without choosing anything', async () => {
      stubViewport(true);
      const { onSelect } = renderMenu();
      await openMenu();

      await userEvent.tab();

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('disabled items', () => {
    it('does not report a disabled item as chosen', async () => {
      stubViewport(true);
      const { onSelect } = renderMenu({
        items: [{ id: 'a', label: 'Unavailable', disabled: true }],
      });
      await openMenu();

      await userEvent.click(screen.getByRole('menuitem', { name: 'Unavailable' }));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('narrow viewport', () => {
    it('presents the same items as a bottom sheet', async () => {
      stubViewport(false);
      renderMenu();
      await openMenu();

      expect(screen.getByRole('dialog', { name: 'Key actions' })).toBeInTheDocument();
      expect(screen.getAllByRole('menuitem')).toHaveLength(4);
    });

    it('reports the chosen item from the sheet', async () => {
      stubViewport(false);
      const { onSelect } = renderMenu();
      await openMenu();

      await userEvent.click(screen.getByRole('menuitem', { name: 'Make default' }));

      expect(onSelect).toHaveBeenCalledWith('default');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    /** Without matchMedia at all — SSR and older jsdom — the sheet is the safe default. */
    it('falls back to the sheet when matchMedia is unavailable', async () => {
      renderMenu();
      await openMenu();

      expect(screen.getByRole('dialog', { name: 'Key actions' })).toBeInTheDocument();
    });
  });
});
