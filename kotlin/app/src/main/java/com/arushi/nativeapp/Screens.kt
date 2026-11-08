package com.arushi.nativeapp

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val CardBg = Color(0xFF1B0F2E)
val CardBorder = Color(0x33FFFFFF)

@Composable
fun TopBar(name: String, onProfile: () -> Unit, onExit: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .background(Brush.verticalGradient(listOf(Color(0xFF3C240C), Color(0xFF180E06))))
                .border(1.dp, GoldMid.copy(alpha = 0.6f), RoundedCornerShape(50))
                .clickable(onClick = onProfile)
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Text("My Profile ›", color = GoldLight, fontSize = 11.sp)
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            GoldText(text = name, size = 24)
            Text("AI Assistant", color = Color(0xFFF0ABFC), fontSize = 11.sp)
        }

        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(Color(0xFF1B0F2E))
                .border(1.dp, GoldMid.copy(alpha = 0.6f), CircleShape)
                .clickable(onClick = onExit),
            contentAlignment = Alignment.Center
        ) {
            Text("⏻", color = GoldLight, fontSize = 16.sp)
        }
    }
}

@Composable
fun Mascot(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.size(112.dp).clip(RoundedCornerShape(46.dp))
            .background(Brush.verticalGradient(listOf(Color.White, Color(0xFFD6E0F2), Color(0xFFA9B8D6))))
            .border(2.dp, Color.White.copy(alpha = 0.6f), RoundedCornerShape(46.dp)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Box(Modifier.size(11.dp).clip(CircleShape).background(Color(0xFFC4B5FD)))
                Box(Modifier.size(11.dp).clip(CircleShape).background(Color(0xFFC4B5FD)))
            }
            Spacer(Modifier.height(8.dp))
            Box(
                Modifier.width(26.dp).height(10.dp).clip(RoundedCornerShape(bottomStart = 20.dp, bottomEnd = 20.dp))
                    .background(Color(0xFFC4B5FD))
            )
        }
    }
}

