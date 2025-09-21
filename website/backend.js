const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests from your front-end
app.use(express.json()); // Enable JSON body parsing

// Database connection pool with the provided credentials
const pool = mysql.createPool({
    connectionLimit: 1000,
    host: "178.128.89.255",
    user: "u1_ZfCh6UhhTr",
    password: "QdBHcX@5vyL1.9Om+sHUmD^F",
    database: "s1_private"
});

// Test the database connection when the server starts
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Koneksi database berhasil!');
        connection.release(); // Release the connection
    } catch (error) {
        console.error('Koneksi database GAGAL! Periksa kembali kredensial Anda.');
        console.error('Detail kesalahan:', error.message);
    }
}
testDbConnection();

// Endpoint untuk registrasi UCP
// Perhatian: Ganti req.ip dengan data dari body (misalnya, Discord ID)
app.post('/api/register', async (req, res) => {
    // Diasumsikan front-end akan mengirimkan `ucp`, `password`, dan `discordID`
    const { ucp, password, discordID } = req.body; 

    if (!ucp || !password || !discordID) {
        return res.status(400).json({ message: "Semua bidang (ucp, password, discordID) harus diisi." });
    }

    try {
        // Periksa apakah Discord ID sudah terdaftar
        const [rows] = await pool.query('SELECT * FROM playerucp WHERE discordID = ?', [discordID]);

        if (rows.length > 0) {
            return res.status(409).json({ message: 'Akun dengan Discord ID ini sudah terdaftar.' });
        }

        // Catatan: Ini hanyalah contoh. Untuk keamanan, Anda harus
        // menggunakan library seperti `bcrypt` untuk hash password dan salt.
        // Di sini kita langsung memasukkan password.
        const salt = null; // Contoh: `bcrypt.genSaltSync(10)`
        const hashedPassword = password; // Contoh: `bcrypt.hashSync(password, salt)`
        const verifycode = null;
        const extra = null;
        const reedeem = null;

        // Insert pengguna baru ke database
        // Kolom `ID` harusnya auto-increment, jadi tidak perlu disertakan
        await pool.query(
            'INSERT INTO playerucp (ucp, verifycode, discordID, password, salt, extradc, reedeem) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [ucp, verifycode, discordID, hashedPassword, salt, extra, reedeem]
        );
        
        res.status(201).json({ message: 'Pendaftaran berhasil!' });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
});

// Endpoint untuk melihat detail UCP
app.get('/api/view', async (req, res) => {
    // Diasumsikan front-end akan mengirimkan `discordID`
    const { discordID } = req.query; // Menggunakan query string untuk GET request

    if (!discordID) {
        return res.status(400).json({ message: 'Discord ID harus diberikan.' });
    }

    try {
        const [rows] = await pool.query('SELECT ucp, discordID FROM playerucp WHERE discordID = ?', [discordID]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Akun tidak ditemukan.' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
});

// Endpoint untuk menghapus UCP
app.delete('/api/delete', async (req, res) => {
    // Diasumsikan front-end akan mengirimkan `discordID`
    const { discordID } = req.body;

    if (!discordID) {
        return res.status(400).json({ message: 'Discord ID harus diberikan.' });
    }

    try {
        const [result] = await pool.query('DELETE FROM playerucp WHERE discordID = ?', [discordID]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tidak ada akun yang ditemukan untuk dihapus.' });
        }
        
        res.status(200).json({ message: 'Akun berhasil dihapus.' });

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log('Pastikan MySQL server Anda berjalan dan database terhubung.');
});
