package com.arushi.nativeapp

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.util.Base64
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

const val DEFAULT_PERSONA =
    "You are a young, confident, witty and playful voice assistant. " +
        "You talk like a close friend on a phone call: warm, quick, a little teasing. " +
        "Keep replies to one or two short sentences because they are spoken aloud. " +
        "Detect the user's language and reply in the same language."

data class AppSettings(
    val name: String = "Arushi",
    val userName: String = "",
    val persona: String = DEFAULT_PERSONA,
    val voice: String = "Aoede",
    val apiKey: String = "",
    val language: String = "auto"
)

class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("arushi", Context.MODE_PRIVATE)

    fun load(): AppSettings = AppSettings(
        name = sp.getString("name", "Arushi") ?: "Arushi",
        userName = sp.getString("userName", "") ?: "",
        persona = sp.getString("persona", DEFAULT_PERSONA) ?: DEFAULT_PERSONA,
        voice = sp.getString("voice", "Aoede") ?: "Aoede",
        apiKey = sp.getString("apiKey", "") ?: "",
        language = sp.getString("language", "auto") ?: "auto"
    )

    fun save(settings: AppSettings) {
        sp.edit()
            .putString("name", settings.name)
            .putString("userName", settings.userName)
            .putString("persona", settings.persona)
            .putString("voice", settings.voice)
            .putString("apiKey", settings.apiKey)
            .putString("language", settings.language)
            .apply()
    }
}

data class Turn(val role: String, val text: String)

data class Session(val at: Long, val provider: String, val lines: List<Turn>)

class HistoryStore(context: Context) {
    private val sp = context.getSharedPreferences("arushi_history", Context.MODE_PRIVATE)

    fun load(): List<Session> {
        val raw = sp.getString("sessions", null) ?: return emptyList()
        return try {
            val array = JSONArray(raw)
            (0 until array.length()).map { index ->
                val obj = array.getJSONObject(index)
                val linesArray = obj.optJSONArray("lines") ?: JSONArray()
                val lines = (0 until linesArray.length()).map { lineIndex ->
                    val line = linesArray.getJSONObject(lineIndex)
                    Turn(line.optString("role"), line.optString("text"))
                }
                Session(obj.optLong("at"), obj.optString("provider"), lines)
            }
        } catch (error: Exception) {
            emptyList()
        }
    }

    fun save(session: Session) {
        val sessions = (listOf(session) + load()).take(40)
        val array = JSONArray()
        sessions.forEach { item ->
            val obj = JSONObject()
            obj.put("at", item.at)
            obj.put("provider", item.provider)
            val linesArray = JSONArray()
            item.lines.forEach { line ->
                val lineObj = JSONObject()
                lineObj.put("role", line.role)
                lineObj.put("text", line.text)
                linesArray.put(lineObj)
            }
            obj.put("lines", linesArray)
            array.put(obj)
        }
        sp.edit().putString("sessions", array.toString()).apply()
    }

    fun clear() {
        sp.edit().remove("sessions").apply()
    }
}

/** Microphone capture at 16 kHz and speaker playback at 24 kHz. */
class AudioEngine(private val onMicChunk: (ByteArray) -> Unit) {

    private var record: AudioRecord? = null
    private var track: AudioTrack? = null
    @Volatile private var running = false
    private var micThread: Thread? = null

    fun startMic(): Boolean {
        if (running) return true

        val minBuffer = AudioRecord.getMinBufferSize(
            SAMPLE_RATE_IN,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        if (minBuffer <= 0) return false

        val recorder = try {
            AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                SAMPLE_RATE_IN,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                maxOf(minBuffer, CHUNK_SAMPLES * 2 * 4)
            )
        } catch (error: Exception) {
            return false
        }

        if (recorder.state != AudioRecord.STATE_INITIALIZED) {
            recorder.release()
            return false
        }

        record = recorder
        running = true
        recorder.startRecording()

        micThread = thread(name = "arushi-mic") {
            val buffer = ShortArray(CHUNK_SAMPLES)
            while (running) {
                val read = recorder.read(buffer, 0, buffer.size)
                if (read > 0) {
                    val bytes = ByteArray(read * 2)
                    var index = 0
                    for (i in 0 until read) {
                        val value = buffer[i].toInt()
                        bytes[index++] = (value and 0xFF).toByte()
                        bytes[index++] = ((value shr 8) and 0xFF).toByte()
                    }
                    onMicChunk(bytes)
                }
            }
        }

        return true
    }

    fun play(pcm: ByteArray) {
        val player = track ?: createTrack() ?: return
        try {
            player.write(pcm, 0, pcm.size)
        } catch (_: Exception) {
        }
    }

