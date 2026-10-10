import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { MCPClient, MCPServerInfo } from '../services/mcp/mcpClient';
import type { ScreenNavProp } from '../types/navigation';

interface IntegrationsHubScreenProps {
  navigation: ScreenNavProp<'IntegrationsHub'>;
}

export const IntegrationsHubScreen: React.FC<IntegrationsHubScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { devices, toggleDevice } = useApp();
  const [servers, setServers] = useState<MCPServerInfo[]>(MCPClient.servers);
  const [probing, setProbing] = useState<boolean>(false);
  const [invokingTool, setInvokingTool] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<{ tool: string; data?: any; error?: string } | null>(null);

  const probeServers = async () => {
    setProbing(true);
    const updated = await MCPClient.getServers();
    setServers(updated);
    setProbing(false);
  };

  const handleTestTool = async (toolName: string, args: Record<string, unknown> = {}) => {
    setInvokingTool(toolName);
    setToolResult(null);
    try {
      const result = await MCPClient.callTool(toolName, args);
      setToolResult({ tool: toolName, data: result });
    } catch (err: any) {
      setToolResult({ tool: toolName, error: err.message || 'Tool execution failed' });
    } finally {
      setInvokingTool(null);
    }
  };

  useEffect(() => {
    probeServers();
  }, []);

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.sm }]}>
        {/* Header from Reference Screen 72 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Integrations Hub</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={probeServers}
          >
            <Text style={styles.iconText}>{probing ? '⏳' : '🔄'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Smart Home Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Smart Home Automation</Text>
                <Text style={styles.sectionSubtitle}>Local Device Simulation Mode</Text>
              </View>
              <StatusBadge label="Simulated State" status="idle" />
            </View>

            {/* Honest Hardware Notice */}
            <GlassCard style={styles.noticeCard}>
              <Text style={styles.noticeText}>
                💡 Toggles persist in device storage. Physical IoT actuation requires pairing
                with a local Matter bridge or Home Assistant webhook.
              </Text>
            </GlassCard>

            <View style={styles.deviceList}>
              {devices.map((dev) => (
                <GlassCard key={dev.id} style={styles.deviceCard}>
                  <View style={styles.deviceRow}>
                    <View style={styles.deviceIconBox}>
                      <Text style={styles.deviceIcon}>
                        {dev.type === 'light' ? '💡' : dev.type === 'thermostat' ? '🌡️' : '🤖'}
                      </Text>
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{dev.name}</Text>
                      <Text style={styles.deviceRoom}>
                        {dev.room} · {dev.status ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
                      </Text>
                    </View>
                    <Switch
                      value={dev.status}
                      onValueChange={() => toggleDevice(dev.id)}
                      trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: theme.colors.accent.primary }}
                      thumbColor={dev.status ? '#050814' : '#94A3B8'}
                    />
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>

          {/* Model Context Protocol (MCP) Servers Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Model Context Protocol (MCP)</Text>
                <Text style={styles.sectionSubtitle}>Standard JSON-RPC 2.0 Tool Protocol</Text>
              </View>
              <TouchableOpacity
                onPress={probeServers}
                style={styles.refreshBadge}
                activeOpacity={0.7}
              >
                {probing ? (
                  <ActivityIndicator size="small" color={theme.colors.accent.primary} />
                ) : (
                  <Text style={styles.refreshBadgeText}>Probe Health</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.mcpList}>
              {servers.map((srv) => {
                const isOnline = srv.status === 'connected';
                return (
                  <GlassCard key={srv.id} style={styles.mcpCard}>
                    <View style={styles.mcpHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mcpName}>{srv.name}</Text>
                        <Text style={styles.mcpTypeTag}>
                          {srv.type === 'local_node' ? 'Local Gateway' : 'Cloud Endpoint'}
                        </Text>
                      </View>
                      <StatusBadge
                        label={isOnline ? 'ONLINE' : 'OFFLINE'}
                        status={isOnline ? 'success' : 'idle'}
                      />
                    </View>
                    <Text style={styles.mcpDesc}>{srv.description}</Text>
                    <View style={styles.mcpMetaRow}>
                      <Text style={styles.mcpEndpoint}>{srv.endpoint}</Text>
                      <Text style={styles.mcpTools}>{srv.toolsCount} Tools</Text>
                    </View>
                    {srv.lastChecked ? (
                      <Text style={styles.mcpChecked}>Probed at: {srv.lastChecked}</Text>
                    ) : null}

                    {srv.id === 'mcp_gateway' ? (
                      <View style={styles.toolActionRow}>
                        <TouchableOpacity
                          style={[
                            styles.toolActionBtn,
                            invokingTool === 'get_weather' && styles.toolActionBtnActive,
                          ]}
                          onPress={() => handleTestTool('get_weather', { location: 'Local Rig' })}
                          disabled={invokingTool !== null}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.toolActionBtnText}>
                            {invokingTool === 'get_weather' ? 'Executing...' : 'Test Tool (Weather)'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.toolActionBtn,
                            invokingTool === 'developer_tools' && styles.toolActionBtnActive,
                          ]}
                          onPress={() => handleTestTool('developer_tools', { action: 'diagnostics' })}
                          disabled={invokingTool !== null}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.toolActionBtnText}>
                            {invokingTool === 'developer_tools' ? 'Executing...' : 'Test Tool (Diagnostics)'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </GlassCard>
                );
              })}
            </View>

            {toolResult ? (
              <GlassCard style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>
                    MCP Tool Result: {toolResult.tool}
                  </Text>
                  <TouchableOpacity onPress={() => setToolResult(null)}>
                    <Text style={styles.resultClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                {toolResult.error ? (
                  <Text style={styles.resultError}>Error: {toolResult.error}</Text>
                ) : (
                  <Text style={styles.resultData}>
                    {typeof toolResult.data === 'string'
                      ? toolResult.data
                      : JSON.stringify(toolResult.data, null, 2)}
                  </Text>
                )}
              </GlassCard>
            ) : null}

            {/* Instruction for local MCP server */}
            <GlassCard style={styles.guideCard}>
              <Text style={styles.guideTitle}>How to Start Local MCP Server:</Text>
              <Text style={styles.guideText}>
                1. Open terminal in project root.{'\n'}
                2. Run: npm --prefix server run start (or node server/src/index.ts).{'\n'}
                3. The server starts on port 3000 with JSON-RPC 2.0 tool execution.
              </Text>
            </GlassCard>
          </View>
        </ScrollView>
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  refreshBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderWidth: 1,
  },
  refreshBadgeText: {
    fontSize: 10,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  noticeCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  noticeText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  deviceList: {
    gap: 8,
  },
  deviceCard: {
    padding: theme.spacing.sm,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  deviceIcon: {
    fontSize: 18,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  deviceRoom: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  mcpList: {
    gap: 8,
  },
  mcpCard: {
    padding: theme.spacing.sm,
  },
  mcpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mcpName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  mcpTypeTag: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  mcpDesc: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  mcpMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mcpEndpoint: {
    fontSize: 10,
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  mcpTools: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  mcpChecked: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  guideCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.03)',
    borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  guideTitle: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
    marginBottom: 2,
  },
  guideText: {
    fontSize: 10,
    color: theme.colors.text.muted,
    lineHeight: 15,
  },
  toolActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  toolActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  toolActionBtnActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
  },
  toolActionBtnText: {
    fontSize: 10,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  resultCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
  },
  resultClose: {
    fontSize: 12,
    color: theme.colors.text.muted,
    padding: 2,
  },
  resultError: {
    fontSize: 11,
    color: '#EF4444',
    lineHeight: 16,
  },
  resultData: {
    fontSize: 10,
    color: '#38BDF8',
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: 14,
  },
});
