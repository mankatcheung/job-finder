import { Link } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  BarChart3,
  CalendarDays,
  Users,
  Bell,
  Shield,
  KeyRound,
  Puzzle,
  Globe,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { MarketingHeader } from '#/components/marketing/MarketingHeader';
import { MarketingFooter } from '#/components/marketing/MarketingFooter';

interface DeepDive {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  to:
    | '/features/tracking'
    | '/features/ai-assistant'
    | '/features/resume-cover-letter'
    | '/features/analytics';
  linkLabel: string;
  thumbnail: React.ReactNode;
}

const KANBAN_THUMB = (
  <div className="flex gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
    {[
      { label: 'Applied', color: 'border-t-blue-500 text-blue-700 dark:text-blue-400' },
      { label: 'Interviewing', color: 'border-t-purple-500 text-purple-700 dark:text-purple-400' },
      { label: 'Accepted', color: 'border-t-green-500 text-green-700 dark:text-green-400' },
    ].map((col) => (
      <div
        key={col.label}
        className={`flex-1 rounded-md border-t-[3px] border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800 ${col.color}`}
      >
        <div className="text-[10px] font-bold">{col.label}</div>
        <div className="mt-1.5 h-4 rounded border border-gray-200 dark:border-gray-700" />
      </div>
    ))}
  </div>
);

const CHAT_THUMB = (
  <div className="flex flex-col gap-1.5 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
    <div className="max-w-[75%] self-end rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] text-white">
      Haven&rsquo;t heard back in 2 weeks?
    </div>
    <div className="max-w-[82%] self-start rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
      Two applications — want a follow-up drafted?
    </div>
  </div>
);

const RESUME_THUMB = (
  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
    <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">Priya Anand</div>
    <div className="mt-1.5 space-y-1">
      <div className="h-1 w-3/4 rounded bg-gray-300 dark:bg-gray-600" />
      <div className="h-1 w-11/12 rounded bg-gray-300 dark:bg-gray-600" />
      <div className="h-1 w-2/3 rounded bg-blue-300 dark:bg-blue-700" />
    </div>
  </div>
);

const ANALYTICS_THUMB = (
  <div className="flex h-16 items-end gap-1.5 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
    {[90, 70, 42, 18, 10].map((h, i) => (
      <div
        key={i}
        className="flex-1 rounded-t bg-blue-500"
        style={{ height: `${h}%`, opacity: 1 - i * 0.12 }}
      />
    ))}
  </div>
);

const DEEP_DIVES: DeepDive[] = [
  {
    icon: LayoutDashboard,
    title: 'Application tracking & Kanban board',
    description:
      'Every application lives in one pipeline instead of a spreadsheet and three email folders. Drag a card as it moves, or work from a plain list — whichever fits how you think.',
    bullets: [
      'Board or list view, seven pipeline stages',
      'Notes, contacts, documents and an activity log per application',
      'Interview and follow-up reminders, so nothing goes cold',
    ],
    to: '/features/tracking',
    linkLabel: 'Explore application tracking',
    thumbnail: KANBAN_THUMB,
  },
  {
    icon: Sparkles,
    title: 'AI assistant',
    description:
      'A chat that actually knows your pipeline — not a generic bot in a corner. It can see your applications, notes and interviews when you ask it something.',
    bullets: [
      'Grounded in your real data, not generic advice',
      'Bring your own key — OpenAI, Anthropic, or compatible',
      'Every conversation saved and searchable later',
    ],
    to: '/features/ai-assistant',
    linkLabel: 'Explore the AI assistant',
    thumbnail: CHAT_THUMB,
  },
  {
    icon: FileText,
    title: 'Resume & cover letter generation',
    description:
      "Drafted from your real work history, skills and notes — plus the job posting itself. Nothing it writes is something you didn't tell it.",
    bullets: [
      'Grounded in your stored experience — no invented history',
      'Tailored to the posting and company briefing',
      'Versioned drafts you can edit, regenerate and track',
    ],
    to: '/features/resume-cover-letter',
    linkLabel: 'Explore resume & cover letters',
    thumbnail: RESUME_THUMB,
  },
  {
    icon: BarChart3,
    title: 'Analytics & insights',
    description:
      'Response rates, interview conversion, ghosting patterns and time-to-offer — the numbers behind your search, not just a list of applications.',
    bullets: [
      'Your funnel, stage by stage',
      "Know when you're likely being ghosted",
      'See which channels actually convert',
    ],
    to: '/features/analytics',
    linkLabel: 'Explore analytics',
    thumbnail: ANALYTICS_THUMB,
  },
];

const EVERYTHING_ELSE: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: CalendarDays,
    title: 'Calendar & reminders',
    description: 'Interviews and follow-ups on one calendar.',
  },
  { icon: Users, title: 'Contacts', description: 'Recruiters and interviewers, per application.' },
  { icon: FileText, title: 'Documents', description: 'Every resume and letter version, kept.' },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'In-app and push, so reminders reach you.',
  },
  {
    icon: Shield,
    title: 'Security',
    description: '2FA, session management, sign-in alerts.',
  },
  {
    icon: KeyRound,
    title: 'Bring your own AI key',
    description: 'Your provider, your usage, your cost.',
  },
  {
    icon: Puzzle,
    title: 'Browser extension',
    description: "Save a posting from the page you're on.",
  },
  { icon: Globe, title: '5 languages', description: 'English, Cantonese, Mandarin and more.' },
];

export function FeaturesIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MarketingHeader activeFeatures />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-20 sm:py-24 text-center">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-900" />
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
              See what Trakwyn actually does
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Four things it&rsquo;s built to do well — plus everything else that keeps a job search
              from falling through the cracks.
            </p>
          </div>
        </section>

        {/* Deep dives */}
        {DEEP_DIVES.map((feature, i) => {
          const reversed = i % 2 === 1;
          return (
            <div key={feature.to} className={reversed ? 'bg-gray-100 dark:bg-gray-800/30' : ''}>
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                  <div className={reversed ? 'lg:order-2' : ''}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                      <feature.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                      {feature.title}
                    </h2>
                    <p className="mt-3.5 text-base leading-7 text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                    <ul className="mt-4 flex flex-col gap-2.5">
                      {feature.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={feature.to}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {feature.linkLabel} →
                    </Link>
                  </div>
                  <div
                    className={`rounded-2xl border border-gray-200 bg-white p-3 shadow-lg shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-800/50 ${reversed ? 'lg:order-1' : ''}`}
                  >
                    {feature.thumbnail}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Everything else */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
            And everything else that keeps a search on track
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EVERYTHING_ELSE.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <item.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <div className="mt-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">
            Ready to see it on your own applications?
          </h2>
          <Link
            to="/register"
            className="mt-7 inline-block rounded-lg bg-white px-7 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Get started free
          </Link>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
