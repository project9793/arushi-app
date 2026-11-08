package com.arushi.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.bridge.getWebView().addJavascriptInterface(
                new ArushiDeviceBridge(this),
                "ArushiNativeAndroid"
        );

        this.bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        this.bridge.getWebView().getSettings().setDomStorageEnabled(true);
    }
}
