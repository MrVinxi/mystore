<?php
// Ganti dengan detail koneksi database Anda
$dbHost = '178.128.89.255';
$dbUser = 'u1_ZfCh6UhhTr';
$dbPass = 'QdBHcX@5vyL1.9Om+sHUmD^F';
$dbName = 's1_private';

header('Content-Type: application/json');

// Membuat koneksi ke database
$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal: ' . $conn->connect_error]);
    exit();
}

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Memproses permintaan berdasarkan URL dan metode
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Endpoint Pendaftaran
    if (strpos($requestUri, 'register') !== false) {
        $ucp = $data['ucp'] ?? null;
        $deviceID = $data['deviceID'] ?? null;
        $password = ''; // Kata sandi otomatis kosong

        if (!$ucp || !$deviceID) {
            echo json_encode(['success' => false, 'message' => 'Data tidak lengkap.']);
            exit();
        }

        // Memeriksa apakah nama UCP sudah ada
        $stmt = $conn->prepare("SELECT * FROM playerucp WHERE ucp = ?");
        $stmt->bind_param("s", $ucp);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'Nama UCP sudah digunakan.']);
            exit();
        }

        // Memeriksa apakah perangkat sudah memiliki akun
        $stmt = $conn->prepare("SELECT * FROM playerucp WHERE deviceID = ?");
        $stmt->bind_param("s", $deviceID);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'Perangkat ini sudah memiliki akun.']);
            exit();
        }

        // Memasukkan data ke database
        $stmt = $conn->prepare("INSERT INTO playerucp (ucp, password, deviceID) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $ucp, $password, $deviceID);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Pendaftaran berhasil!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal mendaftar: ' . $stmt->error]);
        }
    }
    
    // Endpoint Hapus Akun
    if (strpos($requestUri, 'delete') !== false) {
        $deviceID = $data['deviceID'] ?? null;

        if (!$deviceID) {
            echo json_encode(['success' => false, 'message' => 'Data tidak lengkap.']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM playerucp WHERE deviceID = ?");
        $stmt->bind_param("s", $deviceID);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Akun berhasil dihapus.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Akun tidak ditemukan.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus akun: ' . $stmt->error]);
        }
    }

} elseif ($method === 'GET') {
    // Endpoint untuk Mendapatkan Akun
    if (strpos($requestUri, 'get-account') !== false) {
        $deviceID = $_GET['deviceID'] ?? null;

        if (!$deviceID) {
            echo json_encode(['success' => false, 'message' => 'Data tidak lengkap.']);
            exit();
        }

        $stmt = $conn->prepare("SELECT ucp FROM playerucp WHERE deviceID = ?");
        $stmt->bind_param("s", $deviceID);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo json_encode(['success' => true, 'ucp' => $row['ucp']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Akun tidak ditemukan.']);
        }
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Metode permintaan tidak valid.']);
}

$conn->close();
?>