import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHAT_TOOLS,
  MCP_TOOLS,
  TOOL_CATALOGUE,
  toLlmToolDefinitions,
} from '#src/interface-adapters/llm/toolCatalogue.js';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });
}

describe('tool catalogue (JEF-177)', () => {
  it('is never imported by a use case — the catalogue is an adapter concern', () => {
    // ChatWithAssistantUseCase used to import this list directly, which was
    // the only place in use-cases/ reaching up into the adapter layer. It now
    // receives its tools as an injected LLMToolDefinition[] instead. This
    // guards the direction generally, so a future slip is caught too.
    const useCasesDir = join(import.meta.dirname, '../../../use-cases');
    const offenders = walk(useCasesDir).filter((file) =>
      readFileSync(file, 'utf8').includes("from '#src/interface-adapters"),
    );

    expect(offenders).toEqual([]);
  });

  it('gives each surface its own selection rather than one shared list', () => {
    // MCP exposes everything and gates writes per request by token scope.
    expect(MCP_TOOLS).toEqual(TOOL_CATALOGUE);
    // Chat is session-authenticated with no scope to gate on, so reads only.
    expect(CHAT_TOOLS.every((t) => t.access === 'read')).toBe(true);
    expect(CHAT_TOOLS.length).toBeLessThan(MCP_TOOLS.length);
  });

  it('drops the internal access tag when adapting for an LLM provider', () => {
    const defs = toLlmToolDefinitions(CHAT_TOOLS);
    expect(defs.every((d) => !('access' in d))).toBe(true);
    expect(defs).toHaveLength(CHAT_TOOLS.length);
  });

  it('marks only the last adapted tool as a cache breakpoint', () => {
    const defs = toLlmToolDefinitions(CHAT_TOOLS);
    expect(defs.filter((d) => d.cacheBreakpoint)).toHaveLength(1);
    expect(defs[defs.length - 1].cacheBreakpoint).toBe(true);
  });

  it('has a unique name per tool', () => {
    const names = TOOL_CATALOGUE.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('tags every tool with an access level, since scope gating depends on it', () => {
    // A tool with no access tag would fall through the write check in
    // McpController and be callable with a read-only token.
    expect(TOOL_CATALOGUE.every((t) => t.access === 'read' || t.access === 'write')).toBe(true);
  });
});
