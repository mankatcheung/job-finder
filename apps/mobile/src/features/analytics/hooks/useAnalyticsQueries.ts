import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  ANALYTICS_APPLICATIONS_QUERY,
  APPLICATION_CHANNEL_ANALYTICS_QUERY,
  DOCUMENT_VERSION_OUTCOMES_QUERY,
  INTERVIEW_ROUND_ANALYTICS_QUERY,
  OFFER_ANALYTICS_QUERY,
  RESPONSE_TIME_ANALYTICS_QUERY,
} from '../graphql/operations';
import type {
  AnalyticsApplication,
  ApplicationChannelAnalytics,
  DocumentVersionOutcome,
  InterviewRoundAnalytics,
  OfferAnalytics,
  ResponseTimeAnalytics,
} from '../types';

export function useAnalyticsApplications() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () =>
      gqlRequest<{ applications: AnalyticsApplication[] }>(ANALYTICS_APPLICATIONS_QUERY).then(
        (d) => d.applications,
      ),
  });
}

export function useDocumentVersionOutcomes() {
  return useQuery({
    queryKey: ['documentVersionOutcomes'],
    queryFn: () =>
      gqlRequest<{ documentVersionOutcomes: DocumentVersionOutcome[] }>(
        DOCUMENT_VERSION_OUTCOMES_QUERY,
      ).then((d) => d.documentVersionOutcomes),
  });
}

export function useInterviewRoundAnalytics() {
  return useQuery({
    queryKey: ['interviewRoundAnalytics'],
    queryFn: () =>
      gqlRequest<{ interviewRoundAnalytics: InterviewRoundAnalytics }>(
        INTERVIEW_ROUND_ANALYTICS_QUERY,
      ).then((d) => d.interviewRoundAnalytics),
  });
}

export function useOfferAnalytics() {
  return useQuery({
    queryKey: ['offerAnalytics'],
    queryFn: () =>
      gqlRequest<{ offerAnalytics: OfferAnalytics }>(OFFER_ANALYTICS_QUERY).then(
        (d) => d.offerAnalytics,
      ),
  });
}

export function useApplicationChannelAnalytics() {
  return useQuery({
    queryKey: ['applicationChannelAnalytics'],
    queryFn: () =>
      gqlRequest<{ applicationChannelAnalytics: ApplicationChannelAnalytics }>(
        APPLICATION_CHANNEL_ANALYTICS_QUERY,
      ).then((d) => d.applicationChannelAnalytics),
  });
}

export function useResponseTimeAnalytics() {
  return useQuery({
    queryKey: ['responseTimeAnalytics'],
    queryFn: () =>
      gqlRequest<{ responseTimeAnalytics: ResponseTimeAnalytics }>(
        RESPONSE_TIME_ANALYTICS_QUERY,
      ).then((d) => d.responseTimeAnalytics),
  });
}
