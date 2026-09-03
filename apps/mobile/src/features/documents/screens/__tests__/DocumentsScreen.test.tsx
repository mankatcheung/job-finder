import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('../../hooks/useDocumentQueries', () => ({ useDocuments: jest.fn() }));
jest.mock('../../hooks/useDeleteDocument', () => ({ useDeleteDocument: jest.fn() }));
jest.mock('../../hooks/useUploadDocument', () => ({ useUploadDocument: jest.fn() }));

import * as DocumentPicker from 'expo-document-picker';
import { useDocuments } from '../../hooks/useDocumentQueries';
import { useDeleteDocument } from '../../hooks/useDeleteDocument';
import { useUploadDocument } from '../../hooks/useUploadDocument';
import { DocumentsScreen } from '../DocumentsScreen';
import type { Document } from '../../types';

const mockedGetDocumentAsync = jest.mocked(DocumentPicker.getDocumentAsync);
const mockedUseDocuments = jest.mocked(useDocuments);
const mockedUseDeleteDocument = jest.mocked(useDeleteDocument);
const mockedUseUploadDocument = jest.mocked(useUploadDocument);

const document: Document = {
  id: '1',
  applicationId: 'app-1',
  name: 'resume.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 2048,
  url: 'https://example.com/resume.pdf',
  documentType: 'resume',
  version: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderScreen() {
  return render(
    <DocumentsScreen
      navigation={{} as never}
      route={{ params: { applicationId: 'app-1' } } as never}
    />,
  );
}

describe('DocumentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDeleteDocument.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
  });

  it('renders existing documents', async () => {
    mockedUseDocuments.mockReturnValue({
      data: [document],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseUploadDocument.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);

    const { getByText } = await renderScreen();

    await waitFor(() => expect(getByText('resume.pdf')).toBeTruthy());
  });

  it('picks a file and uploads it with the selected type', async () => {
    const mutate = jest.fn();
    mockedUseDocuments.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseUploadDocument.mockReturnValue({ mutate, isPending: false } as never);
    mockedGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///tmp/resume.pdf',
          name: 'resume.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          lastModified: 0,
        },
      ],
    });

    const { getByTestId, findByTestId } = await renderScreen();

    await fireEvent.press(getByTestId('pick-document-button'));
    const resumeChip = await findByTestId('document-type-resume');
    await fireEvent.press(resumeChip);
    await fireEvent.press(getByTestId('confirm-upload-button'));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'file:///tmp/resume.pdf',
        name: 'resume.pdf',
        documentType: 'resume',
      }),
      expect.any(Object),
    );
  });

  it('deletes a document after confirmation', async () => {
    const deleteMutate = jest.fn();
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirm = buttons?.find((b) => b.text === 'Delete');
      confirm?.onPress?.();
    });
    mockedUseDocuments.mockReturnValue({
      data: [document],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseUploadDocument.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
    mockedUseDeleteDocument.mockReturnValue({ mutate: deleteMutate, isPending: false } as never);

    const { getByTestId } = await renderScreen();

    await fireEvent.press(getByTestId('delete-document-1'));

    expect(deleteMutate).toHaveBeenCalledWith('1', expect.any(Object));
  });
});
