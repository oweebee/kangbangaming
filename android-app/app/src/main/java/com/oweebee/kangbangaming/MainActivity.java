package com.oweebee.kangbangaming;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {

    private static final String PREF_FILE = "kangban_prefs";
    private static final String PREF_URL  = "server_url";

    private WebView webView;

    // ─────────────────────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Plein écran
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        String savedUrl = prefs().getString(PREF_URL, null);
        if (savedUrl == null || savedUrl.isEmpty()) {
            showSetup();
        } else {
            loadWebView(savedUrl);
        }
    }

    // ── Écran de configuration (premier lancement) ────────────────────────────

    private void showSetup() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#242424"));
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(32), dp(64), dp(32), dp(64));

        // Titre
        TextView title = new TextView(this);
        title.setText("KangBanGaming");
        title.setTextColor(Color.parseColor("#f0ece4"));
        title.setTextSize(24);
        title.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 0, 0, dp(8));
        root.addView(title);

        // Sous-titre
        TextView sub = new TextView(this);
        sub.setText("Entrez l'adresse de votre serveur");
        sub.setTextColor(Color.parseColor("#a09890"));
        sub.setTextSize(14);
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(0, 0, 0, dp(32));
        root.addView(sub);

        // Champ URL
        EditText urlInput = new EditText(this);
        urlInput.setHint("https://");
        urlInput.setHintTextColor(Color.parseColor("#505050"));
        urlInput.setTextColor(Color.parseColor("#f0ece4"));
        urlInput.setBackgroundColor(Color.parseColor("#2e2e2e"));
        urlInput.setTextSize(14);
        urlInput.setPadding(dp(14), dp(12), dp(14), dp(12));
        urlInput.setInputType(
            android.text.InputType.TYPE_CLASS_TEXT |
            android.text.InputType.TYPE_TEXT_VARIATION_URI
        );
        urlInput.setText("https://");

        LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        inputParams.bottomMargin = dp(16);
        root.addView(urlInput, inputParams);

        // Bouton connexion
        Button btn = new Button(this);
        btn.setText("Connexion");
        btn.setTextColor(Color.parseColor("#f0ece4"));
        btn.setBackgroundColor(Color.parseColor("#C0570A"));
        btn.setTextSize(14);

        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        root.addView(btn, btnParams);

        btn.setOnClickListener(v -> {
            String url = urlInput.getText().toString().trim();
            if (url.isEmpty() || url.equals("https://")) {
                urlInput.setError("Entrez une URL valide");
                return;
            }
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }
            prefs().edit().putString(PREF_URL, url).apply();
            loadWebView(url);
        });

        setContentView(root);
    }

    // ── WebView ───────────────────────────────────────────────────────────────

    private void loadWebView(String url) {
        webView = new WebView(this);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Tout charger dans la WebView (pas d'ouverture navigateur)
                return false;
            }
        });

        // Appui long → dialog changement d'URL
        webView.setOnLongClickListener(v -> {
            showUrlChangeDialog();
            return true;
        });

        setContentView(webView);
        webView.loadUrl(url);
    }

    // ── Dialog changement d'URL ───────────────────────────────────────────────

    private void showUrlChangeDialog() {
        String current = prefs().getString(PREF_URL, "");

        EditText input = new EditText(this);
        input.setText(current);
        input.setTextColor(Color.parseColor("#f0ece4"));
        input.setBackgroundColor(Color.parseColor("#2e2e2e"));
        input.setPadding(dp(16), dp(12), dp(16), dp(12));

        new AlertDialog.Builder(this)
            .setTitle("Changer de serveur")
            .setView(input)
            .setPositiveButton("Connexion", (dialog, which) -> {
                String newUrl = input.getText().toString().trim();
                if (!newUrl.isEmpty()) {
                    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                        newUrl = "https://" + newUrl;
                    }
                    prefs().edit().putString(PREF_URL, newUrl).apply();
                    loadWebView(newUrl);
                }
            })
            .setNegativeButton("Annuler", null)
            .show();
    }

    // ── Bouton retour ─────────────────────────────────────────────────────────

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                .setTitle("Quitter")
                .setMessage("Quitter KangBanGaming ?")
                .setPositiveButton("Quitter", (d, w) -> finish())
                .setNegativeButton("Annuler", null)
                .show();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private SharedPreferences prefs() {
        return getSharedPreferences(PREF_FILE, MODE_PRIVATE);
    }

    /** Convertit dp en pixels selon la densité de l'écran */
    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
