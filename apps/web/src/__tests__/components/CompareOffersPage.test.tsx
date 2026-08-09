import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: object) => ({
    ...opts,
    useParams: () => ({ applicationId: 'app-1' }),
  }),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { Route } from '#/routes/_authenticated/applications/$applicationId/offers/compare';

const CompareOffersPage = (Route as unknown as { component: ComponentType }).component;

const offerA = {
  id: 'offer-a',
  baseSalary: 150000,
  bonus: 10000,
  equity: '1000 RSUs',
  benefits: 'Health, 401k',
  costOfLivingAdjustment: null,
  currency: 'USD',
  period: 'yearly',
};

const offerB = {
  id: 'offer-b',
  baseSalary: 140000,
  bonus: null,
  equity: null,
  benefits: null,
  costOfLivingAdjustment: null,
  currency: 'USD',
  period: 'yearly',
};

describe('CompareOffersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state when there are no offers', async () => {
    mockGqlRequest.mockResolvedValue({ offers: [] });
    render(<CompareOffersPage />);

    await waitFor(() => {
      expect(screen.getByText(/no offers to compare/i)).toBeInTheDocument();
    });
  });

  it('disables the compare button until at least 2 offers are selected', async () => {
    mockGqlRequest.mockResolvedValue({ offers: [offerA, offerB] });
    render(<CompareOffersPage />);

    await waitFor(() => {
      expect(screen.getByText('$150,000/yearly')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /compare \(0\)/i })).toBeDisabled();

    fireEvent.click(screen.getByText('$150,000/yearly'));
    expect(screen.getByRole('button', { name: /compare \(1\)/i })).toBeDisabled();

    fireEvent.click(screen.getByText('$140,000/yearly'));
    expect(screen.getByRole('button', { name: /compare \(2\)/i })).not.toBeDisabled();
  });

  it('renders a comparison table with the best offer highlighted first', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('query Offers')) return Promise.resolve({ offers: [offerA, offerB] });
      if (query.includes('CompareOffers')) {
        return Promise.resolve({
          compareOffers: [
            {
              offer: offerA,
              company: 'Acme',
              role: 'Engineer',
              normalizedYearlySalary: 150000,
              totalCompensation: 160000,
            },
            {
              offer: offerB,
              company: 'Globex',
              role: 'Engineer',
              normalizedYearlySalary: 140000,
              totalCompensation: 140000,
            },
          ],
        });
      }
      return Promise.resolve({});
    });
    render(<CompareOffersPage />);

    await waitFor(() => {
      expect(screen.getByText('$150,000/yearly')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('$150,000/yearly'));
    fireEvent.click(screen.getByText('$140,000/yearly'));
    fireEvent.click(screen.getByRole('button', { name: /compare \(2\)/i }));

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('CompareOffers'), {
        offerIds: ['offer-a', 'offer-b'],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Acme')).toBeInTheDocument();
    });
    expect(screen.getByText('Best')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });
});
