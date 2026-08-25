import { FileText, Shield, Check } from 'lucide-react';
import { FeaturePageLayout } from '#/components/marketing/FeaturePageLayout';

function ResumeMockup() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-lg shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Priya Anand</div>
        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Senior Product Designer · San Francisco, CA
        </div>
        <div className="mt-5 text-[11px] font-bold tracking-wide text-blue-600 uppercase">
          Experience
        </div>
        <div className="mt-2.5 space-y-2">
          <div className="h-1.5 w-3/5 rounded-sm bg-gray-200 dark:bg-gray-700" />
          <div className="h-1.5 w-11/12 rounded-sm bg-gray-200 dark:bg-gray-700" />
          <div className="h-1.5 w-4/5 rounded-sm bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mt-5 text-[11px] font-bold tracking-wide text-blue-600 uppercase">
          Skills
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {['Design systems', 'Figma', '0→1 product'].map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
          <div className="text-xs font-bold text-gray-900 dark:text-gray-100">Tailored for</div>
          <div className="mt-1.5 text-sm text-gray-700 dark:text-gray-300">Northwind Labs</div>
          <div className="text-xs text-gray-400">Senior Product Designer</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-400">
            <Shield className="size-3.5" />
            Grounded, not invented
          </div>
          <p className="mt-1.5 text-xs/relaxed text-green-800 dark:text-green-500">
            Every line traces back to your stored experience, education or skills — never
            fabricated.
          </p>
        </div>
      </div>
    </div>
  );
}

export function FeatureResumeCoverLetterPage() {
  return (
    <FeaturePageLayout
      eyebrowIcon={FileText}
      eyebrowLabel="Resume & cover letters"
      title="Tailored to the job — not invented"
      description="Generated from your real work history, skills and notes, plus the job posting and a company briefing. Nothing it writes is something you didn't tell it."
      heroVisual={<ResumeMockup />}
      heroVisualMaxWidth="max-w-3xl"
      benefits={[
        {
          title: 'Grounded, not generated from thin air',
          description:
            "It only draws from what's actually in your profile — your stored work experience, education, and skills. If it isn't in your history, it doesn't end up on the page. No invented job titles, no fabricated metrics.",
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Drawn from
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                {[
                  "Work experience you've added",
                  'Education & skills on your profile',
                  'Notes on the specific application',
                ].map((line) => (
                  <div
                    key={line}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Check className="size-3.5 shrink-0 text-blue-600" />
                    {line}
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: 'Tailored to the role',
          description:
            'It reads the job posting and a short company briefing to decide what to emphasize — so the same work history reads differently for a design-systems role than for a 0→1 product role.',
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Company briefing
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Northwind Labs</div>
              <div className="mt-3 space-y-2">
                <div className="h-1.5 w-11/12 rounded-sm bg-gray-200 dark:bg-gray-700" />
                <div className="h-1.5 w-3/4 rounded-sm bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Series B · healthtech · design-led culture
              </div>
            </div>
          ),
        },
        {
          title: 'Yours to refine',
          description:
            'Every draft is a version you can edit and regenerate. See which version actually got a response, so the next tailor-job starts from what already worked.',
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5 dark:bg-blue-900/30">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  v3 · Northwind Labs
                </span>
                <span className="text-xs font-bold text-green-600">Got a reply</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  v2 · Northwind Labs
                </span>
                <span className="text-xs text-gray-400">No reply</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  v1 · Northwind Labs
                </span>
                <span className="text-xs text-gray-400">No reply</span>
              </div>
            </div>
          ),
        },
      ]}
      ctaHeadline="Draft your next resume in minutes"
    />
  );
}
