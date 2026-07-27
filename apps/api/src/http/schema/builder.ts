import SchemaBuilder from '@pothos/core';
import type { GraphQLContext } from '#src/http/context.js';

// @ts-ignore Pothos v4: TS 5.9 on CI doesn't resolve the constructable const signature
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: {
    ID: { Input: string; Output: string };
  };
}>({});

builder.queryType({});
builder.mutationType({});
