import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CopyIcon } from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { useLocale } from '#/lib/i18n';
import { Button, Card, FormLabel, Spinner, Textarea } from '@trakwyn/ui';

const GENERATE_COVER_LETTER = `
  mutation GenerateCoverLetter($applicationId: ID!, $resumeText: String) {
    generateCoverLetter(applicationId: $applicationId, resumeText: $resumeText)
  }
`;

export function CoverLetterTab({ applicationId }: { applicationId: string }) {
  const { t } = useLocale();
  const [resumeText, setResumeText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useMutation({
    mutationFn: () =>
      gqlClient.request<{ generateCoverLetter: string }>(GENERATE_COVER_LETTER, {
        applicationId,
        resumeText: resumeText.trim() || null,
      }),
    onSuccess: (data) => {
      setCoverLetter(data.generateCoverLetter);
      setCopied(false);
    },
  });

  const handleCopy = () => {
    void navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div>
          <FormLabel>
            {t('coverLetter.resumeBackgroundLabel')}{' '}
            <span className="font-normal text-gray-400">
              ({t('coverLetter.optionalTailoredNote')})
            </span>
          </FormLabel>
          <Textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={6}
            placeholder={t('coverLetter.pastePlaceholder')}
          />
        </div>
        <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
          <span className="flex items-center gap-2">
            {generate.isPending ? (
              <>
                <Spinner tone="white" />
                {t('coverLetter.generating')}
              </>
            ) : (
              <>
                ✨{' '}
                {coverLetter
                  ? t('companyBriefing.regenerate')
                  : t('coverLetter.generateCoverLetter')}
              </>
            )}
          </span>
        </Button>
        {generate.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {getGqlErrorCode(generate.error) === AI_NOT_CONFIGURED_CODE ? (
              <>
                {t('resumeMatch.addApiKeyPrefix')}{' '}
                <Link to="/settings/profile" className="underline">
                  {t('resumeMatch.accountSettingsLinkText')}
                </Link>{' '}
                {t('resumeMatch.addApiKeySuffix')}
              </>
            ) : (
              (generate.error as Error).message
            )}
          </p>
        )}
      </Card>

      {coverLetter && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('coverLetter.generatedTitle')}
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              aria-label={t('common.copy')}
            >
              <span className="flex items-center gap-1">
                <CopyIcon size={14} />{' '}
                <span className="hidden sm:inline">
                  {copied ? t('companyBriefing.copied') : t('common.copy')}
                </span>
              </span>
            </Button>
          </div>
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
            {coverLetter}
          </pre>
        </Card>
      )}
    </div>
  );
}