    private fun createTrack(): AudioTrack? {
        return try {
            val minBuffer = AudioTrack.getMinBufferSize(
                SAMPLE_RATE_OUT,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            val player = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(SAMPLE_RATE_OUT)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setTransferMode(AudioTrack.MODE_STREAM)
                .setBufferSizeInBytes(maxOf(minBuffer, SAMPLE_RATE_OUT / 2))
                .build()
            player.play()
            track = player
            player
        } catch (error: Exception) {
            null
        }
    }

    fun stop() {
        running = false
        micThread?.join(400)
        micThread = null
        record?.let {
            try {
                it.stop()
            } catch (_: Exception) {
            }
            it.release()
        }
        record = null
        track?.let {
            try {
                it.stop()
            } catch (_: Exception) {
            }
            it.release()
        }
        track = null
    }

    companion object {
        const val SAMPLE_RATE_IN = 16000
        const val SAMPLE_RATE_OUT = 24000
        const val CHUNK_SAMPLES = 1600
    }
}

/**
 * Gemini Live over a raw WebSocket.
 *
 * The API key itself cannot be used on the websocket any more, so we mint a
 * short-lived ephemeral token over REST and connect to the constrained v1alpha
 * endpoint with ?access_token=. If minting fails we fall back to the plain key
 * on v1beta so the user still sees a real error instead of silence.
 */
class GeminiLive(
    private val settings: AppSettings,
    private val onAudio: (ByteArray) -> Unit,
    private val onReady: () -> Unit,
    private val onTranscript: (role: String, text: String) -> Unit,
    private val onClosed: (String) -> Unit,
    private val onError: (String) -> Unit
) {
    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var socket: WebSocket? = null

    private fun mintToken(): String? {
        return try {
            val body = "{\"uses\":0}".toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("https://generativelanguage.googleapis.com/v1alpha/authTokens?key=" + settings.apiKey)
                .post(body)
                .build()

            client.newCall(request).execute().use { response ->
                val text = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    onError("Token request failed (HTTP " + response.code + "): " + text.take(160))
                    return null
                }
                JSONObject(text).optString("name").ifBlank { null }
            }
        } catch (error: Exception) {
            onError("Token request failed: " + (error.message ?: ""))
            null
        }
    }

    fun connect() {
        thread(name = "arushi-connect") {
            val token = mintToken()
            val url = if (token != null) {
                "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=" + token
            } else {
                "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" + settings.apiKey
            }

            val request = Request.Builder().url(url).build()
            socket = client.newWebSocket(request, object : WebSocketListener() {
                override fun onOpen(webSocket: WebSocket, response: Response) {
                    webSocket.send(setupMessage())
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                    handleMessage(text)
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                    onError("Connection failed: " + (t.message ?: "unknown error"))
                }

                override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                    onClosed(reason.ifBlank { "code " + code })
                }
            })
        }
    }

    private fun setupMessage(): String {
        val instruction = buildString {
            append(settings.persona)
            append("\n\nYour name is ").append(settings.name).append(".")
            if (settings.userName.isNotBlank()) {
                append(" The user's name is ").append(settings.userName).append(".")
            }
        }

        val root = JSONObject()
        val setup = JSONObject()
        setup.put("model", "models/gemini-3.8-live")

        val generation = JSONObject()
        generation.put("responseModalities", JSONArray().put("AUDIO"))
        val speech = JSONObject()
        val voiceConfig = JSONObject()
        voiceConfig.put("prebuiltVoiceConfig", JSONObject().put("voiceName", settings.voice))
        speech.put("voiceConfig", voiceConfig)
        generation.put("speechConfig", speech)
        setup.put("generationConfig", generation)

        setup.put(
            "systemInstruction",
            JSONObject().put("parts", JSONArray().put(JSONObject().put("text", instruction)))
        )

        setup.put("inputAudioTranscription", JSONObject())
        setup.put("outputAudioTranscription", JSONObject())

        root.put("setup", setup)
        return root.toString()
    }

    private fun handleMessage(text: String) {
        try {
            val obj = JSONObject(text)
            if (obj.has("setupComplete")) {
                onReady()
                return
            }

            val content = obj.optJSONObject("serverContent") ?: return
            val parts = content.optJSONObject("modelTurn")?.optJSONArray("parts")
            if (parts != null) {
                for (index in 0 until parts.length()) {
                    val inline = parts.optJSONObject(index)?.optJSONObject("inlineData") ?: continue
                    val data = inline.optString("data")
                    if (data.isNotEmpty()) {
                        onAudio(Base64.decode(data, Base64.DEFAULT))
                    }
                }
            }

            content.optJSONObject("outputTranscription")?.optString("text")?.let {
                if (it.isNotBlank()) onTranscript("assistant", it)
            }
            content.optJSONObject("inputTranscription")?.optString("text")?.let {
                if (it.isNotBlank()) onTranscript("user", it)
            }
        } catch (error: Exception) {
            onError("Bad message from Gemini: " + (error.message ?: ""))
        }
    }

    fun sendAudio(bytes: ByteArray) {
        val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
        socket?.send("{\"realtimeInput\":{\"audio\":{\"data\":\"$base64\",\"mimeType\":\"audio/pcm;rate=16000\"}}}")
    }

    fun sendText(text: String) {
        val content = JSONObject()
        content.put("role", "user")
        content.put("parts", JSONArray().put(JSONObject().put("text", text)))
        val turn = JSONObject()
        turn.put("turns", JSONArray().put(content))
        turn.put("turnComplete", true)
        socket?.send(JSONObject().put("clientContent", turn).toString())
    }

    fun close() {
        socket?.close(1000, "client closed")
        socket = null
    }
}
