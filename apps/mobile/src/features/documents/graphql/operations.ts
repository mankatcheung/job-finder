// Hand-written to match apps/web's DocumentsTab GraphQL operations field-for-field
// — codegen is still deferred for apps/mobile (see JEF-261/262).

const DOCUMENT_FIELDS = `
  id
  applicationId
  name
  mimeType
  sizeBytes
  url
  documentType
  version
  createdAt
`;

export const DOCUMENTS_QUERY = `
  query Documents($applicationId: ID!) {
    documents(applicationId: $applicationId) {
      ${DOCUMENT_FIELDS}
    }
  }
`;

export const REQUEST_UPLOAD_URL_MUTATION = `
  mutation RequestUploadUrl($input: RequestUploadUrlInput!) {
    requestUploadUrl(input: $input) {
      uploadUrl
      storageKey
    }
  }
`;

export const CONFIRM_DOCUMENT_MUTATION = `
  mutation ConfirmDocument($input: ConfirmDocumentInput!) {
    confirmDocument(input: $input) {
      ${DOCUMENT_FIELDS}
    }
  }
`;

export const DELETE_DOCUMENT_MUTATION = `
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;