@Composable
fun SpeechBubble(name: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.verticalGradient(listOf(Color(0xEB3C1450), Color(0xF2180828))))
            .border(1.dp, Color(0xFFD8B4FE).copy(alpha = 0.6f), RoundedCornerShape(20.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Column {
            Text("Hello!", color = Cream, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("I am $name", color = Color(0xFFF0ABFC), fontSize = 13.sp)
            Text("How can I help you?", color = Cream, fontSize = 12.sp)
        }
    }
}

@Composable
fun HomeContent(
    settings: AppSettings,
    state: String,
    onTalk: () -> Unit,
    onTab: (String) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(6.dp))
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Mascot()
            SpeechBubble(settings.name)
        }

        Spacer(Modifier.height(18.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(22.dp)) {
            SphereButton("Chat Now", Color(0xFF4ADE80), Color(0xFF14532D), onClick = { onTab("chat") }) {
                Text("Chat", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            SphereButton("Smart Tools", Color(0xFFF472B6), Color(0xFF831843), onClick = { onTab("settings") }) {
                Text("Tools", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(Modifier.height(14.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            SphereButton("Voice Assistant", Color(0xFFFB923C), Color(0xFF7C2D12), onClick = onTalk) {
                Text("Voice", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            SphereButton("Ask Anything", Color(0xFFF472B6), Color(0xFF4A0D29), onClick = onTalk) {
                Text("?", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            }
            SphereButton("More Apps", Color(0xFFA3E635), Color(0xFF3F6212), onClick = { onTab("history") }) {
                Text("Apps", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(Modifier.height(16.dp))
        Text(
            text = when (state) {
                "listening" -> "Listening… speak now"
                "speaking" -> "$nameOf is speaking…"
                "connecting" -> "Connecting…"
                else -> "Tap Voice Assistant to start"
            }.replace("$nameOf", settings.name),
            color = Color(0xFFCBB6FF),
            fontSize = 12.sp,
            textAlign = TextAlign.Center
        )
    }
}

private const val nameOf = "__name__"

@Composable
fun TalkContent(state: String, transcript: List<Turn>, error: String?, onStop: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(20.dp))
        Box(
            modifier = Modifier.size(220.dp).clip(CircleShape).background(
                Brush.radialGradient(
                    listOf(Color(0xFFFFFFFF), Color(0xFFF472B6), Color(0xFF7C3AED)),
                    radius = 320f
                )
            ),
            contentAlignment = Alignment.Center
        ) {
            Text(if (state == "speaking") "Speaking" else "", color = Color(0xFF1B0F2E), fontSize = 13.sp)
        }

        Spacer(Modifier.height(16.dp))
        Text(
            text = when (state) {
                "listening" -> "Listening"
                "speaking" -> "Speaking"
                "connecting" -> "Connecting…"
                "error" -> "Something went wrong"
                else -> "Tap to Talk"
            },
            color = Cream, fontSize = 22.sp, fontWeight = FontWeight.SemiBold
        )

        if (error != null) {
            Spacer(Modifier.height(8.dp))
            Text(error, color = Color(0xFFFFC2C2), fontSize = 11.sp, textAlign = TextAlign.Center)
        }

        Spacer(Modifier.height(18.dp))
        Box(
            modifier = Modifier.size(76.dp).clip(CircleShape)
                .background(Brush.verticalGradient(listOf(Color(0xFFF43F5E), Color(0xFFD946EF))))
                .clickable(onClick = onStop),
            contentAlignment = Alignment.Center
        ) {
            Box(Modifier.size(20.dp).clip(RoundedCornerShape(5.dp)).background(Color.White))
        }

        Spacer(Modifier.height(20.dp))
        LazyColumn(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            items(transcript.takeLast(12)) { turn ->
                TurnBubble(turn)
            }
        }
    }
}

@Composable
fun TurnBubble(turn: Turn) {
    val isUser = turn.role == "user"
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(if (isUser) Color(0xFF4C1D95) else CardBg)
                .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                .padding(horizontal = 10.dp, vertical = 8.dp)
        ) {
            Text(turn.text, color = Cream, fontSize = 13.sp)
        }
    }
}

@Composable
fun ChatContent(
    transcript: List<Turn>,
    onSend: (String) -> Unit
) {
    var draft by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Chat", color = Cream, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(10.dp))

        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            items(transcript) { turn -> TurnBubble(turn) }
        }

        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = draft,
                onValueChange = { draft = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Type a message…", color = Color(0x66FFFFFF), fontSize = 12.sp) },
                textStyle = TextStyle(color = Cream, fontSize = 13.sp)
            )
            Spacer(Modifier.width(8.dp))
            Button(
                onClick = {
                    if (draft.isNotBlank()) {
                        onSend(draft.trim())
                        draft = ""
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6))
            ) { Text("Send") }
        }
    }
}

@Composable
fun HistoryContent(sessions: List<Session>, onClear: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("History", color = Cream, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
            Text("Clear all", color = GoldLight, fontSize = 12.sp, modifier = Modifier.clickable(onClick = onClear))
        }

        Spacer(Modifier.height(10.dp))

        if (sessions.isEmpty()) {
            Text("No sessions yet.", color = Color(0x66FFFFFF), fontSize = 12.sp)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(sessions) { session ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(CardBg)
                            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                            .padding(10.dp)
                    ) {
                        Text(
                            text = java.text.SimpleDateFormat("dd MMM, hh:mm a", java.util.Locale.getDefault())
                                .format(java.util.Date(session.at)),
                            color = Color(0xFFCBB6FF), fontSize = 11.sp
                        )
                        Spacer(Modifier.height(4.dp))
                        session.lines.take(4).forEach { line ->
                            Text(
                                text = (if (line.role == "user") "You: " else "AI: ") + line.text,
                                color = Cream, fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsContent(
    settings: AppSettings,
    onSave: (AppSettings) -> Unit
) {
    var name by remember { mutableStateOf(settings.name) }
    var userName by remember { mutableStateOf(settings.userName) }
    var apiKey by remember { mutableStateOf(settings.apiKey) }
    var voice by remember { mutableStateOf(settings.voice) }
    var persona by remember { mutableStateOf(settings.persona) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Settings", color = Cream, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            value = apiKey,
            onValueChange = { apiKey = it },
            label = { Text("Gemini API key") },
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation(),
            textStyle = TextStyle(color = Cream, fontSize = 13.sp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )

        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Assistant name") },
            modifier = Modifier.fillMaxWidth(),
            textStyle = TextStyle(color = Cream, fontSize = 13.sp)
        )

        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = userName,
            onValueChange = { userName = it },
            label = { Text("Your name") },
            modifier = Modifier.fillMaxWidth(),
            textStyle = TextStyle(color = Cream, fontSize = 13.sp)
        )

        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = voice,
            onValueChange = { voice = it },
            label = { Text("Voice (Aoede, Kore, Puck…) ") },
            modifier = Modifier.fillMaxWidth(),
            textStyle = TextStyle(color = Cream, fontSize = 13.sp)
        )

        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = persona,
            onValueChange = { persona = it },
            label = { Text("Character") },
            modifier = Modifier.fillMaxWidth().height(120.dp),
            textStyle = TextStyle(color = Cream, fontSize = 13.sp)
        )

        Spacer(Modifier.height(12.dp))
        Button(
            onClick = {
                onSave(
                    settings.copy(
                        name = name.trim().ifBlank { "Arushi" },
                        userName = userName.trim(),
                        apiKey = apiKey.trim(),
                        voice = voice.trim().ifBlank { "Aoede" },
                        persona = persona
                    )
                )
            },
            colors = ButtonDefaults.buttonColors(containerColor = GoldMid)
        ) { Text("Save", color = Ink) }
    }
}

@Composable
fun BottomBar(active: String, onSelect: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.verticalGradient(listOf(Color(0xFA260F3C), Color(0xFA0C0618))))
            .border(1.dp, GoldMid.copy(alpha = 0.45f), RoundedCornerShape(24.dp))
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        listOf("home" to "Home", "chat" to "Chat", "history" to "History", "settings" to "Setting")
            .forEach { (id, label) ->
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.clickable { onSelect(id) }
                ) {
                    Text(
                        text = label,
                        color = if (active == id) GoldMid else Color(0xFFB8A8D9),
                        fontSize = 12.sp,
                        fontWeight = if (active == id) FontWeight.Bold else FontWeight.Normal
                    )
                }
            }
    }
}
