package com.example.aischoolplatform.dev.parent.ui.children

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.aischoolplatform.dev.parent.model.ChildSummary
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.service.ParentAppResult
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.EmptyState
import com.example.aischoolplatform.dev.parent.ui.ErrorState

@Composable
fun ChildrenScreen(
    service: ParentAppService,
    session: ParentSession,
    onOpenChild: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    when (val result = service.linkedChildren(session)) {
        is ParentAppResult.Failure -> ErrorState(result.message, modifier = modifier)
        is ParentAppResult.Success -> {
            if (result.value.isEmpty()) {
                EmptyState("No linked children were found.", modifier = modifier)
            } else {
                LazyColumn(modifier = modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    item {
                        Text("Children", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                    items(result.value) { child -> ChildRow(child = child, onOpen = { onOpenChild(child.studentId) }) }
                }
            }
        }
    }
}

@Composable
private fun ChildRow(child: ChildSummary, onOpen: () -> Unit) {
    Card(onClick = onOpen) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(child.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Text(child.yearGroup, style = MaterialTheme.typography.bodyMedium)
            Text("Class ${child.className}", style = MaterialTheme.typography.bodyMedium)
        }
    }
}
