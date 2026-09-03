import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useResponseTimeAnalytics } from '../hooks/useAnalyticsQueries';
import { statusLabel } from '../../applications/components/StatusBadge';
import type { ApplicationStatus } from '../../applications/types';
import { AnalyticsCard } from './AnalyticsCard';
import { RatioBar } from './RatioBar';

function formatDays(n: number | null): string {
  if (n === null) return '—';
  return `${n < 10 ? n.toFixed(1) : Math.round(n)}d`;
}

export function ResponseTimeAnalyticsSection() {
  const { data, isLoading } = useResponseTimeAnalytics();

  if (isLoading) return <ActivityIndicator color="#2563eb" />;
  if (!data) return null;

  const maxMedian = Math.max(1, ...data.timeInStage.map((s) => s.medianDays ?? 0));

  return (
    <AnalyticsCard
      title="Response times"
      description="How long applications sit in each stage, and time to first response."
      testID="response-time-analytics-section"
    >
      <Text style={{ fontSize: 11, color: '#9ca3af' }}>
        First response: {formatDays(data.timeToFirstResponse.medianDays)} median (
        {data.timeToFirstResponse.sampleSize > 0
          ? `${data.timeToFirstResponse.sampleSize} applications`
          : 'no responses yet'}
        )
      </Text>

      {data.timeInStage.length === 0 ? (
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>No stage durations yet.</Text>
      ) : (
        data.timeInStage.map((stat) => (
          <RatioBar
            key={stat.status}
            label={statusLabel(stat.status as ApplicationStatus)}
            percent={((stat.medianDays ?? 0) / maxMedian) * 100}
            percentLabel={formatDays(stat.medianDays)}
            color="#3b82f6"
            sampleSize={stat.sampleSize}
            testID={`response-time-${stat.status}`}
          />
        ))
      )}
    </AnalyticsCard>
  );
}
