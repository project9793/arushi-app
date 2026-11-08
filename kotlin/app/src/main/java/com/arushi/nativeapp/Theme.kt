package com.arushi.nativeapp

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val Ink = Color(0xFF07030F)
val DeepPurple = Color(0xFF1A0B33)
val GoldLight = Color(0xFFFFE9A3)
val GoldMid = Color(0xFFF4C14A)
val GoldDark = Color(0xFFA9761B)
val Cream = Color(0xFFFDF6FF)

private val ArushiColors = darkColorScheme(
    primary = GoldMid,
    onPrimary = Ink,
    background = Ink,
    onBackground = Cream,
    surface = DeepPurple,
    onSurface = Cream
)

@Composable
fun ArushiTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = ArushiColors, content = content)
}

@Composable
fun GoldText(text: String, size: Int = 28, modifier: Modifier = Modifier) {
    Text(
        text = text,
        modifier = modifier,
        style = TextStyle(
            brush = Brush.verticalGradient(listOf(GoldLight, GoldMid, GoldDark)),
            fontSize = size.sp,
            fontWeight = FontWeight.Bold
        )
    )
}

@Composable
fun FantasyBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF2A1350), Color(0xFF140827), Ink)
                )
            )
    ) { content() }
}

@Composable
fun SphereButton(
    label: String,
    top: Color,
    bottom: Color,
    modifier: Modifier = Modifier,
    diameter: Dp = 76.dp,
    onClick: () -> Unit,
    content: @Composable () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Box(
            modifier = Modifier
                .size(diameter)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color.White.copy(alpha = 0.88f), top, bottom),
                        radius = 170f
                    )
                )
                .border(1.dp, Color.White.copy(alpha = 0.35f), CircleShape)
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) { content() }
        Text(
            text = label,
            color = Cream,
            fontSize = 9.sp,
            lineHeight = 10.sp,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
            modifier = Modifier.size(width = diameter + 10.dp, height = 24.dp)
        )
    }
}
