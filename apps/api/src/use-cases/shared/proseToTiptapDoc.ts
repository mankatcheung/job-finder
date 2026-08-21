/**
 * Converts plain prose into the ProseMirror/Tiptap document JSON that
 * `DocumentDraft.contentJson` stores, so anything creating a draft
 * server-side produces content the editor can open.
 *
 * A blank line becomes an empty paragraph with **no** content array. A text
 * node with an empty string is invalid in ProseMirror and makes the editor
 * throw on load, which is what the equivalent conversion on the client does
 * today for every blank line between paragraphs — precisely where prose has
 * them.
 */
export function proseToTiptapDoc(text: string): { contentJson: string; plainText: string } {
  const plainText = text.trim();
  const lines = plainText.length > 0 ? plainText.split('\n') : [''];

  return {
    contentJson: JSON.stringify({
      type: 'doc',
      content: lines.map((line) =>
        line.trim().length > 0
          ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
          : { type: 'paragraph' },
      ),
    }),
    plainText,
  };
}
