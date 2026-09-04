import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCompareOffers, useOffers } from '../hooks/useOfferQueries';
import { formatSalary } from '../lib/formatSalary';
import { getErrorMessage } from '../../../lib/errors';
import type { OfferComparison } from '../types';

export function CompareOffersScreen() {
  const { id: applicationId } = useLocalSearchParams<{ id: string }>();
  const { data: offers, isLoading } = useOffers(applicationId);
  const compareOffers = useCompareOffers();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<OfferComparison[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const onCompare = async () => {
    if (selectedIds.length < 2) return;
    setError(null);
    try {
      const result = await compareOffers.mutateAsync(selectedIds);
      setComparisons(result);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const items = offers ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Compare offers</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>No offers to compare.</Text>
      ) : (
        <>
          <Text style={styles.hint}>Select two or more offers to compare.</Text>
          <View style={styles.optionsGrid}>
            {items.map((offer) => {
              const selected = selectedIds.includes(offer.id);
              return (
                <Pressable
                  key={offer.id}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => toggleSelection(offer.id)}
                  testID={`compare-offer-option-${offer.id}`}
                >
                  <Text style={styles.optionSalary}>
                    {formatSalary(offer.baseSalary, offer.currency, offer.period)}
                  </Text>
                  {offer.bonus ? (
                    <Text style={styles.optionMeta}>
                      +{formatSalary(offer.bonus, offer.currency)} bonus
                    </Text>
                  ) : null}
                  {selected && <Text style={styles.checkmark}>✓ selected</Text>}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[
              styles.compareButton,
              (selectedIds.length < 2 || compareOffers.isPending) && styles.compareButtonDisabled,
            ]}
            onPress={onCompare}
            disabled={selectedIds.length < 2 || compareOffers.isPending}
            testID="run-compare-button"
          >
            {compareOffers.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.compareButtonText}>Compare {selectedIds.length} offers</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {comparisons.map((comp, index) => (
            <View
              key={comp.offer.id}
              style={[styles.resultCard, index === 0 && styles.resultCardBest]}
              testID={`comparison-result-${comp.offer.id}`}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultCompany}>
                  {comp.company}
                  {index === 0 ? '  · Best' : ''}
                </Text>
                <Text style={styles.resultTotal}>
                  {formatSalary(comp.totalCompensation, 'USD')}
                </Text>
              </View>
              <Text style={styles.resultRole}>{comp.role}</Text>
              <Text style={styles.resultMeta}>
                Base (normalized/yr): {formatSalary(comp.normalizedYearlySalary, 'USD')}
              </Text>
              {comp.offer.equity ? (
                <Text style={styles.resultMeta}>Equity: {comp.offer.equity}</Text>
              ) : null}
              {comp.offer.benefits ? (
                <Text style={styles.resultMeta}>Benefits: {comp.offer.benefits}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  hint: { fontSize: 13, color: '#6b7280' },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
  optionsGrid: { gap: 10 },
  option: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  optionSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionSalary: { fontSize: 15, fontWeight: '700', color: '#111827' },
  optionMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  checkmark: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 4 },
  compareButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareButtonDisabled: { opacity: 0.6 },
  compareButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 2,
  },
  resultCardBest: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  resultCompany: { fontSize: 14, fontWeight: '700', color: '#111827' },
  resultTotal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  resultRole: { fontSize: 12, color: '#6b7280' },
  resultMeta: { fontSize: 12, color: '#4b5563', marginTop: 2 },
});
