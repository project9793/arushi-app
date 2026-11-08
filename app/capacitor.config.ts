import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android packaging config. `scripts/prepare-android.sh` runs `npx cap add
 * android`, which needs these three values.
 *
 * The native bridge (android-bridge/ArushiDeviceBridge.java) is copied into the
 * generated project and injected as window.ArushiNativeAndroid by MainActivity.
 */
const config: CapacitorConfig = {
  appId: 'com.arushi.app',
  appName: 'Arushi',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#07050f',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
