import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CopyIcon } from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { Button, Card, Spinner } from '@trakwyn/ui';

const GENERATE_COMPANY_BRIEFING = `
  mutation GenerateCompanyBriefing($applicationId: ID!) {
    generateCompanyBriefing(applicationId: $applicationId)
  }
`;

export function CompanyBriefingTab({ applicationId }: { applicationId: string }) {
  const [briefing, setBriefing] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useMutation({
    mutationFn: () =>
      gqlClient.request<{ generateCompanyBriefing: string }>(GENERATE_COMPANY_BRIEFING, {
        applicationId,
      }),
    onSuccess: (data) => {
      setBriefing(data.generateCompanyBriefing);
      setCopied(false);
    },
  });

  const handleCopy = () => {
    void navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate a quick pre-interview briefing — company overview, likely culture and interview
          style, and talking points — based on this application&apos;s company, role, and job
          description.
        </p>
        <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
          <span className="flex items-center gap-2">
            {generate.isPending ? (
              <>
                <Spinner tone="white" />
                Researching…
              </>
            ) : (
              <>✨ {briefing ? 'Regenerate' : 'Generate briefing'}</>
            )}
          </span>
        </Button>
        {generate.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {getGqlErrorCode(generate.error) === AI_NOT_CONFIGURED_CODE ? (
              <>
                Add your AI API key in{' '}
                <Link to="/settings/profile" className="underline">
                  Account settings
                </Link>{' '}
                to use this feature.
              </>
            ) : (
              (generate.error as Error).message
            )}
          </p>
        )}
      </Card>

      {briefing && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Company briefing
            </h3>
            <Button variant="secondary" size="sm" onClick={handleCopy} aria-label="Copy">
              <span className="flex items-center gap-1">
                <CopyIcon size={14} />{' '}
                <span className="hidden sm:inline">{copied ? '✓ Copied' : 'Copy'}</span>
              </span>
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            AI-generated from general knowledge — not live data. Verify anything time-sensitive
            before your interview.
          </p>
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
            {briefing}
          </pre>
        </Card>
      )}
    </div>
  );
}
