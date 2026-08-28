package com.example.aischoolplatform.dev.parent.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AssistChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.aischoolplatform.dev.parent.model.LanguagePreference
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.service.ParentAppResult
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.ErrorState

@Composable
fun SettingsScreen(service: ParentAppService, session: ParentSession, modifier: Modifier = Modifier) {
    var language by remember { mutableStateOf(LanguagePreference.English) }
    when (val result = service.homeState(session)) {
        is ParentAppResult.Failure -> ErrorState(result.message, modifier = modifier)
        is ParentAppResult.Success -> Column(modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
            Text("Settings", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Parent profile", style = MaterialTheme.typography.titleMedium)
                Text(result.value.parent.displayName)
                Text(result.value.parent.email)
            }
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Selected language", style = MaterialTheme.typography.titleMedium)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = { language = LanguagePreference.English }, label = { Text(if (language == LanguagePreference.English) "English selected" else "English") })
                    AssistChip(onClick = { language = LanguagePreference.TraditionalChinese }, label = { Text(if (language == LanguagePreference.TraditionalChinese) "繁體中文 selected" else "繁體中文") })
                }
            }
            Text("Version 0.1.0-dev", style = MaterialTheme.typography.bodyMedium)
            Text("Development build", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.error)
        }
    }
}
