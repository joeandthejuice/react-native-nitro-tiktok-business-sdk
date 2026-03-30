import { useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  TikTokAppEventsModule,
  TikTokStandardEventNames,
} from '@joeandthejuice/react-native-nitro-tiktok-business-sdk';

function nowLabel(): string {
  return new Date().toLocaleTimeString();
}

type InitializationMode = 'idle' | 'tracking-enabled' | 'delayed-tracking';

export default function App() {
  const [accessToken, setAccessToken] = useState('');
  const [appId, setAppId] = useState('');
  const [tikTokAppId, setTikTokAppId] = useState('');
  const [externalId, setExternalId] = useState('demo-user-123');
  const [externalUserName, setExternalUserName] = useState('demo-user');
  const [email, setEmail] = useState('demo@example.com');
  const [phoneNumber, setPhoneNumber] = useState('+15551234567');
  const [initializationMode, setInitializationMode] =
    useState<InitializationMode>('idle');
  const [logs, setLogs] = useState<string[]>([
    'Fill in your TikTok access token, app ID, and TikTok App ID, then choose a tracking-enabled or delayed-tracking init flow.',
  ]);

  function appendLog(message: string) {
    setLogs((current) => [`${nowLabel()}  ${message}`, ...current].slice(0, 16));
  }

  async function initialize(trackingEnabled: boolean) {
    try {
      await TikTokAppEventsModule.initialize({
        accessToken,
        appId,
        tikTokAppId,
        trackingEnabled,
        logLevel: __DEV__ ? 'debug' : 'none',
      });
      const mode: InitializationMode = trackingEnabled
        ? 'tracking-enabled'
        : 'delayed-tracking';
      setInitializationMode(mode);

      if (mode === 'tracking-enabled') {
        appendLog(
          'SDK initialized with tracking enabled. You can now send test events immediately.'
        );
        return;
      }

      appendLog(
        Platform.OS === 'ios'
          ? 'SDK initialized in delayed-tracking mode. Tap Start Tracking before sending events. Deferred deep links stay unavailable on iOS in this mode because the TikTok SDK does not mark itself initialized.'
          : 'SDK initialized in delayed-tracking mode. Tap Start Tracking before sending events.'
      );
    } catch (error) {
      appendLog(`Initialize failed: ${String(error)}`);
    }
  }

  function startTracking() {
    try {
      TikTokAppEventsModule.startTracking();
      appendLog(
        initializationMode === 'delayed-tracking'
          ? 'Tracking started after delayed init.'
          : 'Tracking started.'
      );
    } catch (error) {
      appendLog(`Start tracking failed: ${String(error)}`);
    }
  }

  function identify() {
    try {
      TikTokAppEventsModule.identify({
        externalId,
        externalUserName,
        email,
        phoneNumber,
      });
      appendLog('Identity pushed to TikTok advanced matching.');
    } catch (error) {
      appendLog(`Identify failed: ${String(error)}`);
    }
  }

  function logout() {
    try {
      TikTokAppEventsModule.logout();
      appendLog('Logout sent to TikTok SDK.');
    } catch (error) {
      appendLog(`Logout failed: ${String(error)}`);
    }
  }

  function trackRegistration() {
    try {
      TikTokAppEventsModule.trackStandardEvent(
        TikTokStandardEventNames.Registration
      );
      appendLog('Tracked Registration event.');
    } catch (error) {
      appendLog(`Registration tracking failed: ${String(error)}`);
    }
  }

  function trackPurchase() {
    try {
      TikTokAppEventsModule.trackStandardEvent(
        TikTokStandardEventNames.Purchase,
        {
          currency: 'USD',
          value: 9.99,
          description: 'Example subscription purchase',
          content_id: 'example-pro-monthly',
          content_type: 'subscription',
          contents: [
            {
              content_id: 'example-pro-monthly',
              content_name: 'Example Pro Monthly',
              price: '9.99',
              quantity: 1,
            },
          ],
        },
        `example-purchase-${Date.now()}`
      );
      appendLog('Tracked Purchase event.');
    } catch (error) {
      appendLog(`Purchase tracking failed: ${String(error)}`);
    }
  }

  function trackCustomEvent() {
    try {
      TikTokAppEventsModule.trackCustomEvent(
        'DemoCustomEvent',
        {
          source: 'example-app',
          test_run: true,
          nested: {
            platform: 'react-native',
            sdk: 'tiktok-app-events',
          },
        },
        `demo-custom-${Date.now()}`
      );
      appendLog('Tracked custom event.');
    } catch (error) {
      appendLog(`Custom event tracking failed: ${String(error)}`);
    }
  }

  async function fetchDeferredDeepLink() {
    if (Platform.OS === 'ios' && initializationMode === 'delayed-tracking') {
      appendLog(
        'Deferred deep link fetch is unavailable on iOS after delayed-tracking init. Reinitialize with tracking enabled if you need to test deferred deep links.'
      );
      return;
    }

    try {
      const url = await TikTokAppEventsModule.fetchDeferredDeepLink();
      appendLog(url ? `Deferred deep link: ${url}` : 'No deferred deep link available.');
    } catch (error) {
      appendLog(`Deferred deep link fetch failed: ${String(error)}`);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.title}>TikTok Business SDK Demo</Text>
          <Text style={styles.subtitle}>
            Use this example app to validate the App Events subset of the
            standalone Nitro bridge against a real TikTok Events Manager app.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SDK Credentials</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setAccessToken}
            placeholder="Access token"
            placeholderTextColor="#7f8896"
            style={styles.input}
            value={accessToken}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setAppId}
            placeholder="App ID"
            placeholderTextColor="#7f8896"
            style={styles.input}
            value={appId}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setTikTokAppId}
            placeholder="TikTok App ID or comma-separated IDs"
            placeholderTextColor="#7f8896"
            style={styles.input}
            value={tikTokAppId}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identity</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setExternalId}
            placeholder="External ID"
            placeholderTextColor="#7f8896"
            style={styles.input}
            value={externalId}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setExternalUserName}
            placeholder="External username"
            placeholderTextColor="#7f8896"
            style={styles.input}
            value={externalUserName}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#7f8896"
            style={styles.input}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            onChangeText={setPhoneNumber}
            placeholder="Phone number in E.164"
            placeholderTextColor="#7f8896"
            style={styles.input}
            value={phoneNumber}
          />
        </View>

        <View style={styles.buttonGrid}>
          <DemoButton
            label="Initialize SDK"
            onPress={() => initialize(true)}
          />
          <DemoButton
            label="Initialize SDK (Delayed Tracking)"
            onPress={() => initialize(false)}
          />
          <DemoButton label="Start Tracking" onPress={startTracking} />
          <DemoButton label="Identify" onPress={identify} />
          <DemoButton label="Logout" onPress={logout} />
          <DemoButton label="Track Registration" onPress={trackRegistration} />
          <DemoButton label="Track Purchase" onPress={trackPurchase} />
          <DemoButton label="Track Custom Event" onPress={trackCustomEvent} />
          <DemoButton
            label="Fetch Deferred Deep Link"
            onPress={fetchDeferredDeepLink}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Event Log</Text>
          {logs.map((entry) => (
            <Text key={entry} style={styles.logEntry}>
              {entry}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type DemoButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
};

function DemoButton({ label, onPress }: DemoButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4efe8',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  title: {
    color: '#1d140f',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: '#5f5b57',
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#fffaf4',
    borderColor: '#e5d9c7',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  sectionTitle: {
    color: '#1d140f',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d7c7b0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#1d140f',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonGrid: {
    gap: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1d140f',
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fffaf4',
    fontSize: 15,
    fontWeight: '600',
  },
  logEntry: {
    color: '#3f3b37',
    fontSize: 13,
    lineHeight: 18,
  },
});
