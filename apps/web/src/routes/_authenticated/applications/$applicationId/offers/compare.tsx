import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import { GitCompareArrowsIcon, CheckIcon } from 'lucide-react';
import { Button, EmptyState } from '@trakwyn/ui';

const OFFERS_QUERY = `
  query Offers($applicationId: ID!) {
    offers(applicationId: $applicationId) {
      id
      baseSalary
      bonus
      equity
      benefits
      costOfLivingAdjustment
      currency
      period
    }
  }
`;

const COMPARE_OFFERS_MUTATION = `
  mutation CompareOffers($offerIds: [String!]!) {
    compareOffers(offerIds: $offerIds) {
      offer {
        id
        baseSalary
        bonus
        equity
        benefits
        costOfLivingAdjustment
        currency
        period
      }
      company
      role
      normalizedYearlySalary
      totalCompensation
    }
  }
`;

interface Offer {
  id: string;
  baseSalary: number;
  bonus: number | null;
  equity: string | null;
  benefits: string | null;
  costOfLivingAdjustment: number | null;
  currency: string;
  period: string;
}

interface OfferComparison {
  offer: Offer;
  company: string;
  role: string;
  normalizedYearlySalary: number;
  totalCompensation: number;
}

export const Route = createFileRoute('/_authenticated/applications/$applicationId/offers/compare')({
  component: CompareOffersPage,
});

function CompareOffersPage() {
  const { t } = useLocale();
  const { applicationId } = Route.useParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<OfferComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    gqlClient
      .request<{ offers: Offer[] }>(OFFERS_QUERY, { applicationId })
      .then((res) => setOffers(res.offers))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [applicationId]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    setComparing(true);
    try {
      const res = await gqlClient.request<{ compareOffers: OfferComparison[] }>(
        COMPARE_OFFERS_MUTATION,
        { offerIds: selectedIds },
      );
      setComparisons(res.compareOffers);
    } catch (err) {
      console.error('Failed to compare offers:', err);
    } finally {
      setComparing(false);
    }
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">{t('offerCompare.loadingOffers')}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('offerCompare.title')}
        </h1>
        <Button onClick={handleCompare} disabled={selectedIds.length < 2 || comparing}>
          <span className="inline-flex items-center gap-1.5">
            <GitCompareArrowsIcon className="size-4" />
            {comparing
              ? t('offerCompare.comparing')
              : t('offerCompare.compareCount', { count: selectedIds.length })}
          </span>
        </Button>
      </div>

      {offers.length === 0 ? (
        <EmptyState className="py-12" message={t('offerCompare.noOffersToCompare')} />
      ) : (
        <>
          <div className="mb-6">
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {t('offerCompare.selectHint')}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => toggleSelection(offer.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedIds.includes(offer.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatSalary(offer.baseSalary)}/{offer.period}
                      </div>
                      {offer.bonus && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          +{formatSalary(offer.bonus)} {t('offerCompare.bonusSuffix')}
                        </div>
                      )}
                    </div>
                    {selectedIds.includes(offer.id) && (
                      <CheckIcon className="size-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {comparisons.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offerCompare.companyHeader')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offerCompare.roleHeader')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offerCompare.baseYearlyHeader')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offerCompare.totalCompHeader')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offerForm.equityLabel')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offerForm.benefitsLabel')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {comparisons.map((comp, index) => (
                    <tr
                      key={comp.offer.id}
                      className={index === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {comp.company}
                        {index === 0 && (
                          <span className="ml-2 text-xs font-normal text-green-600">
                            {t('offerCompare.best')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {comp.role}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                        {formatSalary(comp.normalizedYearlySalary)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatSalary(comp.totalCompensation)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {comp.offer.equity || '—'}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {comp.offer.benefits || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
