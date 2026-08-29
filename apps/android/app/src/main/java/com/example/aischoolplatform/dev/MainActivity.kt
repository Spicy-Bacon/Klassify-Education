package com.example.aischoolplatform.dev

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.aischoolplatform.dev.app.KlassifyApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KlassifyApp(isDevelopmentBuild = BuildConfig.DEBUG)
        }
    }
}
