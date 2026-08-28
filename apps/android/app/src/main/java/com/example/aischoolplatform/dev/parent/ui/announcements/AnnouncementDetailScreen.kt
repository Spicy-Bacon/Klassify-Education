package com.example.aischoolplatform.dev.parent.ui.announcements

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.aischoolplatform.dev.parent.model.ParentAnnouncement
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.service.ParentAppResult
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.ErrorState

@Composable
fun AnnouncementDetailScreen(
    service: ParentAppService,
    session: ParentSession,
    announcementId: String,
    onBack: () -> Unit
) {
    var announcement by remember(announcementId) { mutableStateOf<ParentAnnouncement?>(null) }
    var error by remember(announcementId) { mutableStateOf<String?>(null) }

    LaunchedEffect(announcementId) {
        when (val result = service.markAnnouncementRead(session, announcementId)) {
            is ParentAppResult.Failure -> error = result.message
            is ParentAppResult.Success -> announcement = result.value
        }
    }

    if (error != null) {
        ErrorState(error!!)
        return
    }

    val value = announcement
    if (value == null) {
        Text("Loading", modifier = Modifier.padding(24.dp))
        return
    }

    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Button(onClick = onBack) { Text("Back") }
            Text("Read", style = MaterialTheme.typography.labelMedium)
        }
        Text(value.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("From ${value.authorDisplayName}", style = MaterialTheme.typography.bodyMedium)
        Text(value.publishedAt, style = MaterialTheme.typography.bodySmall)
        Text(value.audienceLabel, style = MaterialTheme.typography.labelLarge)
        Text(value.body, style = MaterialTheme.typography.bodyLarge)
    }
}
