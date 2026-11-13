#!/usr/bin/env bash
# Generates the Capacitor Android project and drops Arushi's native bridge into it.
set -euo pipefail

VERSION_CODE="${VERSION_CODE:-2}"
VERSION_NAME="${VERSION_NAME:-1.$VERSION_CODE}"

cd app
npm install --no-audit --no-fund --legacy-peer-deps
npx vite build
npx cap add android

BRIDGE_DIR=android/app/src/main/java/com/arushi/app
cp ../android-bridge/ArushiDeviceBridge.java "$BRIDGE_DIR/ArushiDeviceBridge.java"
cp ../android-bridge/MainActivity.java "$BRIDGE_DIR/MainActivity.java"

python3 ../scripts/patch_manifest.py android/app/src/main/AndroidManifest.xml

# A fixed versionCode makes Android treat every build as "the same app" and the
# installer refuses to replace it. Bump both numbers on every build.
GRADLE_FILE=android/app/build.gradle
if [ -f "$GRADLE_FILE" ]; then
  sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/" "$GRADLE_FILE"
  sed -i -E "s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME}\"/" "$GRADLE_FILE"
fi

echo "Building version ${VERSION_NAME} (code ${VERSION_CODE})"
grep -E "versionCode|versionName" "$GRADLE_FILE" || true
