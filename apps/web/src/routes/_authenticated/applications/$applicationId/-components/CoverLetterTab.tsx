import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CopyIcon } from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';

const GENERATE_COVER_LETTER = `
  mutation GenerateCoverLetter($applicationId: ID!, $resumeText: String) {
    generateCoverLetter(applicationId: $applicationId, resumeText: $resumeText)
  }
`;

export function CoverLetterTab({ applicationId }: { applicationId: string }) {
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

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your resume / background{' '}
            <span className="font-normal text-gray-400">
              (optional — paste for a tailored letter)
            </span>
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={6}
            placeholder="Paste your resume or relevant experience here…"
            className={inputCls}
          />
        </div>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {generate.isPending ? (
            <>
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              Generating…
            </>
          ) : (
            <>✨ {coverLetter ? 'Regenerate' : 'Generate cover letter'}</>
          )}
        </button>
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
      </div>

      {coverLetter && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated cover letter
            </h3>
            <button
              onClick={handleCopy}
              aria-label="Copy"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <CopyIcon size={14} />{' '}
              <span className="hidden sm:inline">{copied ? '✓ Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
            {coverLetter}
          </pre>
        </div>
      )}
    </div>
  );
}
