import type { IPdfRenderer, PdfRenderData } from '#src/use-cases/ports/IPdfRenderer.js';
import type { JSONContent } from '@tiptap/core';

function extractTextFromNode(node: JSONContent): string {
  if (node.text) return node.text;

  const childTexts = (node.content ?? []).map(extractTextFromNode);
  let text = childTexts.join('');

  if (node.type === 'paragraph' || node.type === 'heading') {
    text += '\n';
  }
  if (node.type === 'bulletList' || node.type === 'orderedList') {
    text += '\n';
  }
  if (node.type === 'listItem') {
    text = '- ' + text;
  }

  return text;
}

export function prosemirrorToPlainText(json: string): string {
  try {
    const content = JSON.parse(json) as JSONContent;
    return extractTextFromNode(content)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return '';
  }
}

/**
 * PDF renderer using @react-pdf/renderer.
 * Converts TipTap/ProseMirror JSON to a PDF buffer.
 */
export class ReactPdfDocumentRenderer implements IPdfRenderer {
  async render(data: PdfRenderData): Promise<Buffer> {
    const { Document, Page, Text, StyleSheet, renderToBuffer } =
      await import('@react-pdf/renderer');

    const styles = StyleSheet.create({
      page: {
        padding: 40,
        fontSize: 11,
        fontFamily: 'Helvetica',
        lineHeight: 1.5,
      },
      title: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 16,
      },
      heading1: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 8,
        marginTop: 16,
      },
      heading2: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 6,
        marginTop: 12,
      },
      heading3: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
        marginTop: 10,
      },
      paragraph: {
        marginBottom: 8,
      },
      bulletItem: {
        marginBottom: 4,
        paddingLeft: 16,
      },
      bold: {
        fontFamily: 'Helvetica-Bold',
      },
      italic: {
        fontFamily: 'Helvetica-Oblique',
      },
    });

    let content: JSONContent;
    try {
      content = JSON.parse(data.contentJson);
    } catch {
      content = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
      };
    }

    const renderNode = (node: JSONContent, index: number): React.ReactNode => {
      if (node.type === 'doc') {
        return (node.content ?? []).map((child, i) => renderNode(child, i));
      }

      if (node.type === 'heading') {
        const level = node.attrs?.level ?? 1;
        const headingStyle =
          level === 1 ? styles.heading1 : level === 2 ? styles.heading2 : styles.heading3;
        return (
          <Text key={index} style={headingStyle}>
            {(node.content ?? []).map((child, i) => renderNode(child, i))}
          </Text>
        );
      }

      if (node.type === 'paragraph') {
        return (
          <Text key={index} style={styles.paragraph}>
            {(node.content ?? []).map((child, i) => renderNode(child, i))}
          </Text>
        );
      }

      if (node.type === 'bulletList' || node.type === 'orderedList') {
        return (node.content ?? []).map((child, i) => renderNode(child, i));
      }

      if (node.type === 'listItem') {
        return (
          <Text key={index} style={styles.bulletItem}>
            {'• '}
            {(node.content ?? []).map((child, i) => renderNode(child, i))}
          </Text>
        );
      }

      if (node.type === 'text') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let textStyle: any = {};
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') textStyle = { ...textStyle, fontFamily: 'Helvetica-Bold' };
            if (mark.type === 'italic')
              textStyle = { ...textStyle, fontFamily: 'Helvetica-Oblique' };
          }
        }
        return (
          <Text key={index} style={textStyle}>
            {node.text ?? ''}
          </Text>
        );
      }

      return null;
    };

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>{data.title}</Text>
          {renderNode(content, 0)}
        </Page>
      </Document>
    );

    const buffer = await renderToBuffer(doc);
    return Buffer.from(buffer);
  }
}
