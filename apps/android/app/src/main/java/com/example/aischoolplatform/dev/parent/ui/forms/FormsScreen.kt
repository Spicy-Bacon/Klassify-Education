package com.example.aischoolplatform.dev.parent.ui.forms

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
import com.example.aischoolplatform.dev.parent.model.ParentFormStatus
import com.example.aischoolplatform.dev.parent.model.ParentFormTask
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.service.ParentAppResult
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.EmptyState
import com.example.aischoolplatform.dev.parent.ui.ErrorState

@Composable
fun FormsScreen(
    service: ParentAppService,
    session: ParentSession,
    onOpenForm: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    when (val result = service.forms(session)) {
        is ParentAppResult.Failure -> ErrorState(result.message, modifier = modifier)
        is ParentAppResult.Success -> {
            if (result.value.isEmpty()) {
                EmptyState(stringResource(R.string.empty_forms), modifier = modifier)
            } else {
                LazyColumn(modifier = modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    item {
                        Text(stringResource(R.string.screen_forms), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                    items(result.value) { form ->
                        FormRow(form = form, onOpen = { onOpenForm(form.recipientId) })
                    }
                }
            }
        }
    }
}

@Composable
private fun FormRow(form: ParentFormTask, onOpen: () -> Unit) {
    val outstanding = form.status == ParentFormStatus.Outstanding
    Card(onClick = onOpen, modifier = Modifier.semantics { contentDescription = if (outstanding) "Outstanding form" else "Submitted form" }) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(form.title, style = MaterialTheme.typography.titleMedium, fontWeight = if (outstanding) FontWeight.Bold else FontWeight.Normal)
                Text(form.status.name, style = MaterialTheme.typography.labelMedium)
            }
            Text(form.child?.let { "${it.displayName} - ${it.className}" } ?: "Family-level form", style = MaterialTheme.typography.bodySmall)
            Text(form.deadlineAt?.let { "Due $it" } ?: "No deadline", style = MaterialTheme.typography.bodySmall)
        }
    }
}