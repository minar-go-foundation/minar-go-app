package com.minar.goapp;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

	private static final int REQUEST_PERMISSIONS = 110;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// Request runtime permissions for location and external storage on Android
		requestRequiredPermissions();

		try {
			WebView webView = (WebView) this.getBridge().getWebView();
			webView.getSettings().setJavaScriptEnabled(true);
			webView.getSettings().setGeolocationEnabled(true);
			webView.setWebChromeClient(new WebChromeClient() {
				@Override
				public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
					// Auto-grant geolocation permission to the WebView content (app must still have runtime location permission)
					callback.invoke(origin, true, false);
				}

				@Override
				public void onPermissionRequest(final PermissionRequest request) {
					// Auto-approve requested permissions from the WebView (e.g., camera/mic) if app already has them
					final String[] requestedResources = request.getResources();
					List<String> granted = new ArrayList<>();
					for (String r : requestedResources) {
						granted.add(r);
					}
					request.grant(requestedResources);
				}
			});
		} catch (Exception e) {
			// If anything fails here, we still continue—permissions will be requested at runtime
			e.printStackTrace();
		}
	}

	private void requestRequiredPermissions() {
		String[] perms = new String[]{
				Manifest.permission.ACCESS_FINE_LOCATION,
				Manifest.permission.ACCESS_COARSE_LOCATION,
				Manifest.permission.READ_EXTERNAL_STORAGE,
				Manifest.permission.WRITE_EXTERNAL_STORAGE
		};

		List<String> toRequest = new ArrayList<>();
		for (String p : perms) {
			if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
				toRequest.add(p);
			}
		}
		if (!toRequest.isEmpty()) {
			ActivityCompat.requestPermissions(this, toRequest.toArray(new String[0]), REQUEST_PERMISSIONS);
		}
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults);
		if (requestCode == REQUEST_PERMISSIONS) {
			// You can handle any specific logic here if needed after permissions are resolved
		}
	}
}
