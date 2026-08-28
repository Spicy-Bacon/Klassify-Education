package com.example.aischoolplatform.dev.parent.data

import com.example.aischoolplatform.dev.parent.model.LanguagePreference

class InMemoryAppPreferenceRepository(
    initialLanguage: LanguagePreference = LanguagePreference.English
) : AppPreferenceRepository {
    private var language = initialLanguage

    override fun getLanguage(): LanguagePreference = language

    override fun setLanguage(preference: LanguagePreference) {
        language = preference
    }
}
