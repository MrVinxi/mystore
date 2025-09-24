<?php
// Ganti dengan detail koneksi database Anda
$dbHost = '178.128.89.255';
$dbUser = 'u1_ZfCh6UhhTr';
$dbPass = 'QdBHcX@5vyL1.9Om+sHUmD^F';
$dbName = 's1_private';
$discordBotToken = 'MTQxOTI3NjUwMDExNjQzOTEzMA.GwJ-Eu.jN9qOD31dpxvenEh6HNW6KITQbmS9NoEWPia28'; // ⚠️ GANTI INI DENGAN TOKEN BOT ANDA

// Matikan semua laporan kesalahan PHP, tapi log ke file
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');

header('Content-Type: application/json');

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan internal server. Detail: ' . $error['message']
        ]);
    }
});

$conn = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal: ' . $conn->connect_error
    ]);
    exit();
}

/**
 * Mengirim pesan langsung (DM) ke pengguna Discord.
 *
 * @param string $discordId Discord ID dari pengguna.
 * @param string $message Pesan yang akan dikirim.
 * @param string $token Token bot Discord Anda.
 * @return bool True jika berhasil, False jika gagal.
 */
function sendDiscordMessage($discordId, $message, $token) {
    $ch = curl_init();
    $url = "https://discord.com/api/v10/users/@me/channels";
    
    // Step 1: Buat DM Channel
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['recipient_id' => $discordId]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bot ' . $token,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($httpCode !== 200 && $httpCode !== 201) {
        error_log("Failed to create DM channel for Discord ID $discordId. HTTP Code: $httpCode. Response: " . $response);
        return false;
    }
    
    $channel = json_decode($response, true);
    $channelId = $channel['id'];
    
    // Step 2: Kirim pesan ke DM Channel
    $url = "https://discord.com/api/v10/channels/$channelId/messages";
    $payload = json_encode(['content' => $message]);
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bot ' . $token,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 && $httpCode !== 201) {
        error_log("Failed to send message to Discord ID $discordId. HTTP Code: $httpCode. Response: " . $response);
        return false;
    }
    
    return true;
}

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    if ($action === 'register') {
        $ucp = $data['ucp'] ?? null;
        $discordId = $data['DiscordID'] ?? null;
        $password = '';

        if (!$ucp || !$discordId) {
            echo json_encode(['success' => false, 'message' => 'Nama UCP dan Discord ID tidak boleh kosong.']);
            exit();
        }

        $stmt_discord = $conn->prepare("SELECT * FROM playerucp WHERE DiscordID = ?");
        $stmt_discord->bind_param("s", $discordId);
        $stmt_discord->execute();
        $result_discord = $stmt_discord->get_result();
        if ($result_discord->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'Discord ID ini sudah terdaftar.']);
            exit();
        }

        $stmt_ucp = $conn->prepare("SELECT * FROM playerucp WHERE ucp = ?");
        $stmt_ucp->bind_param("s", $ucp);
        $stmt_ucp->execute();
        $result_ucp = $stmt_ucp->get_result();
        if ($result_ucp->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'Nama UCP sudah digunakan.']);
            exit();
        }

        $otpCode = mt_rand(100000, 999999);
        $status = 'unverified';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        if (sendDiscordMessage($discordId, "Kode OTP verifikasi Anda Untuk Memasuki Kota Adalah: **$otpCode**", $discordBotToken)) {
            $status = 'verified';
            $stmt_insert = $conn->prepare("INSERT INTO playerucp (ucp, password, DiscordID, verifycode, status) VALUES (?, ?, ?, ?, ?)");
            $stmt_insert->bind_param("sssss", $ucp, $hashedPassword, $discordId, $otpCode, $status);
            
            if ($stmt_insert->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Pendaftaran berhasil. Silakan cek DM Discord Anda untuk kode verifikasi.'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Gagal mendaftar ke database: ' . $stmt_insert->error]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Pendaftaran gagal karena gagal mengirim kode verifikasi ke Discord. Pastikan Anda tidak memblokir DM dari bot.'
            ]);
        }
    }
    
    elseif ($action === 'delete') {
        $discordId = $data['DiscordID'] ?? null;
        if (!$discordId) {
            echo json_encode(['success' => false, 'message' => 'Discord ID tidak boleh kosong.']);
            exit();
        }

        $stmt_delete = $conn->prepare("DELETE FROM playerucp WHERE DiscordID = ?");
        $stmt_delete->bind_param("s", $discordId);

        if ($stmt_delete->execute()) {
            if ($stmt_delete->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Akun berhasil dihapus.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Akun tidak ditemukan.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus akun: ' . $stmt_delete->error]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Aksi POST tidak valid.']);
    }
}
elseif ($method === 'GET') {
    if ($action === 'get-account') {
        $discordId = $_GET['DiscordID'] ?? null;
        if (!$discordId) {
            echo json_encode(['success' => false, 'message' => 'Discord ID tidak boleh kosong.']);
            exit();
        }

        $stmt_get = $conn->prepare("SELECT ucp, verifycode, DiscordID FROM playerucp WHERE DiscordID = ?");
        $stmt_get->bind_param("s", $discordId);
        $stmt_get->execute();
        $result_get = $stmt_get->get_result();

        if ($result_get->num_rows > 0) {
            $row = $result_get->fetch_assoc();
            echo json_encode([
                'success' => true,
                'ucp' => $row['ucp'],
                'verifycode' => $row['verifycode'],
                'DiscordID' => $row['DiscordID']
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Akun tidak ditemukan.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Aksi GET tidak valid.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metode permintaan tidak diizinkan.']);
}

$conn->close();
?>