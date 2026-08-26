package com.example.aischoolplatform.dev

import android.app.Activity
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            gravity = Gravity.CENTER
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "AI School Platform"
            textSize = 28f
            gravity = Gravity.CENTER
        }

        val pillars = TextView(this).apply {
            text = "Connect\nManage\nCapture"
            textSize = 18f
            gravity = Gravity.CENTER
        }

        val status = TextView(this).apply {
            text = "Development Build"
            textSize = 14f
            gravity = Gravity.CENTER
        }

        layout.addView(title)
        layout.addView(pillars)
        layout.addView(status)

        setContentView(layout)
    }
}
