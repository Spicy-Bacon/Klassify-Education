package com.klassify.education.dev.parent.ui.forms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.klassify.education.dev.parent.model.ParentFormAnswer
import com.klassify.education.dev.parent.model.ParentFormQuestion
import com.klassify.education.dev.parent.model.ParentFormQuestionType
import com.klassify.education.dev.parent.model.ParentFormStatus
import com.klassify.education.dev.parent.model.ParentSession
import com.klassify.education.dev.parent.service.ParentAppResult
import com.klassify.education.dev.parent.service.ParentAppService
import com.klassify.education.dev.parent.ui.ErrorState

@Composable
fun FormDetailScreen(
    service: ParentAppService,
    session: ParentSession,
    recipientId: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    when (val result = service.form(session, recipientId)) {
        is ParentAppResult.Failure -> ErrorState(result.message, modifier = modifier)
        is ParentAppResult.Success -> {
            val task = result.value
            val answers = remember(recipientId) { mutableStateMapOf<String, String>() }
            var localMessage by remember(recipientId) { mutableStateOf<String?>(null) }
            var submitted by remember(recipientId, task.submittedAt) { mutableStateOf(task.status == ParentFormStatus.Submitted) }

            LazyColumn(modifier = modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    TextButton(onClick = onBack) { Text("Back") }
                    Text(task.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text(task.child?.let { "${it.displayName} - ${it.className}" } ?: "Family-level form", style = MaterialTheme.typography.bodyMedium)
                    Text(task.deadlineAt?.let { "Due $it" } ?: "No deadline", style = MaterialTheme.typography.bodySmall)
                    Text(if (submitted) "Submitted" else task.status.name, style = MaterialTheme.typography.labelMedium)
                }
                item {
                    Card {
                        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(task.description, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
                items(task.questions) { question ->
                    QuestionInput(
                        question = question,
                        enabled = !submitted && task.status == ParentFormStatus.Outstanding,
                        value = answers[question.id] ?: task.submittedAnswers.firstOrNull { it.questionId == question.id }?.value.orEmpty(),
                        onValueChange = { answers[question.id] = it }
                    )
                }
                item {
                    if (localMessage != null) {
                        Text(localMessage!!, color = MaterialTheme.colorScheme.error)
                    }
                    if (!submitted && task.status == ParentFormStatus.Outstanding) {
                        Button(
                            onClick = {
                                val submissionAnswers = task.questions.map { question ->
                                    ParentFormAnswer(question.id, answers[question.id].orEmpty())
                                }
                                when (val submitResult = service.submitForm(session, task.recipientId, submissionAnswers)) {
                                    is ParentAppResult.Failure -> localMessage = submitResult.message
                                    is ParentAppResult.Success -> {
                                        submitted = true
                                        localMessage = "Form submitted."
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Submit")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuestionInput(
    question: ParentFormQuestion,
    enabled: Boolean,
    value: String,
    onValueChange: (String) -> Unit
) {
    Card {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(question.label + if (question.required) " *" else "", style = MaterialTheme.typography.titleMedium)
            when (question.type) {
                ParentFormQuestionType.Acknowledgement,
                ParentFormQuestionType.Consent -> BooleanAnswer(enabled = enabled, value = value == "true", onValueChange = { onValueChange(it.toString()) })
                ParentFormQuestionType.ShortText,
                ParentFormQuestionType.LongText -> OutlinedTextField(
                    enabled = enabled,
                    value = value,
                    onValueChange = onValueChange,
                    minLines = if (question.type == ParentFormQuestionType.LongText) 3 else 1,
                    modifier = Modifier.fillMaxWidth()
                )
                ParentFormQuestionType.SingleChoice -> Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    question.options.forEach { option ->
                        TextButton(enabled = enabled, onClick = { onValueChange(option) }) {
                            Text(if (value == option) "$option selected" else option)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BooleanAnswer(enabled: Boolean, value: Boolean, onValueChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Checkbox(enabled = enabled, checked = value, onCheckedChange = { onValueChange(it) })
        Text("I agree")
    }
}