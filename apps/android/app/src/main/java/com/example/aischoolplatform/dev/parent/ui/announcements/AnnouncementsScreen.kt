package com.example.aischoolplatform.dev.parent.ui.announcements

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.aischoolplatform.dev.R
import com.example.aischoolplatform.dev.parent.model.ParentAnnouncement
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.service.ParentAppResult
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.EmptyState
import com.example.aischoolplatform.dev.parent.ui.ErrorState

@Composable
fun AnnouncementsScreen(
    service: ParentAppService,
    session: ParentSession,
    onOpenAnnouncement: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    when (val result = service.inbox(session)) {
        is ParentAppResult.Failure -> ErrorState(result.message, modifier = modifier)
        is ParentAppResult.Success -> {
            if (result.value.isEmpty()) {
                EmptyState(stringResource(R.string.empty_announcements), modifier = modifier)
            } else {
                LazyColumn(modifier = modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    item {
                        Text(stringResource(R.string.screen_announcements), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                    items(result.value) { announcement ->
                        AnnouncementRow(announcement = announcement, onOpen = { onOpenAnnouncement(announcement.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun AnnouncementRow(announcement: ParentAnnouncement, onOpen: () -> Unit) {
    val unread = announcement.readAt == null
    Card(onClick = onOpen, modifier = Modifier.semantics { contentDescription = if (unread) "Unread announcement" else "Read announcement" }) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(announcement.title, style = MaterialTheme.typography.titleMedium, fontWeight = if (unread) FontWeight.Bold else FontWeight.Normal)
                Text(if (unread) "Unread" else "Read", style = MaterialTheme.typography.labelMedium)
            }
            Text(announcement.publishedAt, style = MaterialTheme.typography.bodySmall)
            Text(announcement.audienceLabel, style = MaterialTheme.typography.bodySmall)
        }
    }
}
