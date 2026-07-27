import SchemaBuilder from '@pothos/core';
import type { GraphQLContext } from '#src/http/context.js';

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: {
    ID: { Input: string; Output: string };
  };
}>({});

builder.queryType({});
builder.mutationType({});
