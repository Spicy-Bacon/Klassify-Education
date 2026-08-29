package com.example.aischoolplatform.dev.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.aischoolplatform.dev.parent.service.DevelopmentParentComposition
import com.example.aischoolplatform.dev.parent.ui.ParentRootView

@Composable
fun KlassifyApp(isDevelopmentBuild: Boolean) {
    MaterialTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
            if (isDevelopmentBuild) {
                val context = LocalContext.current.applicationContext
                val service = remember { DevelopmentParentComposition.createService(context) }
                val session = remember { service.currentSession() }
                if (session == null) {
                    AuthNotConfiguredScreen()
                } else {
                    ParentRootView(service = service, session = session)
                }
            } else {
                AuthNotConfiguredScreen()
            }
        }
    }
}

@Composable
private fun AuthNotConfiguredScreen() {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Klassify Education", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Authentication is not configured.", style = MaterialTheme.typography.bodyLarge)
    }
}
