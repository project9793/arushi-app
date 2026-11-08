package com.arushi.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

/**
 * Arushi's Android bridge, exposed to the WebView as `ArushiNativeAndroid`.
 *
 * Every method returns a JSON string; src/native/androidShim.ts parses it and
 * resolves a promise. Only allowlisted actions exist here: no method takes a
 * package name, an intent URI or a class name from JavaScript, and nothing runs
 * arbitrary commands.
 */
public class ArushiDeviceBridge {

    private final Activity activity;

    private static final Map<String, String> PACKAGES = new HashMap<>();

    static {
        PACKAGES.put("whatsapp", "com.whatsapp");
        PACKAGES.put("youtube", "com.google.android.youtube");
        PACKAGES.put("telegram", "org.telegram.messenger");
        PACKAGES.put("x", "com.twitter.android");
        PACKAGES.put("linkedin", "com.linkedin.android");
        PACKAGES.put("maps", "com.google.android.apps.maps");
        PACKAGES.put("spotify", "com.spotify.music");
        PACKAGES.put("netflix", "com.netflix.mediaclient");
        PACKAGES.put("amazon", "in.amazon.mShop.android.shopping");
        PACKAGES.put("flipkart", "com.flipkart.android");
        PACKAGES.put("chrome", "com.android.chrome");
        PACKAGES.put("phone", "com.google.android.dialer");
        PACKAGES.put("camera", "com.google.android.GoogleCamera");
        PACKAGES.put("settings", "com.android.settings");
    }

    public ArushiDeviceBridge(Activity activity) {
        this.activity = activity;
    }

    private String ok(String detail) {
        try {
            return new JSONObject().put("success", true).put("detail", detail).toString();
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"JSON error\"}";
        }
    }

    private String fail(String error) {
        try {
            return new JSONObject().put("success", false).put("error", error).toString();
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"JSON error\"}";
        }
    }

    private String launch(Intent intent, String failureMessage) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
            return ok("");
        } catch (ActivityNotFoundException e) {
            return fail(failureMessage);
        } catch (SecurityException e) {
            return fail(failureMessage + ": permission denied");
        }
    }

    @JavascriptInterface
    public String getPlatform() {
        return "android";
    }

    @JavascriptInterface
    public String openWhatsApp() {
        Intent launchIntent = activity.getPackageManager().getLaunchIntentForPackage("com.whatsapp");
        if (launchIntent == null) return fail("WhatsApp is not installed");
        return launch(launchIntent, "WhatsApp could not be opened");
    }

    @JavascriptInterface
    public String openApp(String appName) {
        String key = appName == null ? "" : appName.trim().toLowerCase();
        String pkg = PACKAGES.get(key);
        if (pkg == null) return fail("\"" + appName + "\" is not on the allowlist");

        Intent launchIntent = activity.getPackageManager().getLaunchIntentForPackage(pkg);
        if (launchIntent == null) return fail(appName + " is not installed");
        return launch(launchIntent, appName + " could not be opened");
    }

    @JavascriptInterface
    public String openUrl(String url) {
        if (url == null) return fail("No URL was provided");
        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equals("http") && !scheme.equals("https"))) {
            return fail("Only http and https links can be opened");
        }
        return launch(new Intent(Intent.ACTION_VIEW, uri), "The link could not be opened");
    }

    /** ACTION_DIAL, not ACTION_CALL: the dialer opens with the number filled in. */
    @JavascriptInterface
    public String makeCall(String phoneNumber) {
        if (phoneNumber == null) return fail("No phone number was provided");
        StringBuilder digits = new StringBuilder();
        for (char c : phoneNumber.toCharArray()) {
            if (Character.isDigit(c) || c == '+') digits.append(c);
        }
        if (digits.length() < 7) return fail("That phone number is not valid");
        return launch(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + digits)), "The dialer could not be opened");
    }

    @JavascriptInterface
    public String requestContactsPermission() {
        boolean granted = activity.checkSelfPermission(android.Manifest.permission.READ_CONTACTS)
                == PackageManager.PERMISSION_GRANTED;
        try {
            return new JSONObject().put("granted", granted).toString();
        } catch (Exception e) {
            return "{\"granted\":false}";
        }
    }

    @JavascriptInterface
    public String searchContacts(String contactName) {
        if (activity.checkSelfPermission(android.Manifest.permission.READ_CONTACTS)
                != PackageManager.PERMISSION_GRANTED) {
            return fail("Contacts permission not granted");
        }

        JSONArray contacts = new JSONArray();
        String[] projection = new String[]{
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER,
                ContactsContract.CommonDataKinds.Phone.TYPE
        };
        String selection = ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " LIKE ?";
        String[] args = new String[]{"%" + (contactName == null ? "" : contactName) + "%"};

        Cursor cursor = null;
        try {
            cursor = activity.getContentResolver().query(
                    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    projection,
                    selection,
                    args,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );

            if (cursor != null) {
                int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                int typeIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE);

                while (cursor.moveToNext() && contacts.length() < 25) {
                    JSONObject entry = new JSONObject();
                    entry.put("name", cursor.getString(nameIndex) == null ? "" : cursor.getString(nameIndex));
                    entry.put("phoneNumber", cursor.getString(numberIndex) == null ? "" : cursor.getString(numberIndex));
                    entry.put("label", String.valueOf(cursor.getInt(typeIndex)));
                    contacts.put(entry);
                }
            }

            return new JSONObject().put("success", true).put("contacts", contacts).toString();
        } catch (Exception e) {
            return fail("Contact search failed: " + e.getMessage());
        } finally {
            if (cursor != null) cursor.close();
        }
    }

    @JavascriptInterface
    public String callContact(String contactName) {
        try {
            JSONObject result = new JSONObject(searchContacts(contactName));
            if (!result.optBoolean("success")) return result.toString();

            JSONArray contacts = result.optJSONArray("contacts");
            if (contacts == null || contacts.length() == 0) {
                return fail("No contact named \"" + contactName + "\" was found");
            }
            if (contacts.length() > 1) {
                return new JSONObject()
                        .put("success", false)
                        .put("error", "Multiple contacts match that name")
                        .put("contacts", contacts)
                        .toString();
            }
            return makeCall(contacts.getJSONObject(0).optString("phoneNumber"));
        } catch (Exception e) {
            return fail("Contact call failed: " + e.getMessage());
        }
    }
}
