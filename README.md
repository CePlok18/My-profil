# Smart Loker Penyimpanan

Web dashboard smart loker berbasis **Next.js** dan **Supabase**.

## Fitur Awal

- Halaman login untuk akun admin dan user.
- Redirect role admin ke `/admin/dashboard`.
- Redirect role user ke `/user/dashboard`.
- Dashboard admin dengan 4 loker: Loker 1 sampai Loker 4.
- Setiap user hanya boleh memiliki akses ke 1 loker.
- Ringkasan status loker dan aktivitas terbaru.
- Struktur Supabase client dan admin client.
- Admin dapat membuat akun login user dari halaman `/admin/users`.
- Admin dapat menghapus akun user yang sudah terdaftar di loker.
- Endpoint server untuk membuat akun user: `/api/admin/users`.
- Schema SQL Supabase di `supabase-schema.sql`.

## Menjalankan Project

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Konfigurasi Supabase

1. Copy `.env.local.example` menjadi `.env.local`.
2. Isi nilai berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Buka Supabase SQL Editor.
4. Jalankan isi file `supabase-schema.sql`.
5. Buat akun admin di Supabase Auth.
6. Tambahkan profile admin ke tabel `profiles`:

```sql
insert into public.profiles (id, name, email, role, is_active)
values (
  'USER_ID_DARI_AUTH',
  'Admin',
  'admin@email.com',
  'admin',
  true
);
```

Jika tabel `locker_access` sudah dibuat sebelum aturan 1 user 1 loker ditambahkan,
jalankan juga file `supabase-migration-one-locker-per-user.sql`.

## Membuat Akun User dari Dashboard Admin

1. Login sebagai admin.
2. Buka menu **Data User** atau akses `/admin/users`.
3. Isi nama user, email login, password awal, dan pilih satu loker.
4. Klik **Buat Akun User**.
5. User dapat login memakai email dan password yang dibuat admin.

## Menghapus Akun User dari Loker

1. Login sebagai admin.
2. Buka `/admin/users`.
3. Lihat bagian **User Terdaftar di Loker**.
4. Klik **Hapus** pada user yang ingin dihapus.
5. Akun user di Supabase Auth ikut terhapus dan loker dikembalikan menjadi tersedia.

## Integrasi IoT ESP32 dengan MQTT

Jalankan migration berikut di Supabase SQL Editor:

```sql
-- isi file supabase-migration-locker-commands.sql
```

Jika ingin memakai RFID, jalankan juga:

```sql
-- isi file supabase-migration-rfid-support.sql
-- isi file supabase-migration-rfid-enrollment.sql
```

Alur command:

1. Admin atau user klik tombol **Buka** atau **Tutup** pada kartu loker.
2. Web membuat data baru di tabel `locker_commands`.
3. Web publish command ke MQTT topic loker.
4. ESP32 menerima command dari MQTT dan menggerakkan servo sesuai nomor loker.
5. LED loker yang dibuka berubah hijau, lalu kembali merah saat ditutup.
6. ESP32 publish status balik ke topic status.

Yang diperlukan:

- Broker MQTT, misalnya HiveMQ Cloud, EMQX Cloud, atau Mosquitto lokal.
- Host broker MQTT.
- Port broker, biasanya `8883` untuk TLS atau `1883` untuk lokal tanpa TLS.
- Username dan password MQTT jika broker memerlukan auth.
- Library Arduino:
  - `PubSubClient`
  - `ArduinoJson`
  - `ESP32Servo`
  - `Adafruit NeoPixel`

File contoh Arduino IDE tersedia di:

```text
iot/esp32-smart-loker-mqtt/esp32-smart-loker-mqtt.ino
```

Konfigurasi `.env.local` untuk web:

```env
MQTT_BROKER_URL=mqtts://broker-host:8883
MQTT_USERNAME=username
MQTT_PASSWORD=password
MQTT_TOPIC_PREFIX=smart-loker
```

Untuk Mosquitto lokal tanpa TLS:

```env
MQTT_BROKER_URL=mqtt://192.168.1.10:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_TOPIC_PREFIX=smart-loker
```

Sebelum upload ke ESP32, ubah bagian ini:

```cpp
const char* WIFI_SSID = "NAMA_WIFI";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";
const char* MQTT_HOST = "broker-host";
const int MQTT_PORT = 8883;
const char* MQTT_USERNAME = "username";
const char* MQTT_PASSWORD = "password";
const char* MQTT_TOPIC_PREFIX = "smart-loker";
```

Topic yang digunakan:

```text
smart-loker/command/loker-1
smart-loker/command/loker-2
smart-loker/command/loker-3
smart-loker/command/loker-4
smart-loker/status/loker-1
smart-loker/status/loker-2
smart-loker/status/loker-3
smart-loker/status/loker-4
```

## Catatan

UI tetap dapat dibuka tanpa kredensial Supabase, tetapi login asli baru berjalan setelah `.env.local` diisi.

## Integrasi RFID MFRC522

RFID dapat dipakai untuk membuka atau menutup loker berdasarkan UID kartu.
Admin dapat mendaftarkan kartu langsung dari halaman detail loker.

Alur RFID:

1. Admin buka detail loker, misalnya `Loker 2`.
2. Admin klik **Tambahkan Kartu** atau **Ganti Kartu**.
3. ESP32 membaca UID kartu RFID.
4. ESP32 mengirim UID ke `/api/iot/rfid-scan`.
5. Web memasangkan UID kartu ke loker yang sedang menunggu scan.
6. Setelah terdaftar, kartu dapat membuat command `open` atau `close`.
7. ESP32 mengambil command lewat polling `/api/iot/commands`, lalu menggerakkan servo.

Library Arduino tambahan:

- `MFRC522`

Pin contoh MFRC522 untuk file
`iot/esp32-smart-loker/esp32-smart-loker.ino`:

```text
SDA/SS  -> GPIO 5
RST     -> GPIO 22
SCK     -> GPIO 18
MISO    -> GPIO 19
MOSI    -> GPIO 21
3.3V    -> 3.3V
GND     -> GND
```
