import { asClass, asValue, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { GetChatHistoryUseCase } from '#src/use-cases/chat/GetChatHistoryUseCase.js';
import { ChatWithAssistantUseCase } from '#src/use-cases/chat/ChatWithAssistantUseCase.js';
import { StreamChatWithAssistantUseCase } from '#src/use-cases/chat/StreamChatWithAssistantUseCase.js';
import { CHAT_TOOLS, toLlmToolDefinitions } from '#src/interface-adapters/llm/toolCatalogue.js';
import { CreateConversationUseCase } from '#src/use-cases/conversations/CreateConversationUseCase.js';
import { ListConversationsUseCase } from '#src/use-cases/conversations/ListConversationsUseCase.js';
import { SearchConversationsUseCase } from '#src/use-cases/conversations/SearchConversationsUseCase.js';
import { DeleteConversationUseCase } from '#src/use-cases/conversations/DeleteConversationUseCase.js';

import type { Cradle } from '../types.js';

export const chat = {
  getChatHistoryUseCase: asClass(GetChatHistoryUseCase, { lifetime: Lifetime.TRANSIENT }),
  // Which tools the assistant is offered is decided here, in the composition
  // root, rather than by whatever the use case happens to import. Chat is
  // session-authenticated and has no token scope to gate writes on, so it
  // gets read tools only — MCP takes the full catalogue and gates per
  // request instead (JEF-177).
  chatTools: asValue(toLlmToolDefinitions(CHAT_TOOLS)),
  chatWithAssistantUseCase: asClass(ChatWithAssistantUseCase, { lifetime: Lifetime.TRANSIENT }),
  streamChatWithAssistantUseCase: asClass(StreamChatWithAssistantUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  createConversationUseCase: asClass(CreateConversationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  listConversationsUseCase: asClass(ListConversationsUseCase, { lifetime: Lifetime.TRANSIENT }),
  searchConversationsUseCase: asClass(SearchConversationsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  deleteConversationUseCase: asClass(DeleteConversationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
