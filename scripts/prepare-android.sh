#!/usr/bin/env bash
# Generates the Capacitor Android project and drops Arushi's native bridge into it.
set -euo pipefail

cd app
npm install --no-audit --no-fund --legacy-peer-deps
npx vite build
npx cap add android

BRIDGE_DIR=android/app/src/main/java/com/arushi/app
cp ../android-bridge/ArushiDeviceBridge.java "$BRIDGE_DIR/ArushiDeviceBridge.java"
cp ../android-bridge/MainActivity.java "$BRIDGE_DIR/MainActivity.java"

python3 ../scripts/patch_manifest.py android/app/src/main/AndroidManifest.xml

chmod +x android/gradlew
echo 'android project ready'
