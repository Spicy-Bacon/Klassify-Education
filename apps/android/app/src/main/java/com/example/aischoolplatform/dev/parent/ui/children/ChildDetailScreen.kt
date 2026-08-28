package com.example.aischoolplatform.dev.parent.ui.children

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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.service.ParentAppResult
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.ErrorState

@Composable
fun ChildDetailScreen(
    service: ParentAppService,
    session: ParentSession,
    childId: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    when (val result = service.child(session, childId)) {
        is ParentAppResult.Failure -> ErrorState(result.message, modifier = modifier)
        is ParentAppResult.Success -> Column(modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Button(onClick = onBack) { Text("Back") }
            }
            Text(result.value.displayName, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("Student number: ${result.value.studentNumber}", style = MaterialTheme.typography.bodyLarge)
            Text("Year: ${result.value.yearGroup}", style = MaterialTheme.typography.bodyLarge)
            Text("Class: ${result.value.className}", style = MaterialTheme.typography.bodyLarge)
            Text("School: Demo School", style = MaterialTheme.typography.bodyLarge)
        }
    }
}
