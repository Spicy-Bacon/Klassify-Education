package com.klassify.education.dev.parent.data

import com.klassify.education.dev.parent.model.LanguagePreference

class InMemoryAppPreferenceRepository(
    initialLanguage: LanguagePreference = LanguagePreference.English
) : AppPreferenceRepository {
    private var language = initialLanguage

    override fun getLanguage(): LanguagePreference = language

    override fun setLanguage(preference: LanguagePreference) {
        language = preference
    }
}
