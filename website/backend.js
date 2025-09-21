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

// Endpoint untuk registrasi UCP
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    const ipAddress = req.ip; // Get the user's IP address

    if (!username || !password || !email) {
        return res.status(400).json({ message: "Semua bidang harus diisi." });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM playerucp WHERE IP = ?', [ipAddress]);

        if (rows.length > 0) {
            // Check if an account already exists for this IP
            return res.status(409).json({ message: 'Perangkat ini sudah memiliki akun terdaftar.' });
        }

        // Insert the new user into the database
        await pool.query('INSERT INTO playerucp (username, password, email, IP) VALUES (?, ?, ?, ?)', [username, password, email, ipAddress]);
        
        res.status(201).json({ message: 'Pendaftaran berhasil!' });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
    }
});

// Endpoint untuk melihat detail UCP
app.get('/api/view', async (req, res) => {
    const ipAddress = req.ip;

    try {
        const [rows] = await pool.query('SELECT username, email FROM playerucp WHERE IP = ?', [ipAddress]);

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
    const ipAddress = req.ip;

    try {
        const [result] = await pool.query('DELETE FROM playerucp WHERE IP = ?', [ipAddress]);

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
