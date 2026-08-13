import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { GetChatHistoryUseCase } from '#src/use-cases/chat/GetChatHistoryUseCase.js';
import { ChatWithAssistantUseCase } from '#src/use-cases/chat/ChatWithAssistantUseCase.js';
import { CreateConversationUseCase } from '#src/use-cases/conversations/CreateConversationUseCase.js';
import { ListConversationsUseCase } from '#src/use-cases/conversations/ListConversationsUseCase.js';
import { DeleteConversationUseCase } from '#src/use-cases/conversations/DeleteConversationUseCase.js';

import type { Cradle } from '../types.js';

export const chat = {
  getChatHistoryUseCase: asClass(GetChatHistoryUseCase, { lifetime: Lifetime.TRANSIENT }),
  chatWithAssistantUseCase: asClass(ChatWithAssistantUseCase, { lifetime: Lifetime.TRANSIENT }),
  createConversationUseCase: asClass(CreateConversationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  listConversationsUseCase: asClass(ListConversationsUseCase, { lifetime: Lifetime.TRANSIENT }),
  deleteConversationUseCase: asClass(DeleteConversationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
