import { builder } from '@/http/schema/builder.js';

// Types must be imported before queries/mutations to register with builder
import './types/enums/ApplicationStatusEnum.js';
import './types/UserType.js';
import './types/ApplicationType.js';
import './types/NoteType.js';
import './types/DocumentType.js';
import './types/AuthPayloadType.js';
import './types/inputs/ApplicationInputs.js';
import './types/inputs/DocumentInputs.js';

// Queries
import './queries/applicationQueries.js';
import './queries/noteQueries.js';
import './queries/documentQueries.js';
import './queries/userQueries.js';

// Mutations
import './mutations/authMutations.js';
import './mutations/applicationMutations.js';
import './mutations/noteMutations.js';
import './mutations/documentMutations.js';
import './mutations/userMutations.js';

export const schema = builder.toSchema();
