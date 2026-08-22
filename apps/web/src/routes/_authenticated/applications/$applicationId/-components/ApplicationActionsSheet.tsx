import { Link } from '@tanstack/react-router';
import { EditIcon, StarIcon, Trash2Icon } from 'lucide-react';
import { useLocale } from '#/lib/i18n';
import { Modal } from '@trakwyn/ui';

interface ApplicationActionsSheetProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  starred: boolean;
  onToggleStar: () => void;
  onDelete: () => void;
}

/**
 * The application's own actions, as labelled rows.
 *
 * They used to be four 32px icon buttons sharing the header row with the
 * company name — under the 44px minimum, and unlabelled. Here each is a 56px
 * row with words on it, and the header keeps a single trigger (JEF-208).
 */
export function ApplicationActionsSheet({
  open,
  onClose,
  applicationId,
  starred,
  onToggleStar,
  onDelete,
}: ApplicationActionsSheetProps) {
  const { t } = useLocale();

  const rowClass =
    'flex w-full items-center gap-3.5 px-5 text-left text-[15px] text-gray-900 dark:text-gray-100 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50';

  return (
    <Modal
      open={open}
      onClose={onClose}
      position="bottom"
      ariaLabel={t('applicationDetail.moreActions')}
    >
      <div className="flex flex-col pb-2">
        <div className="flex justify-center py-2.5">
          <div className="h-1 w-9 rounded-full bg-gray-200 dark:bg-gray-600" />
        </div>

        <button
          type="button"
          onClick={() => {
            onToggleStar();
            onClose();
          }}
          className={rowClass}
          style={{ minHeight: '56px' }}
        >
          <StarIcon
            size={20}
            className={starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}
          />
          <span className="flex-1">{t(starred ? 'applications.unstar' : 'applications.star')}</span>
        </button>

        <Link
          to="/applications/$applicationId/edit"
          params={{ applicationId }}
          onClick={onClose}
          className={rowClass}
          style={{ minHeight: '56px' }}
        >
          <EditIcon size={20} className="text-gray-500" />
          <span className="flex-1">{t('common.edit')}</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            onClose();
            onDelete();
          }}
          className="flex w-full items-center gap-3.5 border-t border-gray-100 px-5 text-left text-[15px] text-red-600 transition-colors hover:bg-red-50 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-900/20"
          style={{ minHeight: '56px' }}
        >
          <Trash2Icon size={20} />
          <span className="flex-1">{t('applicationDetail.deleteApplicationTitle')}</span>
        </button>
      </div>
    </Modal>
  );
}
