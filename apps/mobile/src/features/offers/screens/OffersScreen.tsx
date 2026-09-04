import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useCreateOffer,
  useDeleteOffer,
  useOffers,
  useUpdateOffer,
} from '../hooks/useOfferQueries';
import { OfferForm } from '../components/OfferForm';
import { formatSalary } from '../lib/formatSalary';
import { getErrorMessage } from '../../../lib/errors';
import type { Offer, OfferFormData } from '../types';

export function OffersScreen() {
  const router = useRouter();
  const { id: applicationId } = useLocalSearchParams<{ id: string }>();
  const { data: offers, isLoading, isError, error } = useOffers(applicationId);
  const createOffer = useCreateOffer(applicationId);
  const updateOffer = useUpdateOffer(applicationId);
  const deleteOffer = useDeleteOffer(applicationId);

  const [formOpen, setFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingOffer(null);
    setFormOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormOpen(true);
  };

  const onSave = async (data: OfferFormData) => {
    setSaveError(null);
    try {
      if (editingOffer) {
        await updateOffer.mutateAsync({ offerId: editingOffer.id, data });
      } else {
        await createOffer.mutateAsync(data);
      }
      setFormOpen(false);
      setEditingOffer(null);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    }
  };

  const items = offers ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Offers</Text>
        <View style={styles.headerActions}>
          {items.length >= 2 && (
            <Pressable
              onPress={() => router.push(`/applications/${applicationId}/offers/compare`)}
              testID="compare-offers-button"
            >
              <Text style={styles.link}>Compare</Text>
            </Pressable>
          )}
          {!formOpen && (
            <Pressable onPress={openCreate} testID="add-offer-button">
              <Text style={styles.link}>+ Add offer</Text>
            </Pressable>
          )}
        </View>
      </View>

      {formOpen && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingOffer ? 'Edit offer' : 'New offer'}</Text>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          <OfferForm
            initialData={editingOffer}
            onSubmit={onSave}
            onCancel={() => {
              setFormOpen(false);
              setEditingOffer(null);
            }}
            loading={createOffer.isPending || updateOffer.isPending}
          />
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#2563eb" />
      ) : isError ? (
        <Text style={styles.error}>{getErrorMessage(error)}</Text>
      ) : items.length === 0 && !formOpen ? (
        <Text style={styles.emptyText}>No offers yet.</Text>
      ) : (
        items.map((offer) => (
          <View key={offer.id} style={styles.offerCard} testID={`offer-${offer.id}`}>
            <View style={styles.offerCardHeader}>
              <View>
                <Text style={styles.offerSalary}>
                  {formatSalary(offer.baseSalary, offer.currency, offer.period)}
                </Text>
                {offer.bonus ? (
                  <Text style={styles.offerMeta}>
                    + {formatSalary(offer.bonus, offer.currency, offer.period)} bonus
                  </Text>
                ) : null}
                {offer.equity ? <Text style={styles.offerMeta}>Equity: {offer.equity}</Text> : null}
                {offer.benefits ? (
                  <Text style={styles.offerMeta}>Benefits: {offer.benefits}</Text>
                ) : null}
                {offer.notes ? <Text style={styles.offerNotes}>{offer.notes}</Text> : null}
              </View>
              <View style={styles.offerActions}>
                <Pressable onPress={() => openEdit(offer)} testID={`edit-offer-${offer.id}`}>
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => deleteOffer.mutate(offer.id)}
                  testID={`delete-offer-${offer.id}`}
                >
                  <Text style={styles.linkDanger}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 16 },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  linkDanger: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 4,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  loading: { marginTop: 24 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  offerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  offerCardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  offerSalary: { fontSize: 17, fontWeight: '700', color: '#111827' },
  offerMeta: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  offerNotes: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  offerActions: { gap: 8, alignItems: 'flex-end' },
});
