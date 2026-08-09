import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

interface EditorUpdateConfig {
  onUpdate: (args: { editor: { getJSON: () => unknown; getText: () => string } }) => void;
}

const { mockChain, mockEditor, useEditorMock } = vi.hoisted(() => {
  const mockChain = {
    focus: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleHeading: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleOrderedList: vi.fn(),
    run: vi.fn(),
  };
  Object.values(mockChain).forEach((fn) => fn.mockReturnValue(mockChain));

  const mockEditor = {
    chain: vi.fn(() => mockChain),
    isActive: vi.fn(() => false),
  };

  const useEditorMock = vi.fn();

  return { mockChain, mockEditor, useEditorMock };
});

vi.mock('@tiptap/react', () => ({
  useEditor: useEditorMock,
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));

import { DocumentDraftEditor } from '#/routes/_authenticated/applications/$applicationId/-components/DocumentDraftEditor';

describe('DocumentDraftEditor', () => {
  let capturedConfig: EditorUpdateConfig | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockChain).forEach((fn) => fn.mockReturnValue(mockChain));
    useEditorMock.mockImplementation((config: EditorUpdateConfig) => {
      capturedConfig = config;
      return mockEditor;
    });
  });

  it('renders nothing while the editor is not ready', () => {
    useEditorMock.mockReturnValue(null);
    const { container } = render(<DocumentDraftEditor contentJson="{}" onUpdate={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the toolbar and editor content once ready', () => {
    render(<DocumentDraftEditor contentJson="{}" onUpdate={vi.fn()} />);

    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('toggles bold when the bold toolbar button is clicked', () => {
    render(<DocumentDraftEditor contentJson="{}" onUpdate={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(mockChain.toggleBold).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it('falls back to undefined initial content for invalid JSON', () => {
    render(<DocumentDraftEditor contentJson="not json" onUpdate={vi.fn()} />);

    expect(useEditorMock).toHaveBeenCalledWith(expect.objectContaining({ content: undefined }));
  });

  it('debounces onUpdate calls from the editor', () => {
    vi.useFakeTimers();
    const onUpdate = vi.fn();
    render(<DocumentDraftEditor contentJson="{}" onUpdate={onUpdate} />);

    const fakeEditor = {
      getJSON: () => ({ type: 'doc' }),
      getText: () => 'hello world',
    };
    capturedConfig?.onUpdate({ editor: fakeEditor });

    expect(onUpdate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);

    expect(onUpdate).toHaveBeenCalledWith(JSON.stringify({ type: 'doc' }), 'hello world');
    vi.useRealTimers();
  });
});
