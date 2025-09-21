<?php
// Ganti dengan detail koneksi database Anda
$dbHost = '178.128.89.255';
$dbUser = 'u1_ZfCh6UhhTr';
$dbPass = 'QdBHcX@5vyL1.9Om+sHUmD^F';
$dbName = 's1_private';

// Matikan semua laporan kesalahan PHP, tapi log ke file
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');

header('Content-Type: application/json');

// Menangani kesalahan PHP yang fatal atau tidak terduga
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null) {
        http_response_code(500); // Internal Server Error
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan internal server. Detail: ' . $error['message']
        ]);
    }
});

// Membuat koneksi ke database
$conn = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal: ' . $conn->connect_error
    ]);
    exit();
}

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

// Menggunakan IP Address sebagai deviceID
$deviceID = $_SERVER['REMOTE_ADDR'] ?? 'unknown_ip';

if ($method === 'POST') {
    if ($action === 'register') {
        $ucp = $data['ucp'] ?? null;
        $password = ''; 

        if (!$ucp) {
            echo json_encode(['success' => false, 'message' => 'Nama UCP tidak boleh kosong.']);
            exit();
        }

        // Periksa apakah IP Address (deviceID) sudah punya akun
        $stmt_device = $conn->prepare("SELECT * FROM playerucp WHERE deviceID = ?");
        $stmt_device->bind_param("s", $deviceID);
        $stmt_device->execute();
        $result_device = $stmt_device->get_result();
        if ($result_device->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'IP Address ini sudah punya akun.']);
            exit();
        }

        // Periksa apakah nama UCP sudah ada
        $stmt_ucp = $conn->prepare("SELECT * FROM playerucp WHERE ucp = ?");
        $stmt_ucp->bind_param("s", $ucp);
        $stmt_ucp->execute();
        $result_ucp = $stmt_ucp->get_result();
        if ($result_ucp->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'Nama UCP sudah digunakan.']);
            exit();
        }

        $verifyCode = mt_rand(10000000, 99999999);

        $stmt_insert = $conn->prepare("INSERT INTO playerucp (ucp, password, deviceID, verifycode) VALUES (?, ?, ?, ?)");
        $stmt_insert->bind_param("sssi", $ucp, $password, $deviceID, $verifyCode);
        
        if ($stmt_insert->execute()) {
            echo json_encode(['success' => true, 'message' => 'Pendaftaran berhasil!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal mendaftar: ' . $stmt_insert->error]);
        }

    } elseif ($action === 'delete') {
        $stmt_delete = $conn->prepare("DELETE FROM playerucp WHERE deviceID = ?");
        $stmt_delete->bind_param("s", $deviceID);

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

} elseif ($method === 'GET') {
    if ($action === 'get-account') {
        $stmt_get = $conn->prepare("SELECT ucp, verifycode, deviceID FROM playerucp WHERE deviceID = ?");
        $stmt_get->bind_param("s", $deviceID);
        $stmt_get->execute();
        $result_get = $stmt_get->get_result();

        if ($result_get->num_rows > 0) {
            $row = $result_get->fetch_assoc();
            // Perbaikan di sini: kirim juga deviceID
            echo json_encode(['success' => true, 'ucp' => $row['ucp'], 'verifycode' => $row['verifycode'], 'ip_address' => $row['deviceID']]);
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