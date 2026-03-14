import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import WebSocketService from '../services/WebSocketService';
import SensorStreamService from '../services/SensorStreamService';
import AuthService from '../services/AuthService';
import {
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '../tasks/BackgroundLocationTask';
import { ConnectionStatus } from '../types';

type RootStackParamList = {
  Login: undefined;
  Streaming: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Streaming'>;
};

export default function StreamingScreen({ navigation }: Props) {
  const { token, childId, childName, connectionStatus, payloadsSent, lastPayloadAt } =
    useAuthStore();
  const setConnectionStatus = useAuthStore((s) => s.setConnectionStatus);
  const incrementPayloadsSent = useAuthStore((s) => s.incrementPayloadsSent);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [hz, setHz] = useState(0);
  const hzCounterRef = useRef(0);

  // Calculate effective Hz over a 1s rolling window
  useEffect(() => {
    const timer = setInterval(() => {
      setHz(hzCounterRef.current);
      hzCounterRef.current = 0;
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSend = useCallback(
    (success: boolean) => {
      if (success) {
        incrementPayloadsSent();
        hzCounterRef.current += 1;
      }
    },
    [incrementPayloadsSent],
  );

  // Connect WebSocket and start sensor streaming on mount
  useEffect(() => {
    if (!token || !childId) return;

    WebSocketService.setStatusCallback((status: ConnectionStatus) => {
      setConnectionStatus(status);
    });

    WebSocketService.connect(token);
    SensorStreamService.setSendCallback(handleSend);

    SensorStreamService.start(childId).catch((err) => {
      Alert.alert('Sensor Error', err.message ?? 'Failed to start sensors');
    });

    // Start background location (best-effort)
    startBackgroundLocationUpdates().catch((err) => {
      console.warn('[Streaming] Background location not started:', err.message);
    });

    return () => {
      SensorStreamService.stop();
      stopBackgroundLocationUpdates().catch(() => {});
      WebSocketService.disconnect();
    };
  }, [token, childId, handleSend, setConnectionStatus]);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Stop streaming and sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          SensorStreamService.stop();
          await stopBackgroundLocationUpdates().catch(() => {});
          WebSocketService.disconnect();
          await AuthService.logout();
          clearAuth();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const statusColor: Record<ConnectionStatus, string> = {
    connected: '#22c55e',
    connecting: '#f59e0b',
    disconnected: '#ef4444',
    error: '#ef4444',
  };

  const statusLabel: Record<ConnectionStatus, string> = {
    connected: 'LIVE',
    connecting: 'CONNECTING',
    disconnected: 'DISCONNECTED',
    error: 'ERROR',
  };

  const lastUpdateAgo = lastPayloadAt
    ? Math.round((Date.now() - lastPayloadAt) / 1000)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status badge */}
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: statusColor[connectionStatus] }]} />
        <Text style={[styles.statusText, { color: statusColor[connectionStatus] }]}>
          {statusLabel[connectionStatus]}
        </Text>
      </View>

      {/* Child info */}
      <Text style={styles.childName}>{childName ?? 'Unknown Device'}</Text>
      <Text style={styles.childId} numberOfLines={1} ellipsizeMode="middle">
        {childId ?? '—'}
      </Text>

      {/* Metrics grid */}
      <View style={styles.grid}>
        <MetricCard label="Stream Rate" value={`${hz} Hz`} highlight={hz > 0} />
        <MetricCard label="Payloads Sent" value={payloadsSent.toLocaleString()} />
        <MetricCard
          label="Last Sent"
          value={lastUpdateAgo !== null ? `${lastUpdateAgo}s ago` : '—'}
          highlight={lastUpdateAgo !== null && lastUpdateAgo < 2}
        />
        <MetricCard
          label="Target Rate"
          value="2 Hz"
          sublabel="(500ms)"
        />
      </View>

      {/* Backend info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>WEBSOCKET</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:8080/ws/sensor'}
        </Text>
        <Text style={styles.infoLabel}>STOMP DESTINATION</Text>
        <Text style={styles.infoValue}>/app/sensor.stream</Text>
        <Text style={styles.infoLabel}>PLATFORM</Text>
        <Text style={styles.infoValue}>{Platform.OS.toUpperCase()}</Text>
      </View>

      {/* Reconnect hint */}
      {connectionStatus !== 'connected' && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {connectionStatus === 'connecting'
              ? 'Connecting to backend...'
              : 'Connection lost. Retrying with exponential backoff...'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <View style={metricStyles.card}>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={[metricStyles.value, highlight && metricStyles.valueHighlight]}>
        {value}
      </Text>
      {sublabel && <Text style={metricStyles.sublabel}>{sublabel}</Text>}
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    minWidth: '40%',
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  valueHighlight: {
    color: '#22c55e',
  },
  sublabel: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  childName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  childId: {
    fontSize: 12,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginVertical: 8,
  },
  infoBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  infoLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  warningBox: {
    backgroundColor: '#431407',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  warningText: {
    color: '#fca5a5',
    fontSize: 13,
    textAlign: 'center',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
});
