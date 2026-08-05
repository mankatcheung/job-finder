import { useState } from 'react';

interface OfferFormData {
  baseSalary: number;
  bonus: number | null;
  equity: string;
  benefits: string;
  costOfLivingAdjustment: number | null;
  currency: string;
  period: string;
  notes: string;
}

interface OfferFormProps {
  initialData?: {
    baseSalary?: number;
    bonus?: number | null;
    equity?: string | null;
    benefits?: string | null;
    costOfLivingAdjustment?: number | null;
    currency?: string;
    period?: string;
    notes?: string | null;
  };
  onSubmit: (data: OfferFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'HKD', 'TWD', 'CNY'];
const PERIODS = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'hourly', label: 'Hourly' },
];

export function OfferForm({ initialData, onSubmit, onCancel, loading }: OfferFormProps) {
  const [formData, setFormData] = useState<OfferFormData>({
    baseSalary: initialData?.baseSalary ?? 0,
    bonus: initialData?.bonus ?? null,
    equity: initialData?.equity ?? '',
    benefits: initialData?.benefits ?? '',
    costOfLivingAdjustment: initialData?.costOfLivingAdjustment ?? null,
    currency: initialData?.currency ?? 'USD',
    period: initialData?.period ?? 'yearly',
    notes: initialData?.notes ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base Salary *
          </label>
          <input
            type="number"
            value={formData.baseSalary}
            onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bonus
          </label>
          <input
            type="number"
            value={formData.bonus ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, bonus: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            min={0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Period
          </label>
          <select
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Equity
        </label>
        <input
          type="text"
          value={formData.equity}
          onChange={(e) => setFormData({ ...formData, equity: e.target.value })}
          placeholder="e.g., 1000 RSUs over 4 years"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Benefits
        </label>
        <textarea
          value={formData.benefits}
          onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
          placeholder="e.g., Health insurance, 401k match, unlimited PTO"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cost of Living Adjustment (%)
        </label>
        <input
          type="number"
          value={formData.costOfLivingAdjustment ?? ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              costOfLivingAdjustment: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || formData.baseSalary <= 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save Offer'}
        </button>
      </div>
    </form>
  );
}
