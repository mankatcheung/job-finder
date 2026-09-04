import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useOfferAnalytics } from '../hooks/useAnalyticsQueries';
import { AnalyticsCard } from './AnalyticsCard';

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString()} ${currency}`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function OfferAnalyticsSection() {
  const { data, isLoading } = useOfferAnalytics();

  if (isLoading) return <ActivityIndicator color="#2563eb" />;
  if (!data) return null;

  return (
    <AnalyticsCard
      title="Offers"
      description="Every offer logged, trended over time and by currency."
      testID="offer-analytics-section"
    >
      {data.byCurrency.length === 0 ? (
        <Text style={styles.empty}>No offers logged yet.</Text>
      ) : (
        <>
          <View style={styles.currencyGrid}>
            {data.byCurrency.map((stat) => (
              <View
                key={stat.currency}
                style={styles.currencyCol}
                testID={`offer-currency-${stat.currency}`}
              >
                <Text style={styles.currencyLabel}>
                  Median ({stat.currency}, n={stat.count})
                </Text>
                <Text style={styles.currencyValue}>
                  {formatCurrency(stat.medianYearlySalary, stat.currency)}
                </Text>
                <Text style={styles.currencyRange}>
                  {formatCurrency(stat.minYearlySalary, stat.currency)} –{' '}
                  {formatCurrency(stat.maxYearlySalary, stat.currency)}
                </Text>
              </View>
            ))}
          </View>

          {data.trend.map((point) => (
            <View
              key={point.offerId}
              style={styles.trendRow}
              testID={`offer-trend-${point.offerId}`}
            >
              <Text style={styles.trendDate}>{formatDate(point.createdAt)}</Text>
              <Text style={styles.trendCompany} numberOfLines={1}>
                {point.company} · {point.role}
              </Text>
              <Text style={styles.trendSalary}>
                {formatCurrency(point.normalizedYearlySalary, point.currency)}
              </Text>
            </View>
          ))}
        </>
      )}
    </AnalyticsCard>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 12, color: '#9ca3af' },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  currencyCol: { minWidth: 120, gap: 2 },
  currencyLabel: { fontSize: 10, color: '#9ca3af' },
  currencyValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  currencyRange: { fontSize: 10, color: '#9ca3af' },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 6,
  },
  trendDate: { width: 52, fontSize: 10, color: '#9ca3af' },
  trendCompany: { flex: 1, fontSize: 12, color: '#111827' },
  trendSalary: { fontSize: 12, fontWeight: '600', color: '#374151' },
});
