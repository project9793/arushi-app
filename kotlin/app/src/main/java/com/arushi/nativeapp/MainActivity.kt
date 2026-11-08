package com.arushi.nativeapp

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat

/** Owns the live session so the UI stays declarative. */
class VoiceSession(
    private val onState: (String) -> Unit,
    private val onTranscript: (Turn) -> Unit,
    private val onError: (String) -> Unit
) {
    private var live: GeminiLive? = null
    private var engine: AudioEngine? = null

    fun start(settings: AppSettings) {
        if (settings.apiKey.isBlank()) {
            onError("No Gemini API key yet. Open Setting and paste your key.")
            onState("error")
            return
        }

        onState("connecting")
        val audio = AudioEngine { bytes -> live?.sendAudio(bytes) }
        engine = audio

        val client = GeminiLive(
            settings = settings,
            onAudio = { pcm -> audio.play(pcm) },
            onReady = {
                // Mic starts only now: audio before setup kills the session.
                if (!audio.startMic()) {
                    onError("Microphone could not start.")
                    onState("error")
                } else {
                    onState("listening")
                }
            },
            onTranscript = { role, text -> onTranscript(Turn(role, text)) },
            onClosed = { onState("idle") },
            onError = { message ->
                onError(message)
                onState("error")
            }
        )
        live = client
        client.connect()
    }

    fun sendText(text: String) {
        live?.sendText(text)
    }

    fun stop() {
        live?.close()
        live = null
        engine?.stop()
        engine = null
        onState("idle")
    }
}

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = Prefs(this)
        val history = HistoryStore(this)

        setContent {
            ArushiTheme {
                AppRoot(prefs, history)
            }
        }
    }
}

@Composable
fun AppRoot(prefs: Prefs, history: HistoryStore) {
    val context = LocalContext.current
    val main = remember { Handler(Looper.getMainLooper()) }

    var settings by remember { mutableStateOf(prefs.load()) }
    var tab by remember { mutableStateOf("home") }
    var inTalk by remember { mutableStateOf(false) }
    var state by remember { mutableStateOf("idle") }
    var transcript by remember { mutableStateOf(listOf<Turn>()) }
    var error by remember { mutableStateOf<String?>(null) }
    var sessions by remember { mutableStateOf(history.load()) }

    fun post(block: () -> Unit) {
        main.post(block)
    }

    val session = remember {
        VoiceSession(
            onState = { value -> post { state = value } },
            onTranscript = { turn -> post { transcript = transcript + turn } },
            onError = { message -> post { error = message } }
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            error = null
            session.start(settings)
        } else {
            error = "Microphone permission is required."
            state = "error"
        }
    }

    fun startTalking() {
        inTalk = true
        error = null
        val granted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (granted) session.start(settings) else permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
    }

    fun stopTalking() {
        session.stop()
        inTalk = false
        if (transcript.isNotEmpty()) {
            history.save(Session(System.currentTimeMillis(), "gemini", transcript))
            sessions = history.load()
        }
        transcript = emptyList()
    }

    FantasyBackground {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            if (inTalk) {
                TalkContent(state = state, transcript = transcript, error = error, onStop = { stopTalking() })
            } else {
                TopBar(
                    name = settings.name,
                    onProfile = { tab = "settings" },
                    onExit = { session.stop() }
                )

                Column(modifier = Modifier.weight(1f)) {
                    when (tab) {
                        "home" -> HomeContent(
                            settings = settings,
                            state = state,
                            onTalk = { startTalking() },
                            onTab = { tab = it }
                        )
                        "chat" -> ChatContent(
                            transcript = transcript,
                            onSend = { text ->
                                transcript = transcript + Turn("user", text)
                                session.sendText(text)
                            }
                        )
                        "history" -> HistoryContent(
                            sessions = sessions,
                            onClear = {
                                history.clear()
                                sessions = emptyList()
                            }
                        )
                        "settings" -> SettingsContent(
                            settings = settings,
                            onSave = { updated ->
                                prefs.save(updated)
                                settings = updated
                                tab = "home"
                            }
                        )
                    }
                }

                Column(modifier = Modifier.navigationBarsPadding()) {
                    BottomBar(active = tab, onSelect = { tab = it })
                }
            }
        }
    }
}
