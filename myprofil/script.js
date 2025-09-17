document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            // Mengisi data dari JSON ke HTML
            document.getElementById('nama-lengkap').textContent = data.namaLengkap;
            document.getElementById('deskripsi-diri').textContent = data.deskripsiDiri;

            // Mengisi riwayat pendidikan
            const daftarPendidikan = document.getElementById('daftar-pendidikan');
            data.riwayatPendidikan.forEach(item => {
                const p = document.createElement('p');
                p.innerHTML = `<strong>${item.tingkat}</strong>: ${item.namaSekolah} (${item.tahun})`;
                daftarPendidikan.appendChild(p);
            });

            // Mengisi daftar hobi
            const daftarHobi = document.getElementById('daftar-hobi');
            data.minatHobi.forEach(hobi => {
                const li = document.createElement('li');
                li.textContent = hobi;
                daftarHobi.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching data:', error));

    // Menampilkan tahun saat ini di footer
    document.getElementById('tahun-sekarang').textContent = new Date().getFullYear();
});