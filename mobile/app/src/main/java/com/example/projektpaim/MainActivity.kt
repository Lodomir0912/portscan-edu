package com.example.projektpaim

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.DialogProperties
import com.example.projektpaim.ui.theme.ProjektPAIMTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ProjektPAIMTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0F1C3F) // Główne tło aplikacji
                ) {
                    BakingScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BakingScreen() {
    var showLoginDialog by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isUserLoggedIn by remember { mutableStateOf(false) }
    var loginErrorMessage by remember { mutableStateOf<String?>(null) }

    var showToolsDialog by remember { mutableStateOf(false) }

    var showInfoDialog by remember { mutableStateOf(false) }
    var infoDialogTitle by remember { mutableStateOf("") }
    var infoDialogText by remember { mutableStateOf("") }

    // Stan dla dialogu Network Scanner (Services)
    var showNetworkScannerDialog by remember { mutableStateOf(false) }
    val scannerOptions = remember {
        listOf(
            "SSH" to mutableStateOf(false),
            "HTTP" to mutableStateOf(false),
            "SMTP" to mutableStateOf(false),
            "FTP" to mutableStateOf(false),
            "Telnet" to mutableStateOf(false),
            "HTTPS" to mutableStateOf(false),
            "SMB" to mutableStateOf(false),
            "DNS" to mutableStateOf(false)
        )
    }
    var enableSnort by remember { mutableStateOf(false) } // Stan dla checkboxa Snorta

    var dropdownExpanded by remember { mutableStateOf(false) }
    val dropdownOptions = listOf("TCP Scan", "Stealth scan", "UDP Scan")
    var selectedDropdownOption by remember { mutableStateOf(dropdownOptions[0]) }

    // Usunięte stany, bo nie będą już potrzebne
    // var showScanTypeSelectionDialog by remember { mutableStateOf(false) }
    // var showNmapScanDialog by remember { mutableStateOf(false) }
    // var showSnortScanDialog by remember { mutableStateOf(false) }

    val darkBlueBackground = Color(0xFF0F1C3F)
    val lightBlueText = Color(0xFF64B5F6)
    val whiteText = Color.White
    val greenButtonColor = Color(0xFF4CAF50)

    Box(modifier = Modifier.fillMaxSize()) {
        Button(
            onClick = { showToolsDialog = true },
            colors = ButtonDefaults.buttonColors(containerColor = Color.Black, contentColor = whiteText),
            modifier = Modifier.align(Alignment.TopStart).padding(16.dp)
        ) { Text("Tools") }

        Button(
            onClick = {
                if (!isUserLoggedIn) {
                    email = ""
                    password = ""
                    loginErrorMessage = null
                    showLoginDialog = true
                } else {
                    isUserLoggedIn = false
                    // Opcjonalnie: można dodać jakąś logikę przy wylogowywaniu, np. resetowanie stanów
                    println("Użytkownik wylogowany")
                }
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isUserLoggedIn) greenButtonColor else Color.Black,
                contentColor = whiteText
            ),
            modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)
        ) { Text(if (isUserLoggedIn) "Zalogowano" else "Zaloguj") }

        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Welcome to Port-Scan Edu",
                color = lightBlueText,
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 24.dp)
            )
            Button(
                onClick = {
                    if (isUserLoggedIn) {
                        // Resetowanie stanów dla dialogu Network Scanner przed jego pokazaniem
                        scannerOptions.forEach { it.second.value = false }
                        enableSnort = false
                        selectedDropdownOption = dropdownOptions[0]
                        dropdownExpanded = false // Upewnij się, że dropdown jest zwinięty

                        showNetworkScannerDialog = true // <<< ZMIANA: Bezpośrednie pokazanie dialogu Network Scanner
                    } else {
                        email = ""
                        password = ""
                        loginErrorMessage = null
                        showLoginDialog = true
                        println("Użytkownik nie jest zalogowany. Przekierowanie do logowania.")
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color.Black, contentColor = whiteText),
                modifier = Modifier.size(width = 200.dp, height = 60.dp)
            ) { Text("Start Scanning", style = MaterialTheme.typography.titleMedium) }
        }
    }

    if (showLoginDialog) {
        AlertDialog(
            onDismissRequest = {
                showLoginDialog = false
                loginErrorMessage = null // Resetuj komunikat błędu przy zamykaniu
            },
            title = { Text("Logowanie") },
            text = {
                Column {
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it; loginErrorMessage = null }, // Resetuj błąd przy zmianie
                        label = { Text("Email") },
                        isError = loginErrorMessage != null
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it; loginErrorMessage = null }, // Resetuj błąd przy zmianie
                        label = { Text("Hasło") },
                        visualTransformation = PasswordVisualTransformation(),
                        isError = loginErrorMessage != null
                    )
                    loginErrorMessage?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    val correctEmail = "test@example.com" // Przykładowe dane logowania
                    val correctPassword = "password"
                    if (email == correctEmail && password == correctPassword) {
                        isUserLoggedIn = true
                        loginErrorMessage = null
                        println("Logowanie udane: Email: $email")
                        showLoginDialog = false
                    } else {
                        isUserLoggedIn = false
                        loginErrorMessage = "Invalid email/password"
                        println("Logowanie nieudane: Niepoprawny email lub hasło.")
                    }
                }) { Text("Zaloguj") }
            },
            dismissButton = {
                Button(onClick = {
                    showLoginDialog = false
                    loginErrorMessage = null // Resetuj komunikat błędu przy anulowaniu
                }) { Text("Anuluj") }
            }
        )
    }

    if (showToolsDialog) {
        AlertDialog(
            onDismissRequest = { showToolsDialog = false },
            title = { Text("Wybierz narzędzie") },
            text = {
                Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Button(
                        onClick = {
                            infoDialogTitle = "Nmap"
                            infoDialogText = "Nmap (Network Mapper) is a free and open-source utility for network discovery and security auditing. It uses raw IP packets in novel ways to determine what hosts are available on the network, what services (application name and version) those hosts are offering, what operating systems (and OS versions) they are running, what type of packet filters/firewalls are in use, and dozens of other characteristics. (Pełny opis byłby dłuższy)"
                            showInfoDialog = true
                            showToolsDialog = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray, contentColor = Color.Black), // Zmieniono contentColor dla lepszego kontrastu
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
                    ) { Text("Nmap") }
                    Button(
                        onClick = {
                            infoDialogTitle = "Snort"
                            infoDialogText = "Snort is an open-source network intrusion detection system (NIDS) and network intrusion prevention system (NIPS) capable of performing real-time traffic analysis and packet logging on IP networks. It can perform protocol analysis, content searching/matching, and can be used to detect a variety of attacks and probes, such as buffer overflows, stealth port scans, CGI attacks, SMB probes, OS fingerprinting attempts, and much more. (Pełny opis byłby dłuższy)"
                            showInfoDialog = true
                            showToolsDialog = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray, contentColor = Color.Black), // Zmieniono contentColor
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
                    ) { Text("Snort") }
                }
            },
            dismissButton = { TextButton(onClick = { showToolsDialog = false }) { Text("Anuluj") } },
            confirmButton = { /* Celowo puste, bo akcje są w przyciskach wewnątrz */ }
        )
    }

    if (showInfoDialog) {
        AlertDialog(
            onDismissRequest = { showInfoDialog = false },
            properties = DialogProperties(usePlatformDefaultWidth = false), // Umożliwia niestandardową szerokość
            modifier = Modifier.padding(16.dp).clip(RoundedCornerShape(12.dp)).background(darkBlueBackground), // Zaokrąglone rogi i tło
            title = { Text(text = infoDialogTitle, color = whiteText) },
            text = { Text(text = infoDialogText, color = whiteText) },
            confirmButton = {
                Button(
                    onClick = { showInfoDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Black, contentColor = whiteText)
                ) { Text("OK") }
            }
        )
    }

    // Usunięty blok if (showScanTypeSelectionDialog) { ... }

    // Usunięty blok if (showNmapScanDialog) { ... }

    // Usunięty blok if (showSnortScanDialog) { ... }

    // Dialog Network Scanner & Options (dawniej "Services")
    if (showNetworkScannerDialog) {
        AlertDialog(
            onDismissRequest = { showNetworkScannerDialog = false },
            title = { Text("Network Scanner & Options") },
            text = {
                Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 8.dp)) {
                    scannerOptions.forEach { (optionText, isCheckedState) ->
                        Row(
                            modifier = Modifier.fillMaxWidth().clickable { isCheckedState.value = !isCheckedState.value }.padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(checked = isCheckedState.value, onCheckedChange = { isCheckedState.value = it })
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(optionText, style = MaterialTheme.typography.bodyLarge)
                        }
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), thickness = 1.dp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))

                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { enableSnort = !enableSnort }.padding(vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(checked = enableSnort, onCheckedChange = { enableSnort = it })
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Enable Snort (IDS/IPS)", style = MaterialTheme.typography.bodyLarge)
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), thickness = 1.dp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))

                    Text(
                        text = "Tryb Skanowania:",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                    )
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { dropdownExpanded = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(selectedDropdownOption, style = MaterialTheme.typography.bodyLarge)
                            Spacer(Modifier.weight(1f))
                            Icon(Icons.Filled.ArrowDropDown, "Rozwiń opcje")
                        }
                        DropdownMenu(
                            expanded = dropdownExpanded,
                            onDismissRequest = { dropdownExpanded = false },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            dropdownOptions.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option, style = MaterialTheme.typography.bodyLarge) },
                                    onClick = {
                                        selectedDropdownOption = option
                                        dropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
            },
            confirmButton = {
                Button(onClick = {
                    val selectedServices = scannerOptions.filter { it.second.value }.map { it.first }
                    println("Start Scanning (Services): $selectedServices, Snort: $enableSnort, Tryb: $selectedDropdownOption")
                    // Tutaj w przyszłości będzie logika rozpoczynania skanowania
                    showNetworkScannerDialog = false
                }) { Text("Start Scanning") }
            },
            dismissButton = {
                Button(onClick = { showNetworkScannerDialog = false }) { Text("Anuluj") }
            }
        )
    }
}

