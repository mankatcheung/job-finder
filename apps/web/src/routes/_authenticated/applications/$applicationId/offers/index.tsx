import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import { OfferForm } from '../-components/OfferForm';
import { PlusIcon, TrashIcon, PencilIcon } from 'lucide-react';
import { EmptyState } from '@trakwyn/ui';

const OFFERS_QUERY = `
  query Offers($applicationId: ID!) {
    offers(applicationId: $applicationId) {
      id
      applicationId
      baseSalary
      bonus
      equity
      benefits
      costOfLivingAdjustment
      currency
      period
      notes
      createdAt
      updatedAt
    }
  }
`;

const CREATE_OFFER_MUTATION = `
  mutation CreateOffer($input: CreateOfferInput!) {
    createOffer(input: $input) {
      id
    }
  }
`;

const UPDATE_OFFER_MUTATION = `
  mutation UpdateOffer($input: UpdateOfferInput!) {
    updateOffer(input: $input) {
      id
    }
  }
`;

const DELETE_OFFER_MUTATION = `
  mutation DeleteOffer($id: ID!) {
    deleteOffer(id: $id)
  }
`;

interface Offer {
  id: string;
  applicationId: string;
  baseSalary: number;
  bonus: number | null;
  equity: string | null;
  benefits: string | null;
  costOfLivingAdjustment: number | null;
  currency: string;
  period: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute('/_authenticated/applications/$applicationId/offers/')({
  component: OffersPage,
});

function OffersPage() {
  const { t } = useLocale();
  const { applicationId } = Route.useParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    gqlClient
      .request<{ offers: Offer[] }>(OFFERS_QUERY, { applicationId })
      .then((res) => setOffers(res.offers))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleCreate = async (data: {
    baseSalary: number;
    bonus: number | null;
    equity: string;
    benefits: string;
    costOfLivingAdjustment: number | null;
    currency: string;
    period: string;
    notes: string;
  }) => {
    setSaving(true);
    try {
      await gqlClient.request(CREATE_OFFER_MUTATION, {
        input: { applicationId, ...data },
      });
      const res = await gqlClient.request<{ offers: Offer[] }>(OFFERS_QUERY, { applicationId });
      setOffers(res.offers);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create offer:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: {
    baseSalary: number;
    bonus: number | null;
    equity: string;
    benefits: string;
    costOfLivingAdjustment: number | null;
    currency: string;
    period: string;
    notes: string;
  }) => {
    if (!editingOffer) return;
    setSaving(true);
    try {
      await gqlClient.request(UPDATE_OFFER_MUTATION, {
        input: { offerId: editingOffer.id, ...data },
      });
      const res = await gqlClient.request<{ offers: Offer[] }>(OFFERS_QUERY, { applicationId });
      setOffers(res.offers);
      setEditingOffer(null);
    } catch (err) {
      console.error('Failed to update offer:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm(t('offers.deleteConfirm'))) return;
    try {
      await gqlClient.request(DELETE_OFFER_MUTATION, { id: offerId });
      setOffers(offers.filter((o) => o.id !== offerId));
    } catch (err) {
      console.error('Failed to delete offer:', err);
    }
  };

  const formatSalary = (amount: number, currency: string, period: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

    if (period === 'yearly') return `${formatted}/yr`;
    if (period === 'monthly') return `${formatted}/mo`;
    if (period === 'weekly') return `${formatted}/wk`;
    return `${formatted}/hr`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">{t('offerCompare.loadingOffers')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('offers.title')}</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingOffer(null);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          {t('offers.addOffer')}
        </button>
      </div>

      {(showForm || editingOffer) && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {editingOffer ? t('offers.editOffer') : t('offers.newOffer')}
          </h2>
          <OfferForm
            initialData={editingOffer ?? undefined}
            onSubmit={editingOffer ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingOffer(null);
            }}
            loading={saving}
          />
        </div>
      )}

      {offers.length === 0 && !showForm ? (
        <EmptyState className="py-12" message={t('offers.noOffersYet')} />
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatSalary(offer.baseSalary, offer.currency, offer.period)}
                  </div>
                  {offer.bonus && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      + {formatSalary(offer.bonus, offer.currency, offer.period)}{' '}
                      {t('offerCompare.bonusSuffix')}
                    </div>
                  )}
                  {offer.equity && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('offers.equityLabel', { equity: offer.equity })}
                    </div>
                  )}
                  {offer.benefits && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('offers.benefitsLabel', { benefits: offer.benefits })}
                    </div>
                  )}
                  {offer.notes && (
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {offer.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingOffer(offer);
                      setShowForm(false);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
