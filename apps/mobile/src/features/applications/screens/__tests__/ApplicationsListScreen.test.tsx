import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../hooks/useApplicationQueries', () => ({ useApplications: jest.fn() }));

import { useApplications } from '../../hooks/useApplicationQueries';
import { ApplicationsListScreen } from '../ApplicationsListScreen';
import type { Application } from '../../types';

const mockedUseApplications = jest.mocked(useApplications);

const applications: Application[] = [
  {
    id: '1',
    company: 'Acme',
    role: 'Backend Engineer',
    status: 'applied',
    jobUrl: null,
    location: 'Remote',
    salaryRange: null,
    description: null,
    appliedAt: null,
    starred: false,
    source: null,
    followUpAt: null,
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    company: 'Globex',
    role: 'Frontend Engineer',
    status: 'interviewing',
    jobUrl: null,
    location: null,
    salaryRange: null,
    description: null,
    appliedAt: null,
    starred: false,
    source: null,
    followUpAt: null,
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function renderScreen(navigate = jest.fn()) {
  return render(<ApplicationsListScreen navigation={{ navigate } as never} route={{} as never} />);
}

describe('ApplicationsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the list of applications', async () => {
    mockedUseApplications.mockReturnValue({
      data: applications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as never);

    const { getByText } = await renderScreen();

    await waitFor(() => expect(getByText('Backend Engineer')).toBeTruthy());
    expect(getByText('Frontend Engineer')).toBeTruthy();
  });

  it('navigates to the detail screen when an item is pressed', async () => {
    const navigate = jest.fn();
    mockedUseApplications.mockReturnValue({
      data: applications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as never);

    const { getByTestId } = await renderScreen(navigate);

    await fireEvent.press(getByTestId('application-item-1'));

    expect(navigate).toHaveBeenCalledWith('ApplicationDetail', { applicationId: '1' });
  });

  it('filters the list by search text', async () => {
    mockedUseApplications.mockReturnValue({
      data: applications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as never);

    const { getByTestId, queryByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('applications-search-input'), 'globex');

    await waitFor(() => expect(queryByText('Backend Engineer')).toBeNull());
    expect(queryByText('Frontend Engineer')).toBeTruthy();
  });

  it('navigates to the create form when the add button is pressed', async () => {
    const navigate = jest.fn();
    mockedUseApplications.mockReturnValue({
      data: applications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as never);

    const { getByTestId } = await renderScreen(navigate);

    await fireEvent.press(getByTestId('add-application-button'));

    expect(navigate).toHaveBeenCalledWith('ApplicationForm', undefined);
  });

  it('shows an empty state when there are no applications', async () => {
    mockedUseApplications.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as never);

    const { findByText } = await renderScreen();

    await findByText('No applications yet.');
  });
});
