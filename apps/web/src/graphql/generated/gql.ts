/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "mutation CreateApplication($input: CreateApplicationInput!) {\n  createApplication(input: $input) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n  updateApplication(id: $id, input: $input) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteApplication($id: ID!) {\n  deleteApplication(id: $id)\n}": typeof types.CreateApplicationDocument,
    "mutation Register($email: String!, $password: String!) {\n  register(email: $email, password: $password)\n}\n\nmutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password)\n}\n\nmutation RefreshToken {\n  refreshToken\n}\n\nmutation Logout {\n  logout\n}": typeof types.RegisterDocument,
    "mutation RequestUploadUrl($input: RequestUploadUrlInput!) {\n  requestUploadUrl(input: $input) {\n    uploadUrl\n    storageKey\n  }\n}\n\nmutation ConfirmDocument($input: ConfirmDocumentInput!) {\n  confirmDocument(input: $input) {\n    id\n    applicationId\n    name\n    mimeType\n    sizeBytes\n    url\n    createdAt\n  }\n}\n\nmutation DeleteDocument($id: ID!) {\n  deleteDocument(id: $id)\n}": typeof types.RequestUploadUrlDocument,
    "mutation CreateNote($applicationId: ID!, $content: String!) {\n  createNote(applicationId: $applicationId, content: $content) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateNote($id: ID!, $content: String!) {\n  updateNote(id: $id, content: $content) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteNote($id: ID!) {\n  deleteNote(id: $id)\n}": typeof types.CreateNoteDocument,
    "query Applications($status: ApplicationStatus) {\n  applications(status: $status) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nquery Application($id: ID!) {\n  application(id: $id) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}": typeof types.ApplicationsDocument,
    "query Documents($applicationId: ID!) {\n  documents(applicationId: $applicationId) {\n    id\n    applicationId\n    name\n    mimeType\n    sizeBytes\n    url\n    createdAt\n  }\n}": typeof types.DocumentsDocument,
    "query Notes($applicationId: ID!) {\n  notes(applicationId: $applicationId) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}": typeof types.NotesDocument,
};
const documents: Documents = {
    "mutation CreateApplication($input: CreateApplicationInput!) {\n  createApplication(input: $input) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n  updateApplication(id: $id, input: $input) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteApplication($id: ID!) {\n  deleteApplication(id: $id)\n}": types.CreateApplicationDocument,
    "mutation Register($email: String!, $password: String!) {\n  register(email: $email, password: $password)\n}\n\nmutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password)\n}\n\nmutation RefreshToken {\n  refreshToken\n}\n\nmutation Logout {\n  logout\n}": types.RegisterDocument,
    "mutation RequestUploadUrl($input: RequestUploadUrlInput!) {\n  requestUploadUrl(input: $input) {\n    uploadUrl\n    storageKey\n  }\n}\n\nmutation ConfirmDocument($input: ConfirmDocumentInput!) {\n  confirmDocument(input: $input) {\n    id\n    applicationId\n    name\n    mimeType\n    sizeBytes\n    url\n    createdAt\n  }\n}\n\nmutation DeleteDocument($id: ID!) {\n  deleteDocument(id: $id)\n}": types.RequestUploadUrlDocument,
    "mutation CreateNote($applicationId: ID!, $content: String!) {\n  createNote(applicationId: $applicationId, content: $content) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateNote($id: ID!, $content: String!) {\n  updateNote(id: $id, content: $content) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteNote($id: ID!) {\n  deleteNote(id: $id)\n}": types.CreateNoteDocument,
    "query Applications($status: ApplicationStatus) {\n  applications(status: $status) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nquery Application($id: ID!) {\n  application(id: $id) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}": types.ApplicationsDocument,
    "query Documents($applicationId: ID!) {\n  documents(applicationId: $applicationId) {\n    id\n    applicationId\n    name\n    mimeType\n    sizeBytes\n    url\n    createdAt\n  }\n}": types.DocumentsDocument,
    "query Notes($applicationId: ID!) {\n  notes(applicationId: $applicationId) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}": types.NotesDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateApplication($input: CreateApplicationInput!) {\n  createApplication(input: $input) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n  updateApplication(id: $id, input: $input) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteApplication($id: ID!) {\n  deleteApplication(id: $id)\n}"): (typeof documents)["mutation CreateApplication($input: CreateApplicationInput!) {\n  createApplication(input: $input) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n  updateApplication(id: $id, input: $input) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteApplication($id: ID!) {\n  deleteApplication(id: $id)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Register($email: String!, $password: String!) {\n  register(email: $email, password: $password)\n}\n\nmutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password)\n}\n\nmutation RefreshToken {\n  refreshToken\n}\n\nmutation Logout {\n  logout\n}"): (typeof documents)["mutation Register($email: String!, $password: String!) {\n  register(email: $email, password: $password)\n}\n\nmutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password)\n}\n\nmutation RefreshToken {\n  refreshToken\n}\n\nmutation Logout {\n  logout\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RequestUploadUrl($input: RequestUploadUrlInput!) {\n  requestUploadUrl(input: $input) {\n    uploadUrl\n    storageKey\n  }\n}\n\nmutation ConfirmDocument($input: ConfirmDocumentInput!) {\n  confirmDocument(input: $input) {\n    id\n    applicationId\n    name\n    mimeType\n    sizeBytes\n    url\n    createdAt\n  }\n}\n\nmutation DeleteDocument($id: ID!) {\n  deleteDocument(id: $id)\n}"): (typeof documents)["mutation RequestUploadUrl($input: RequestUploadUrlInput!) {\n  requestUploadUrl(input: $input) {\n    uploadUrl\n    storageKey\n  }\n}\n\nmutation ConfirmDocument($input: ConfirmDocumentInput!) {\n  confirmDocument(input: $input) {\n    id\n    applicationId\n    name\n    mimeType\n    sizeBytes\n    url\n    createdAt\n  }\n}\n\nmutation DeleteDocument($id: ID!) {\n  deleteDocument(id: $id)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateNote($applicationId: ID!, $content: String!) {\n  createNote(applicationId: $applicationId, content: $content) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateNote($id: ID!, $content: String!) {\n  updateNote(id: $id, content: $content) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteNote($id: ID!) {\n  deleteNote(id: $id)\n}"): (typeof documents)["mutation CreateNote($applicationId: ID!, $content: String!) {\n  createNote(applicationId: $applicationId, content: $content) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateNote($id: ID!, $content: String!) {\n  updateNote(id: $id, content: $content) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteNote($id: ID!) {\n  deleteNote(id: $id)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Applications($status: ApplicationStatus) {\n  applications(status: $status) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nquery Application($id: ID!) {\n  application(id: $id) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}"): (typeof documents)["query Applications($status: ApplicationStatus) {\n  applications(status: $status) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}\n\nquery Application($id: ID!) {\n  application(id: $id) {\n    id\n    company\n    role\n    status\n    jobUrl\n    location\n    salaryRange\n    description\n    appliedAt\n    starred\n    source\n    followUpAt\n    createdAt\n    updatedAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Documents($applicationId: ID!) {\n  documents(applicationId: $applicationId) {\n    id\n    applicationId\n    name\n    mimeType\n    sizeBytes\n    url\n    createdAt\n  }\n}"): (typeof documents)["query Documents($applicationId: ID!) {\n  documents(applicationId: $applicationId) {\n    id\n    applicationId\n    name\n    mimeType\n    sizeBytes\n    url\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Notes($applicationId: ID!) {\n  notes(applicationId: $applicationId) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}"): (typeof documents)["query Notes($applicationId: ID!) {\n  notes(applicationId: $applicationId) {\n    id\n    applicationId\n    content\n    createdAt\n    updatedAt\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;