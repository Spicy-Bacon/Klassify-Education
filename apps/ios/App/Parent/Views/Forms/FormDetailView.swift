import SwiftUI

struct FormDetailView: View {
    let service: ParentAppService
    let session: ParentSession
    let recipientId: String

    @State private var task: ParentFormTask?
    @State private var answers: [String: String] = [:]
    @State private var errorMessage: String?
    @State private var submittedMessage: String?

    var body: some View {
        Group {
            if let task {
                List {
                    Section {
                        Text(task.title)
                            .font(.title2.bold())
                        Text(task.child.map { "\($0.displayName) - \($0.className)" } ?? "Family-level form")
                        Text(task.deadlineAt.map { "Due \($0)" } ?? "No deadline")
                            .foregroundStyle(.secondary)
                        Text(task.status.rawValue.capitalized)
                            .font(.caption.bold())
                    }
                    Section("Details") {
                        Text(task.description)
                    }
                    Section("Questions") {
                        ForEach(task.questions) { question in
                            QuestionAnswerView(
                                question: question,
                                enabled: task.status == .outstanding && submittedMessage == nil,
                                value: Binding(
                                    get: { answers[question.id] ?? task.submittedAnswers.first { $0.questionId == question.id }?.value ?? "" },
                                    set: { answers[question.id] = $0 }
                                )
                            )
                        }
                    }
                    if let errorMessage {
                        Section {
                            Text(errorMessage)
                                .foregroundStyle(.red)
                        }
                    }
                    if let submittedMessage {
                        Section {
                            Text(submittedMessage)
                                .foregroundStyle(.green)
                        }
                    }
                    if task.status == .outstanding && submittedMessage == nil {
                        Section {
                            Button("Submit") {
                                submit(task)
                            }
                        }
                    }
                }
            } else if let errorMessage {
                ErrorStateView(message: errorMessage)
            } else {
                ProgressView("Loading")
            }
        }
        .navigationTitle("Form")
        .task {
            do {
                task = try service.form(session: session, recipientId: recipientId)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func submit(_ task: ParentFormTask) {
        do {
            let submitted = try service.submitForm(
                session: session,
                recipientId: task.recipientId,
                answers: task.questions.map { ParentFormAnswer(questionId: $0.id, value: answers[$0.id] ?? "") }
            )
            self.task = submitted
            submittedMessage = "Form submitted."
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct QuestionAnswerView: View {
    let question: ParentFormQuestion
    let enabled: Bool
    @Binding var value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(question.label + (question.required ? " *" : ""))
                .font(.headline)
            switch question.type {
            case .acknowledgement, .consent:
                Toggle("I agree", isOn: Binding(get: { value == "true" }, set: { value = $0 ? "true" : "false" }))
                    .disabled(!enabled)
            case .shortText, .longText:
                TextField("Answer", text: $value, axis: question.type == .longText ? .vertical : .horizontal)
                    .disabled(!enabled)
            case .singleChoice:
                ForEach(question.options, id: \.self) { option in
                    Button(value == option ? "\(option) selected" : option) {
                        value = option
                    }
                    .disabled(!enabled)
                }
            }
        }
    }
}