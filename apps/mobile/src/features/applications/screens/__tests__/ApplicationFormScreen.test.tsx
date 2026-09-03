import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../hooks/useApplicationQueries', () => ({ useApplication: jest.fn() }));
jest.mock('../../hooks/useApplicationMutations', () => ({
  useCreateApplication: jest.fn(),
  useUpdateApplication: jest.fn(),
}));

import { useApplication } from '../../hooks/useApplicationQueries';
import { useCreateApplication, useUpdateApplication } from '../../hooks/useApplicationMutations';
import { ApplicationFormScreen } from '../ApplicationFormScreen';
import type { Application } from '../../types';

const mockedUseApplication = jest.mocked(useApplication);
const mockedUseCreateApplication = jest.mocked(useCreateApplication);
const mockedUseUpdateApplication = jest.mocked(useUpdateApplication);

const existing: Application = {
  id: '1',
  company: 'Acme',
  role: 'Backend Engineer',
  status: 'applied',
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
};

function renderScreen(applicationId: string | undefined, goBack = jest.fn()) {
  return render(
    <ApplicationFormScreen
      navigation={{ goBack } as never}
      route={{ params: applicationId ? { applicationId } : undefined } as never}
    />,
  );
}

describe('ApplicationFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseApplication.mockReturnValue({ data: undefined, isLoading: false } as never);
  });

  it('creates a new application from the empty form', async () => {
    const goBack = jest.fn();
    const mutate = jest.fn((_input, options) => options?.onSuccess?.());
    mockedUseCreateApplication.mockReturnValue({ mutate, isPending: false } as never);
    mockedUseUpdateApplication.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);

    const { getByTestId } = await renderScreen(undefined, goBack);

    await fireEvent.changeText(getByTestId('form-company-input'), 'Acme');
    await fireEvent.changeText(getByTestId('form-role-input'), 'Engineer');
    await fireEvent.press(getByTestId('form-submit-button'));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ company: 'Acme', role: 'Engineer', status: 'draft' }),
      expect.any(Object),
    );
    expect(goBack).toHaveBeenCalled();
  });

  it('shows a validation error instead of submitting when required fields are blank', async () => {
    const mutate = jest.fn();
    mockedUseCreateApplication.mockReturnValue({ mutate, isPending: false } as never);
    mockedUseUpdateApplication.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);

    const { getByTestId, findByText } = await renderScreen(undefined);

    await fireEvent.press(getByTestId('form-submit-button'));

    await findByText('Company is required');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('prefills and updates an existing application', async () => {
    const goBack = jest.fn();
    const mutate = jest.fn((_args, options) => options?.onSuccess?.());
    mockedUseApplication.mockReturnValue({ data: existing, isLoading: false } as never);
    mockedUseCreateApplication.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
    mockedUseUpdateApplication.mockReturnValue({ mutate, isPending: false } as never);

    const { getByTestId, getByDisplayValue } = await renderScreen('1', goBack);

    await waitFor(() => expect(getByDisplayValue('Acme')).toBeTruthy());

    await fireEvent.changeText(getByTestId('form-role-input'), 'Senior Backend Engineer');
    await fireEvent.press(getByTestId('form-submit-button'));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate).toHaveBeenCalledWith(
      {
        id: '1',
        input: expect.objectContaining({ company: 'Acme', role: 'Senior Backend Engineer' }),
      },
      expect.any(Object),
    );
    expect(goBack).toHaveBeenCalled();
  });
});
