import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useDocumentVersionOutcomes } from '../hooks/useAnalyticsQueries';
import { AnalyticsCard } from './AnalyticsCard';
import { RatioBar } from './RatioBar';
import { useTheme } from '../../../theme/ThemeContext';

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  resume: 'Resume',
  cover_letter: 'Cover letter',
};

export function DocumentVersionOutcomesSection() {
  const { colors } = useTheme();
  const { data, isLoading } = useDocumentVersionOutcomes();

  if (isLoading) return <ActivityIndicator color={colors.primary} />;
  if (!data) return null;

  return (
    <AnalyticsCard
      title="Document version outcomes"
      description="Which resume/cover-letter version tends to lead to interviews."
      testID="document-version-outcomes-section"
    >
      {data.length === 0 ? (
        <Text style={{ fontSize: 12, color: colors.textFaint }}>
          No document versions tracked yet.
        </Text>
      ) : (
        data.map((o) => (
          <RatioBar
            key={`${o.documentType}::${o.version ?? ''}`}
            label={`${DOCUMENT_TYPE_LABEL[o.documentType] ?? o.documentType}: ${o.version ?? '—'}`}
            meta={`${o.interviewCount}/${o.applicationCount}`}
            percent={o.interviewRate}
            color="#a855f7"
            sampleSize={o.applicationCount}
            testID={`document-outcome-${o.documentType}-${o.version ?? 'none'}`}
          />
        ))
      )}
    </AnalyticsCard>
  );
}