@Preview(showBackground = true, widthDp = 380, heightDp = 700)
@Composable
fun PreviewBakingScreen() {
    ProjektPAIMTheme {
        Surface(color = Color(0xFF0F1C3F)) {
            // Aby lepiej przetestować dialog, można go od razu pokazać w Preview
            var showDialogForPreview by remember { mutableStateOf(true) } // Domyślnie true, aby widzieć dialog
            var enableSnortPreview by remember { mutableStateOf(false) }
            var dropdownExpandedPreview by remember { mutableStateOf(false) }
            val dropdownOptionsPreview = listOf("Szybkie skanowanie", "Pełne skanowanie", "Skanowanie niestandardowe")
            var selectedDropdownOptionPreview by remember { mutableStateOf(dropdownOptionsPreview[0]) }
            val scannerOptionsPreview = remember {
                listOf(
                    "SSH" to mutableStateOf(true), "HTTP" to mutableStateOf(false), "SMTP" to mutableStateOf(true),
                    "FTP" to mutableStateOf(false), "Telnet" to mutableStateOf(true), "HTTPS" to mutableStateOf(false),
                    "SMB" to mutableStateOf(true), "DNS" to mutableStateOf(false)
                )
            }

            if (showDialogForPreview) { // Ten if/else w Preview jest dobry do testowania samego dialogu
                AlertDialog(
                    onDismissRequest = { showDialogForPreview = false },
                    title = { Text("Network Scanner & Options (Preview)") },
                    text = {
                        Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 8.dp)) {
                            scannerOptionsPreview.forEach { (optionText, isCheckedState) ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().clickable { isCheckedState.value = !isCheckedState.value }.padding(vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Checkbox(checked = isCheckedState.value, onCheckedChange = { isCheckedState.value = it })
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(optionText, style = MaterialTheme.typography.bodyLarge)
                                }
                            }
                            HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), thickness = 1.dp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
                            Row(
                                modifier = Modifier.fillMaxWidth().clickable { enableSnortPreview = !enableSnortPreview }.padding(vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(checked = enableSnortPreview, onCheckedChange = { enableSnortPreview = it })
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Enable Snort (IDS/IPS)", style = MaterialTheme.typography.bodyLarge)
                            }
                            HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), thickness = 1.dp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
                            Text(
                                text = "Tryb Skanowania:",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                            )
                            Box(modifier = Modifier.fillMaxWidth()) {
                                OutlinedButton(
                                    onClick = { dropdownExpandedPreview = true },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(selectedDropdownOptionPreview, style = MaterialTheme.typography.bodyLarge)
                                    Spacer(Modifier.weight(1f))
                                    Icon(Icons.Filled.ArrowDropDown, "Rozwiń opcje")
                                }
                                DropdownMenu(
                                    expanded = dropdownExpandedPreview,
                                    onDismissRequest = { dropdownExpandedPreview = false },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    dropdownOptionsPreview.forEach { option ->
                                        DropdownMenuItem(
                                            text = { Text(option, style = MaterialTheme.typography.bodyLarge) },
                                            onClick = { selectedDropdownOptionPreview = option; dropdownExpandedPreview = false }
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    },
                    confirmButton = { Button(onClick = { showDialogForPreview = false }) { Text("Start Scanning") } },
                    dismissButton = { Button(onClick = { showDialogForPreview = false }) { Text("Anuluj") } }
                )
            } else {
                BakingScreen() // Pokaż normalny ekran, jeśli dialog jest zamknięty w Preview
            }
        }
    }
}