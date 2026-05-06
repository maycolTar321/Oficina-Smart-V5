package com.example.oficinapro;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 1. Buscamos el WebView en el diseño
        WebView webView = (WebView) findViewById(R.id.myWebView);
        
        // 2. Configuramos los ajustes
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setDatabaseEnabled(true);

        // 3. Importante: Para que no abra el navegador de Google
        webView.setWebViewClient(new WebViewClient());

        // 4. Cargamos tu archivo local
        webView.loadUrl("file:///android_asset/index.html");
    }
}
