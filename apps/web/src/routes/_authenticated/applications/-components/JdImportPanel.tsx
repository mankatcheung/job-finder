import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { SparklesIcon } from 'lucide-react';
import { Button, Input } from '@job-finder/ui';

const PARSE_JD_MUTATION = `
  mutation ParseJobDescription($text: String, $url: String) {
    parseJobDescription(text: $text, url: $url) {
      company role location salary description
    }
  }
`;

type ParsedJd = {
  company: string | null;
  role: string | null;
  location: string | null;
  salary: string | null;
  description: string | null;
};

interface Props {
  onFill: (data: ParsedJd) => void;
}

export function JdImportPanel({ onFill }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'text' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiNotConfigured, setAiNotConfigured] = useState(false);
  const [filled, setFilled] = useState(false);

  const handleAutoFill = async () => {
    setError(null);
    setAiNotConfigured(false);
    setFilled(false);
    setLoading(true);
    try {
      const vars = mode === 'text' ? { text } : { url };
      const data = await gqlClient.request<{ parseJobDescription: ParsedJd }>(
        PARSE_JD_MUTATION,
        vars,
      );
      onFill(data.parseJobDescription);
      setFilled(true);
      setTimeout(() => setOpen(false), 800);
    } catch (err) {
      if (getGqlErrorCode(err) === AI_NOT_CONFIGURED_CODE) {
        setAiNotConfigured(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to parse job description');
      }
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (active: boolean) =>
    active
      ? 'px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
      : 'px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors';

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <SparklesIcon size={15} className="text-blue-500 shrink-0" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          Auto-fill from job posting
        </span>
        <span className="ml-auto text-xs text-blue-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-200 dark:border-blue-800 pt-3">
          <div className="flex gap-1 p-1 bg-blue-100 dark:bg-blue-900/40 rounded-lg w-fit">
            <button
              type="button"
              className={tabClass(mode === 'text')}
              onClick={() => setMode('text')}
            >
              Paste text
            </button>
            <button
              type="button"
              className={tabClass(mode === 'url')}
              onClick={() => setMode('url')}
            >
              From URL
            </button>
          </div>

          {mode === 'text' ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Paste the job description here…"
              className={`${inputClass} resize-none`}
            />
          ) : (
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://company.com/jobs/..."
            />
          )}

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          {aiNotConfigured && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Add your AI API key in{' '}
              <Link to="/settings/profile" className="underline">
                Account settings
              </Link>{' '}
              to use this feature.
            </p>
          )}

          <Button
            onClick={handleAutoFill}
            disabled={loading || (mode === 'text' ? !text.trim() : !url.trim())}
          >
            <span className="flex items-center gap-2">
              <SparklesIcon size={13} />
              {loading ? 'Parsing…' : filled ? 'Filled!' : 'Auto-fill fields'}
            </span>
          </Button>
          <p className="text-xs text-blue-500 dark:text-blue-400">
            Fields will be pre-filled — you can review and edit before saving.
          </p>
        </div>
      )}
    </div>
  );
}
