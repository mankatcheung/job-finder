import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useApiTokens,
  useCreateApiToken,
  useCreateShareLink,
  useDeleteApiToken,
  useDeleteShareLink,
  useMcpOAuthGrants,
  useRevokeMcpOAuthGrant,
  useShareLinks,
} from '../hooks/useIntegrations';
import { getErrorMessage } from '../../../lib/errors';
import type { ApiTokenScope, CreateApiTokenPayload, CreateShareLinkPayload } from '../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export function IntegrationsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ApiTokensSection />
      <McpGrantsSection />
      <ShareLinksSection />
    </ScrollView>
  );
}

function ApiTokensSection() {
  const { data: tokens = [] } = useApiTokens();
  const createToken = useCreateApiToken();
  const deleteToken = useDeleteApiToken();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<ApiTokenScope>('read');
  const [created, setCreated] = useState<CreateApiTokenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      const token = await createToken.mutateAsync({ name: name.trim(), scope });
      setCreated(token);
      setName('');
      setScope('read');
      setFormOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.title}>API tokens</Text>
          <Text style={styles.description}>
            Used to authenticate MCP and API access on your behalf.
          </Text>
        </View>
        {!formOpen && !created && (
          <Pressable onPress={() => setFormOpen(true)} testID="new-api-token-button">
            <Text style={styles.link}>+ New</Text>
          </Pressable>
        )}
      </View>

      {created && (
        <View style={styles.tokenBox}>
          <Text style={styles.tokenValue} selectable testID="new-api-token-value">
            {created.token}
          </Text>
          <View style={styles.tokenActions}>
            <Pressable onPress={() => void Share.share({ message: created.token })}>
              <Text style={styles.link}>Share</Text>
            </Pressable>
            <Pressable onPress={() => setCreated(null)} testID="dismiss-new-token-button">
              <Text style={styles.link}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {!created && formOpen && (
        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="e.g. CI pipeline"
            value={name}
            onChangeText={setName}
            testID="api-token-name-input"
          />
          <View style={styles.scopeRow}>
            {(['read', 'full'] as ApiTokenScope[]).map((s) => (
              <Pressable
                key={s}
                style={[styles.scopeChip, scope === s && styles.scopeChipActive]}
                onPress={() => setScope(s)}
                testID={`api-token-scope-${s}`}
              >
                <Text style={[styles.scopeChipText, scope === s && styles.scopeChipTextActive]}>
                  {s === 'read' ? 'Read-only' : 'Full access'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.button}
            onPress={onCreate}
            disabled={createToken.isPending || !name.trim()}
            testID="create-api-token-button"
          >
            {createToken.isPending ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.buttonText}>Create token</Text>
            )}
          </Pressable>
        </View>
      )}

      {tokens.map((token) => (
        <View key={token.id} style={styles.row} testID={`api-token-${token.id}`}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>
              {token.name} · {token.scope === 'read' ? 'Read-only' : 'Full access'}
            </Text>
            <Text style={styles.rowMeta}>
              Created {formatDate(token.createdAt)}
              {token.lastUsedAt ? ` · last used ${formatDate(token.lastUsedAt)}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => deleteToken.mutate(token.id)}
            testID={`revoke-api-token-${token.id}`}
          >
            <Text style={styles.linkDanger}>Revoke</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function McpGrantsSection() {
  const { data: grants = [], isLoading } = useMcpOAuthGrants();
  const revokeGrant = useRevokeMcpOAuthGrant();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Connected MCP clients</Text>
      <Text style={styles.description}>
        Apps you&apos;ve authorized to access your data via MCP.
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#2563eb" />
      ) : grants.length === 0 ? (
        <Text style={styles.emptyText}>No connected clients yet.</Text>
      ) : (
        grants.map((grant) => (
          <View key={grant.id} style={styles.row} testID={`mcp-grant-${grant.id}`}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>
                {grant.clientName} · {grant.scope === 'read' ? 'Read-only' : 'Full access'}
              </Text>
              <Text style={styles.rowMeta}>Authorized {formatDate(grant.authorizedAt)}</Text>
            </View>
            <Pressable
              onPress={() => revokeGrant.mutate(grant.id)}
              testID={`revoke-mcp-grant-${grant.id}`}
            >
              <Text style={styles.linkDanger}>Revoke</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

function ShareLinksSection() {
  const { data: links = [] } = useShareLinks();
  const createLink = useCreateShareLink();
  const deleteLink = useDeleteShareLink();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<CreateShareLinkPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      const link = await createLink.mutateAsync(name.trim());
      setCreated(link);
      setName('');
      setFormOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.title}>Share links</Text>
          <Text style={styles.description}>Share a read-only summary of your job search.</Text>
        </View>
        {!formOpen && !created && (
          <Pressable onPress={() => setFormOpen(true)} testID="new-share-link-button">
            <Text style={styles.link}>+ New</Text>
          </Pressable>
        )}
      </View>

      {created && (
        <View style={styles.tokenBox}>
          <Text style={styles.tokenValue} selectable testID="new-share-link-value">
            {created.token}
          </Text>
          <View style={styles.tokenActions}>
            <Pressable onPress={() => void Share.share({ message: created.token })}>
              <Text style={styles.link}>Share</Text>
            </Pressable>
            <Pressable onPress={() => setCreated(null)} testID="dismiss-new-share-link-button">
              <Text style={styles.link}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {!created && formOpen && (
        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="e.g. For my mentor"
            value={name}
            onChangeText={setName}
            testID="share-link-name-input"
          />
          <Pressable
            style={styles.button}
            onPress={onCreate}
            disabled={createLink.isPending || !name.trim()}
            testID="create-share-link-button"
          >
            {createLink.isPending ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.buttonText}>Create link</Text>
            )}
          </Pressable>
        </View>
      )}

      {links.map((link) => (
        <View key={link.id} style={styles.row} testID={`share-link-${link.id}`}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{link.name}</Text>
            <Text style={styles.rowMeta}>Created {formatDate(link.createdAt)}</Text>
          </View>
          <Pressable
            onPress={() => deleteLink.mutate(link.id)}
            testID={`delete-share-link-${link.id}`}
          >
            <Text style={styles.linkDanger}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardHeaderText: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  description: { fontSize: 13, color: '#6b7280' },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  linkDanger: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 13, color: '#9ca3af' },
  form: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  scopeRow: { flexDirection: 'row', gap: 8 },
  scopeChip: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scopeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  scopeChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  scopeChipTextActive: { color: '#ffffff' },
  button: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buttonText: { color: '#111827', fontSize: 14, fontWeight: '600' },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  tokenBox: { gap: 8, backgroundColor: '#f9fafb', borderRadius: 8, padding: 12 },
  tokenValue: { fontFamily: 'monospace', fontSize: 12, color: '#111827' },
  tokenActions: { flexDirection: 'row', gap: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    gap: 8,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 11, color: '#9ca3af' },
});
