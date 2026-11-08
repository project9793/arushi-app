#!/usr/bin/env python3
"""Add the permissions and package-visibility queries Arushi needs.

Idempotent: running it twice does not duplicate entries.
"""
import sys

PERMISSIONS = [
    'android.permission.INTERNET',
    'android.permission.RECORD_AUDIO',
    'android.permission.MODIFY_AUDIO_SETTINGS',
    'android.permission.READ_CONTACTS',
    'android.permission.CALL_PHONE',
    'android.permission.CAMERA',
]

PACKAGES = [
    'com.whatsapp', 'com.whatsapp.w4b', 'com.google.android.youtube', 'com.instagram.android',
    'com.facebook.katana', 'org.telegram.messenger', 'com.snapchat.android', 'com.twitter.android',
    'com.linkedin.android', 'com.google.android.gm', 'com.google.android.apps.maps',
    'com.spotify.music', 'com.netflix.mediaclient', 'in.startv.hotstar',
    'in.amazon.mShop.android.shopping', 'com.flipkart.android', 'com.application.zomato',
    'in.swiggy.android', 'net.one97.paytm', 'com.phonepe.app',
    'com.google.android.apps.nbu.paisa.user', 'com.ubercab', 'com.olacabs.customer',
    'com.android.chrome', 'com.google.android.dialer', 'com.google.android.GoogleCamera',
    'com.android.settings',
]


def main() -> int:
    path = sys.argv[1]
    with open(path, encoding='utf-8') as handle:
        manifest = handle.read()

    additions = []
    for permission in PERMISSIONS:
        if f'android:name="{permission}"' not in manifest:
            additions.append(f'    <uses-permission android:name="{permission}" />')

    if '<queries>' not in manifest:
        lines = ['    <queries>']
        for package in PACKAGES:
            lines.append(f'        <package android:name="{package}" />')
        lines.append('        <intent>')
        lines.append('            <action android:name="android.intent.action.VIEW" />')
        lines.append('            <data android:scheme="https" />')
        lines.append('        </intent>')
        lines.append('        <intent>')
        lines.append('            <action android:name="android.intent.action.DIAL" />')
        lines.append('            <data android:scheme="tel" />')
        lines.append('        </intent>')
        lines.append('    </queries>')
        additions.append('\n'.join(lines))

    if additions:
        manifest = manifest.replace('</manifest>', '\n'.join(additions) + '\n</manifest>')
        with open(path, 'w', encoding='utf-8') as handle:
            handle.write(manifest)

    print(f'patched {path}: {len(additions)} block(s) added')
    return 0


if __name__ == '__main__':
    sys.exit(main())
