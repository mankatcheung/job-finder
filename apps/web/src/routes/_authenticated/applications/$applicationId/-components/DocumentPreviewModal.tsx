import { XIcon, ExternalLinkIcon } from 'lucide-react';
import { useLocale } from '#/lib/i18n';
import { IconButton, Modal } from '@trakwyn/ui';

const PREVIEWABLE_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export function isPreviewableMimeType(mimeType: string): boolean {
  return PREVIEWABLE_MIME_TYPES.includes(mimeType);
}

export interface PreviewableDocument {
  name: string;
  mimeType: string;
  url: string;
}

interface DocumentPreviewModalProps {
  document: PreviewableDocument | null;
  onClose: () => void;
}

export function DocumentPreviewModal({ document: doc, onClose }: DocumentPreviewModalProps) {
  const { t } = useLocale();
  if (!doc) return null;

  const isPdf = doc.mimeType === 'application/pdf';
  const isImage = doc.mimeType === 'image/png' || doc.mimeType === 'image/jpeg';

  return (
    <Modal open onClose={onClose} size="lg">
      <div className="h-[80vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {doc.name}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              title={t('documents.openInNewTab')}
            >
              <ExternalLinkIcon size={16} />
            </a>
            <IconButton label={t('common.close')} icon={<XIcon size={16} />} onClick={onClose} />
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-900 overflow-auto">
          {isPdf ? (
            <iframe src={doc.url} title={doc.name} className="w-full h-full border-0" />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={doc.url} alt={doc.name} className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('documentPreview.noPreviewAvailable')}
              </p>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t('documentPreview.openDocument', { name: doc.name })}
              </a>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
