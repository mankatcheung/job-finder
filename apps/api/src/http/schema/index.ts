import { builder } from '@/http/schema/builder.js';

// Types must be imported before queries/mutations to register with builder
import './types/enums/ApplicationStatusEnum.js';
import './types/enums/InterviewRoundEnums.js';
import './types/enums/ActivityEventTypeEnum.js';
import './types/UserType.js';
import './types/ApplicationType.js';
import './types/NoteType.js';
import './types/DocumentType.js';
import './types/InterviewRoundType.js';
import './types/ActivityLogType.js';
import './types/AuthPayloadType.js';
import './types/inputs/ApplicationInputs.js';
import './types/inputs/DocumentInputs.js';

// Queries
import './queries/applicationQueries.js';
import './queries/noteQueries.js';
import './queries/documentQueries.js';
import './queries/userQueries.js';
import './queries/interviewRoundQueries.js';
import './queries/activityLogQueries.js';

// Mutations
import './mutations/authMutations.js';
import './mutations/applicationMutations.js';
import './mutations/noteMutations.js';
import './mutations/documentMutations.js';
import './mutations/userMutations.js';
import './mutations/interviewRoundMutations.js';

export const schema = builder.toSchema();
