package com.oweebee.kangbangaming;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String savedUrl = prefs().getString(PREF_URL, null);
        if (savedUrl == null || savedUrl.isEmpty()) {
            showSetup();
        } else {
            loadWebView(savedUrl);
        }
    }

    // Appelé à chaque fois que la fenêtre gagne le focus (retour d'un dialog, d'une autre app…)
    // C'est l'endroit correct pour appliquer le fullscreen — le hide() est ignoré si la window
    // n'a pas encore de vue attachée, donc appeler ça ici garantit qu'il prend effet.
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && webView != null) {
            applyFullscreen();
        }
    }

    // ── Écran de configuration (premier lancement) ────────────────────────────

    private void showSetup() {
        // Setup screen : comportement clavier normal (le clavier pousse le contenu vers le haut)
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#242424"));
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(32), dp(80), dp(32), dp(64));

        TextView title = new TextView(this);
        title.setText("KangBanGaming");
        title.setTextColor(Color.parseColor("#f0ece4"));
        title.setTextSize(26);
        title.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 0, 0, dp(8));
        root.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Entrez l'adresse de votre serveur");
        sub.setTextColor(Color.parseColor("#a09890"));
        sub.setTextSize(15);
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(0, 0, 0, dp(32));
        root.addView(sub);

        EditText urlInput = new EditText(this);
        urlInput.setHint("https://");
        urlInput.setHintTextColor(Color.parseColor("#505050"));
        urlInput.setTextColor(Color.parseColor("#f0ece4"));
        urlInput.setBackgroundColor(Color.parseColor("#2e2e2e"));
        urlInput.setTextSize(15);
        urlInput.setPadding(dp(14), dp(14), dp(14), dp(14));
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

        Button btn = new Button(this);
        btn.setText("Connexion");
        btn.setTextColor(Color.parseColor("#f0ece4"));
        btn.setBackgroundColor(Color.parseColor("#C0570A"));
        btn.setTextSize(15);
        btn.setPadding(0, dp(12), 0, dp(12));

        root.addView(btn, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

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

    // ── Cycle de vie WebView ──────────────────────────────────────────────────

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            // Si le renderer a été tué en background, l'URL est null → recharger
            if (webView.getUrl() == null || webView.getUrl().isEmpty()) {
                String savedUrl = prefs().getString(PREF_URL, null);
                if (savedUrl != null) webView.loadUrl(savedUrl);
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    // ── WebView ───────────────────────────────────────────────────────────────

    private void loadWebView(String url) {
        // Détruire l'ancien WebView s'il existe (changement de serveur, renderer crash…)
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }

        webView = new WebView(this);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setUseWideViewPort(true);        // respecte le <meta viewport> de la page
        s.setLoadWithOverviewMode(false);  // NE PAS zoomer pour faire rentrer tout le contenu
                                           // → la page s'affiche en 1:1 → React détecte mobile
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL);

        // User agent : remplace "wv" (WebView marker) par un UA Chrome normal.
        // Steam et d'autres services bloquent les WebViews identifiées — ceci évite ça.
        String ua = s.getUserAgentString().replace("; wv)", ")");
        s.setUserAgentString(ua);

        // Pas de scrollbar horizontal
        webView.setHorizontalScrollBarEnabled(false);
        webView.setScrollbarFadingEnabled(true);

        // Android 11+ : le clavier envoie des IME insets.
        // Ce listener ajuste le padding bas du WebView selon la hauteur du clavier.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            webView.setOnApplyWindowInsetsListener((v, insets) -> {
                int imeHeight = insets.getInsets(WindowInsets.Type.ime()).bottom;
                int navHeight = insets.getInsets(WindowInsets.Type.navigationBars()).bottom;
                v.setPadding(0, 0, 0, imeHeight > 0 ? imeHeight : navHeight);
                return insets;
            });
        }

        // Sans WebChromeClient, window.confirm / window.alert / window.prompt sont muets.
        webView.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView view, String url2, String message, android.webkit.JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                    .setMessage(message)
                    .setPositiveButton(android.R.string.ok, (d, w) -> result.confirm())
                    .setOnCancelListener(d -> result.confirm())
                    .show();
                return true;
            }
            @Override
            public boolean onJsConfirm(WebView view, String url2, String message, android.webkit.JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                    .setMessage(message)
                    .setPositiveButton(android.R.string.ok, (d, w) -> result.confirm())
                    .setNegativeButton(android.R.string.cancel, (d, w) -> result.cancel())
                    .setOnCancelListener(d -> result.cancel())
                    .show();
                return true;
            }
            @Override
            public boolean onJsPrompt(WebView view, String url2, String message, String defaultValue, android.webkit.JsPromptResult result) {
                final EditText input = new EditText(MainActivity.this);
                input.setText(defaultValue);
                new AlertDialog.Builder(MainActivity.this)
                    .setMessage(message)
                    .setView(input)
                    .setPositiveButton(android.R.string.ok, (d, w) -> result.confirm(input.getText().toString()))
                    .setNegativeButton(android.R.string.cancel, (d, w) -> result.cancel())
                    .setOnCancelListener(d -> result.cancel())
                    .show();
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String pageUrl) {
                injectOverflowFix(view);
                // Re-injecter après le premier render React (au cas où il serait tardif)
                view.postDelayed(() -> injectOverflowFix(view), 800);
            }

            // CRITIQUE : sans ce handler, Android crashe le processus principal si le
            // renderer WebView est tué par le système (RAM faible, Android 14/15 Pixel 9).
            // Retourner true indique qu'on gère la situation — on recrée proprement le WebView.
            @Override
            public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                String savedUrl = prefs().getString(PREF_URL, null);
                if (savedUrl != null) {
                    // loadWebView détruit l'ancien WebView et en crée un neuf
                    loadWebView(savedUrl);
                }
                return true; // NE PAS retourner false — crasherait le processus principal
            }
        });

        // ── PAS de setOnLongClickListener ──────────────────────────────────────
        // L'appui long est utilisé par le Kanban pour déplacer les cartes (drag & drop).
        // Un listener ici intercepterait le geste et bloquerait le glissement des cartes.
        // Pour changer de serveur → bouton retour → "Changer de serveur" dans le dialog.

        webView.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        setContentView(webView);

        // Appliquer le fullscreen maintenant que le WebView est attaché à la fenêtre
        applyFullscreen();

        webView.loadUrl(url);
    }

    // ── Injection CSS overflow-x ─────────────────────────────────────────────
    // Injecte une balise <style> persistante dans <head>.
    // Différence clé avec des inline styles : React ne touche jamais les <style> du <head>,
    // donc cette règle survit à tous les re-renders (sauvegarde de note, ouverture modale, etc.)
    // Le !important garantit la priorité sur tout ce que React peut injecter.

    private void injectOverflowFix(WebView view) {
        view.evaluateJavascript(
            "(function(){" +
            "  if(document.getElementById('kwv-fix'))return;" +  // déjà injecté
            "  var s=document.createElement('style');" +
            "  s.id='kwv-fix';" +
            "  s.textContent=" +
            "    'html,body{overflow-x:hidden!important;max-width:100vw!important}';" +
            "  document.head&&document.head.appendChild(s);" +
            "})()",
            null
        );
    }

    // ── Fullscreen adaptatif ──────────────────────────────────────────────────

    private void applyFullscreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController ctrl = getWindow().getInsetsController();
            if (ctrl != null) {
                ctrl.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                ctrl.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            );
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
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
    // Le long-press sur le WebView étant retiré, "Changer de serveur" est ici.

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                .setTitle("KangBanGaming")
                .setItems(
                    new CharSequence[]{"Changer de serveur", "Quitter l'app"},
                    (dialog, which) -> {
                        if (which == 0) showUrlChangeDialog();
                        else finish();
                    }
                )
                .show();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private SharedPreferences prefs() {
        return getSharedPreferences(PREF_FILE, MODE_PRIVATE);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
