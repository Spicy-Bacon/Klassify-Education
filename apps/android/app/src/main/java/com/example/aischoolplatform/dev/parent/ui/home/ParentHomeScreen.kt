package com.example.aischoolplatform.dev.parent.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.aischoolplatform.dev.R
import com.example.aischoolplatform.dev.parent.model.ChildSummary
import com.example.aischoolplatform.dev.parent.model.ParentAnnouncement
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.service.ParentAppResult
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.ErrorState

@Composable
fun ParentHomeScreen(
    service: ParentAppService,
    session: ParentSession,
    selectedChildId: String?,
    onSelectChild: (String) -> Unit,
    onOpenAnnouncements: () -> Unit,
    onOpenAnnouncement: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    when (val result = service.homeState(session, selectedChildId)) {
        is ParentAppResult.Failure -> ErrorState(result.message, modifier = modifier)
        is ParentAppResult.Success -> LazyColumn(
            modifier = modifier.fillMaxSize().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(stringResource(R.string.app_name), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text("DEVELOPMENT ONLY parent session", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.error)
                Text("Good morning, ${result.value.parent.displayName}", style = MaterialTheme.typography.titleMedium)
            }
            item {
                ChildSwitcher(
                    children = result.value.children,
                    selectedChild = result.value.selectedChild,
                    onSelectChild = onSelectChild
                )
            }
            item {
                SummaryCard(title = stringResource(R.string.home_unread_announcements), value = result.value.unreadCount.toString())
            }
            item {
                SectionHeader(stringResource(R.string.home_latest_announcements), actionLabel = stringResource(R.string.home_view_all), onAction = onOpenAnnouncements)
            }
            items(result.value.announcements.take(3)) { announcement ->
                AnnouncementPreviewRow(announcement = announcement, onOpen = { onOpenAnnouncement(announcement.id) })
            }
            item {
                SectionHeader(stringResource(R.string.home_my_children))
            }
            items(result.value.children) { child ->
                Text("${child.displayName} - ${child.className}", style = MaterialTheme.typography.bodyLarge)
            }
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                    Column(Modifier.fillMaxWidth().padding(16.dp)) {
                        Text(stringResource(R.string.home_action_required), style = MaterialTheme.typography.titleMedium)
                        Text(stringResource(R.string.home_forms_coming_soon), style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}

@Composable
private fun ChildSwitcher(children: List<ChildSummary>, selectedChild: ChildSummary?, onSelectChild: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(stringResource(R.string.home_child_context), style = MaterialTheme.typography.titleMedium)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(children) { child ->
                AssistChip(
                    onClick = { onSelectChild(child.studentId) },
                    label = { Text(if (child.studentId == selectedChild?.studentId) "${child.displayName} selected" else "${child.displayName} ${child.className}") }
                )
            }
        }
    }
}

@Composable
private fun SummaryCard(title: String, value: String) {
    Card {
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun SectionHeader(title: String, actionLabel: String? = null, onAction: (() -> Unit)? = null) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        if (actionLabel != null && onAction != null) {
            Button(onClick = onAction) { Text(actionLabel) }
        }
    }
}

@Composable
private fun AnnouncementPreviewRow(announcement: ParentAnnouncement, onOpen: () -> Unit) {
    Card(onClick = onOpen) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Text(announcement.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(4.dp))
            Text(announcement.audienceLabel, style = MaterialTheme.typography.bodySmall)
            Text(if (announcement.readAt == null) "Unread" else "Read", style = MaterialTheme.typography.labelMedium)
        }
    }
}
