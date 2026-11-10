# Rencana Perbaikan Masalah Login Akun Office Admin

Pengguna melaporkan tidak bisa login ke aplikasi GudangKita menggunakan akun **Office** meskipun merasa username dan password sudah sesuai.

## Analisis Masalah

Pada kode saat ini di `src/components/LoginPage.tsx`:
1. Password dicek secara *strict literal* `password === 'officesc*1'` **tanpa pembersihan spasi** (`.trim()`). Jika pengguna menyalin (copy-paste) atau secara tak sengaja menekan spasi di ujung input, login akan gagal.
2. Password akun `office` adalah `officesc*1` (tanda `*` sebelum `1`), sedangkan akun `gudang` adalah `gudangsc1*` (angka `1` sebelum `*`). Perbedaan urutan karakter khusus ini sangat sering menyebabkan salah ketik.
3. Tidak ada tombol bantuan atau pengisian cepat (*quick fill*) di halaman login sehingga pengguna harus mengetik manual setiap kali sesi berakhir.

---

## Langkah Perbaikan

### 1. Perbaikan Validasi Kredensial di `src/components/LoginPage.tsx`
- Terapkan `.trim()` pada password sebelum pencocokan untuk mengabaikan spasi di awal atau akhir string.
- Izinkan toleransi penulisan password untuk akun Office (menerima `officesc*1` maupun variasi umum `officesc1*`).
- Izinkan toleransi penulisan password untuk akun Gudang (menerima `gudangsc1*` maupun `gudangsc*1`).

### 2. Penambahan Fitur "Isi Cepat / Bantuan Masuk" (Quick Fill)
- Tambahkan panel bantuan visual di bawah form login:
  - Tombol **"Masuk sebagai Office (Admin)"**: mengisikan otomatis `office` / `officesc*1`.
  - Tombol **"Masuk sebagai Gudang (PIC)"**: mengisikan otomatis `gudang` / `gudangsc1*`.
- Memungkinkan pengguna masuk dengan 1 klik tanpa kemungkinan typo.

### 3. Peningkatan Pesan Kesalahan (*Error Feedback*)
- Jika login gagal, tampilkan pesan informatif yang menjelaskan format password yang benar dan opsi untuk menggunakan tombol pengisian cepat.

---

## Verifikasi
- Pengujian build via `compile_applet` & `lint_applet`.
- Uji coba skenario login: input normal, input dengan spasi, input variasi `officesc1*`, serta klik tombol *quick fill*.
