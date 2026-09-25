import {
  PhBell,
  PhBrain,
  PhBug,
  PhBuildings,
  PhChartLine,
  PhClipboardText,
  PhClockCounterClockwise,
  PhCloud,
  PhCloudSlash,
  PhCpu,
  PhDrop,
  PhEye,
  PhFan,
  PhGauge,
  PhHandshake,
  PhLightning,
  PhPlant,
  PhRuler,
  PhShieldCheck,
  PhSun,
  PhThermometer,
  PhUser,
  PhUsersThree,
  PhWarehouse,
  PhWifiHigh,
  PhWind,
  PhWrench,
  PhBatteryHigh,
  PhBroadcast,
  PhToggleRight,
  PhBank,
  PhStorefront,
} from "@phosphor-icons/vue";
import type { Component } from "vue";
import type { ModalContent } from "../composables/useModal";

export const CONTACT_EMAIL = "synvorateknologiindonesia@gmail.com";

export const navLinks = [
  { label: "Masalah", href: "#masalah" },
  { label: "Solusi", href: "#solusi" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Teknologi", href: "#teknologi" },
  { label: "Roadmap", href: "#roadmap" },
];

export const contextStats = [
  { value: "±405", unit: "Ha", label: "Luas wilayah Lenteng Timur" },
  { value: "±7.315", unit: "jiwa", label: "Jumlah penduduk" },
  { value: "Mayoritas", unit: "", label: "Masyarakat bekerja sebagai petani" },
  { value: "5", unit: "lapisan", label: "Arsitektur sistem terintegrasi" },
];

export const problems = [
  { icon: PhDrop, title: "Kelembapan tinggi", text: "Meningkatkan risiko jamur dan penurunan mutu komoditas." },
  { icon: PhThermometer, title: "Suhu tak terkendali", text: "Mempercepat kerusakan pada komoditas tertentu." },
  { icon: PhWind, title: "Sirkulasi udara buruk", text: "Mikroklimat ruang simpan menjadi tidak merata." },
  { icon: PhBug, title: "Serangan hama", text: "Hama dapat masuk dan merusak hasil panen." },
  { icon: PhEye, title: "Pemeriksaan manual", text: "Tidak memberikan data yang kontinu dan terukur." },
  { icon: PhClipboardText, title: "Tanpa histori", text: "Evaluasi penyimpanan sulit dilakukan secara objektif." },
];

export const paradigm = [
  { from: "Ruang simpan pasif", to: "Ruang simpan dengan sensor" },
  { from: "Pengecekan manual", to: "Monitoring kontinu" },
  { from: "Masalah diketahui setelah terlihat", to: "Peringatan dini berbasis kondisi" },
  { from: "Ventilasi manual", to: "Ventilasi otomatis / semiotomatis" },
  { from: "Tidak ada histori terstruktur", to: "Histori time-series" },
  { from: "Bergantung jaringan listrik", to: "Energi surya + baterai" },
  { from: "Sulit melihat kapasitas", to: "Level penyimpanan terpantau" },
];

export const features: (Omit<ModalContent, "title" | "icon"> & { icon: Component; title: string; text: string })[] = [
  {
    icon: PhGauge,
    title: "Monitoring real-time",
    text: "Suhu, kelembapan, kualitas udara, dan level isi bunker tampil langsung di dashboard web & mobile.",
    intro: "Dashboard utama merangkum kondisi seluruh bunker dalam satu layar, sehingga operator tidak perlu lagi mengecek gudang satu per satu.",
    list: ["Ringkasan seluruh bunker", "Status online / offline", "Suhu dan kelembapan", "Kualitas udara", "Level penyimpanan", "Status ventilasi", "Status energi", "Alarm aktif", "Grafik histori", "Timeline event"],
  },
  {
    icon: PhBell,
    title: "Peringatan dini",
    text: "Alarm bertingkat Info, Warning, dan Critical dengan debounce agar tidak membanjiri notifikasi.",
    intro: "Sistem alert dirancang agar tidak berlebihan: memakai debounce, durasi kondisi, severity, acknowledgement, dan eskalasi.",
    table: {
      head: ["Severity", "Makna", "Contoh"],
      rows: [
        ["Info", "Informasi", "Kipas diaktifkan otomatis"],
        ["Warning", "Perlu perhatian", "Kelembapan meningkat"],
        ["Critical", "Perlu tindakan", "Kondisi kritis atau perangkat penting gagal"],
      ],
    },
  },
  {
    icon: PhFan,
    title: "Ventilasi otomatis",
    text: "Rule engine menyalakan kipas saat kondisi melewati batas, atau dikendalikan manual sesuai hak akses.",
    intro: "Rule engine mengevaluasi setiap data sensor. Jika kondisi membutuhkan tindakan, relay menyalakan kipas. Kontrol manual tersedia sesuai hak akses dan tercatat di audit log.",
    list: ["Sensor membaca secara periodik", "Data dikirim ke server", "Rule dievaluasi", "Ventilasi dapat aktif otomatis", "Alarm dibuat bila kondisi bertahan", "Operator inspeksi bila diperlukan"],
    note: "Strategi duty cycle ventilasi menjadi faktor penting dalam efisiensi energi, karena kipas adalah beban terbesar sistem.",
  },
  {
    icon: PhChartLine,
    title: "Histori & analitik",
    text: "Data time-series untuk melihat pola harian, frekuensi alarm, dan evaluasi kualitas penyimpanan.",
    intro: "Histori adalah salah satu aset utama Agrivita. Data time-series dipakai untuk melihat pola harian, frekuensi alarm, durasi ventilasi, dan evaluasi operasional.",
    list: ["Rata-rata & rentang suhu", "Rata-rata & rentang kelembapan", "Durasi kondisi di luar batas", "Frekuensi dan durasi kipas", "Hubungan kapasitas dengan mikroklimat", "Deteksi sensor tidak normal", "Estimasi kebutuhan maintenance"],
    note: "Bila data historis sudah memadai, sistem dapat dikembangkan untuk memprediksi risiko, misalnya kelembapan yang akan melewati batas dalam beberapa jam.",
  },
  {
    icon: PhSun,
    title: "Energi surya",
    text: "Panel surya dan baterai menjaga sistem tetap hidup, lengkap dengan pemantauan status energi.",
    intro: "Pemanfaatan panel surya adalah karakter penting Agrivita, sehingga bunker tetap beroperasi meski jauh dari jaringan listrik yang stabil.",
    table: {
      head: ["Komponen", "Peran"],
      rows: [
        ["Solar panel", "Menghasilkan energi"],
        ["Charge controller", "Mengatur pengisian"],
        ["Battery", "Menyimpan energi"],
        ["DC load", "Menjalankan sensor / controller"],
        ["Inverter (opsional)", "Menyediakan AC bila diperlukan"],
        ["Energy monitoring", "Memantau tegangan, arus, dan baterai"],
      ],
    },
  },
  {
    icon: PhCloudSlash,
    title: "Offline-first",
    text: "Saat internet terputus, edge tetap membaca sensor dan menjalankan rule lokal, lalu sinkron saat pulih.",
    intro: "Fungsi dasar bunker tidak bergantung sepenuhnya pada cloud. Controller di lokasi tetap bekerja walau koneksi internet hilang.",
    list: ["Sensor tetap dibaca", "Rule lokal tetap berjalan", "Data disimpan sementara di edge", "Data tersinkron saat koneksi pulih"],
  },
];

export const ipo = [
  {
    step: "Input",
    icon: PhBroadcast,
    items: ["Suhu & kelembapan", "Indikasi kualitas udara", "Level isi bunker", "Status panel surya & baterai", "Identitas bunker, komoditas & batch"],
  },
  {
    step: "Process",
    icon: PhCpu,
    items: ["Validasi & timestamp data", "Kirim ke API & simpan", "Rule engine mengevaluasi", "Status normal / waspada / kritis", "Aktivasi aktuator bila perlu"],
  },
  {
    step: "Output",
    icon: PhChartLine,
    items: ["Dashboard real-time", "Grafik histori", "Notifikasi & timeline event", "Status ventilasi & energi", "Laporan penyimpanan"],
  },
];

export const layers = [
  { name: "Physical", role: "Tempat penyimpanan", example: "Bunker, rak, pintu, ventilasi", icon: PhWarehouse },
  { name: "Sensing", role: "Membaca kondisi", example: "DHT22, MQ-135, HC-SR04", icon: PhBroadcast },
  { name: "Edge / Control", role: "Pemrosesan lokal & kontrol", example: "Raspberry Pi, ESP32, relay", icon: PhCpu },
  { name: "Cloud / Application", role: "Data, histori, alarm, dashboard", example: "API, database, web/mobile", icon: PhCloud },
  { name: "Human / Operational", role: "Pengambilan keputusan", example: "Petani, operator, teknisi", icon: PhUsersThree },
];

export const hardware = [
  { name: "Raspberry Pi 4", fn: "Edge controller / gateway", note: "Komputer lokal untuk membaca, memproses, dan meneruskan data ke server.", events: ["Device Failure"], icon: PhCpu },
  { name: "ESP32", fn: "Node sensor / aktuator terdistribusi", note: "Opsional, dipakai bila sensor dan aktuator tersebar di beberapa titik bunker.", events: ["Device Failure"], icon: PhCpu },
  { name: "DHT22", fn: "Sensor suhu + kelembapan", note: "Sensor mikroklimat utama di dalam bunker.", events: ["Humidity High", "Temperature High"], icon: PhThermometer },
  { name: "MQ-135", fn: "Indikasi kualitas udara", note: "Perlu kalibrasi dan interpretasi hati-hati; dibaca sebagai pola, bukan angka mutlak.", events: ["Air Quality Alert"], icon: PhWind },
  { name: "HC-SR04", fn: "Estimasi level / ketinggian isi", note: "Mengukur jarak ke permukaan komoditas untuk mengestimasi isi bunker.", events: ["Capacity Warning"], icon: PhRuler },
  { name: "Relay", fn: "Interface aktuator", note: "Menghubungkan controller dengan kipas, lampu, atau perangkat lain.", events: ["Device Failure"], icon: PhToggleRight },
  { name: "Fan", fn: "Ventilasi, aktuator utama", note: "Dinyalakan rule engine atau operator untuk menjaga sirkulasi udara.", events: ["Humidity High", "Temperature High"], icon: PhFan },
  { name: "Panel surya", fn: "Sumber energi terbarukan", note: "Mengisi baterai melalui charge controller di siang hari.", events: ["Power Low"], icon: PhSun },
  { name: "Baterai", fn: "Cadangan saat input surya turun", note: "Menjaga sistem tetap berjalan saat malam atau cuaca mendung.", events: ["Power Low"], icon: PhBatteryHigh },
  { name: "Modem", fn: "Koneksi bunker ke server", note: "Jalur komunikasi ke cloud; bila putus, edge tetap bekerja offline.", events: ["Device Failure"], icon: PhWifiHigh },
];

export type Severity = "info" | "warning" | "critical";

export const events: { name: string; trigger: string; response: string; severity: Severity }[] = [
  { name: "Humidity High", trigger: "Kelembapan melewati threshold dalam durasi tertentu", response: "Warning + evaluasi ventilasi", severity: "warning" },
  { name: "Temperature High", trigger: "Suhu melewati threshold", response: "Warning/critical + ventilasi jika diizinkan", severity: "critical" },
  { name: "Air Quality Alert", trigger: "Pola sensor kualitas udara berubah", response: "Peringatan + inspeksi", severity: "warning" },
  { name: "Capacity Warning", trigger: "Level mendekati maksimum", response: "Peringatan kapasitas", severity: "info" },
  { name: "Device Failure", trigger: "Heartbeat sensor/aktuator hilang", response: "Peringatan maintenance", severity: "critical" },
  { name: "Power Low", trigger: "Baterai di bawah batas", response: "Peringatan energi", severity: "warning" },
];

export const intelligence = [
  { level: 1, name: "Monitoring", text: "Membaca dan menampilkan sensor" },
  { level: 2, name: "Alert", text: "Mendeteksi kondisi melewati threshold" },
  { level: 3, name: "Automation", text: "Mengaktifkan perangkat berdasarkan rule" },
  { level: 4, name: "Analytics", text: "Menganalisis histori dan pola" },
  { level: 5, name: "Predictive", text: "Memprediksi risiko kondisi tertentu" },
];

export const roles = [
  { icon: PhPlant, name: "Petani", text: "Melihat kondisi komoditas terkait dan menerima informasi penyimpanan." },
  { icon: PhWarehouse, name: "Operator Bunker", text: "Mengelola penyimpanan, alarm, dan aktivitas harian." },
  { icon: PhUsersThree, name: "Admin Kelompok Tani", text: "Mengelola bunker, pengguna, komoditas, dan laporan." },
  { icon: PhWrench, name: "Teknisi", text: "Maintenance sensor, aktuator, jaringan, dan energi." },
  { icon: PhBuildings, name: "Pengelola Desa / Institusi", text: "Melihat kondisi agregat dan laporan." },
];

export const models = [
  { icon: PhUsersThree, name: "Kelompok Tani", text: "Bunker dikelola bersama oleh anggota." },
  { icon: PhBuildings, name: "Desa", text: "Desa memfasilitasi infrastruktur dan operasional." },
  { icon: PhBank, name: "Koperasi", text: "Bunker menjadi fasilitas bagi anggota koperasi." },
  { icon: PhHandshake, name: "Kemitraan", text: "Institusi atau swasta mendukung perangkat dan operasional." },
  { icon: PhStorefront, name: "Service Model", text: "IoT dan dashboard dikelola sebagai layanan." },
];

export const roadmap = [
  { phase: 0, focus: "Studi kebutuhan", result: "Requirement & baseline" },
  { phase: 1, focus: "Prototype IoT", result: "Sensor + controller" },
  { phase: 2, focus: "Dashboard", result: "Monitoring real-time" },
  { phase: 3, focus: "Automation", result: "Relay + ventilasi" },
  { phase: 4, focus: "Cloud & history", result: "Database + histori" },
  { phase: 5, focus: "Operational pilot", result: "Bunker digunakan nyata" },
  { phase: 6, focus: "Multi-bunker", result: "Beberapa bunker terhubung" },
  { phase: 7, focus: "Analytics", result: "Laporan dan pola" },
  { phase: 8, focus: "Predictive intelligence", result: "Prediksi risiko" },
  { phase: 9, focus: "Regional platform", result: "Jaringan penyimpanan" },
];

export const methodology = [
  "Observasi",
  "Wawancara",
  "Desain",
  "Prototipe",
  "Pre-test",
  "Sosialisasi",
  "Pelatihan",
  "Implementasi",
  "Pendampingan",
  "Evaluasi",
];

export const security = [
  { icon: PhShieldCheck, text: "Identitas unik tiap perangkat & koneksi terenkripsi" },
  { icon: PhUser, text: "Autentikasi, otorisasi, dan kontrol berbasis peran" },
  { icon: PhClockCounterClockwise, text: "Audit log untuk kontrol manual & perubahan threshold" },
  { icon: PhLightning, text: "Data tertunda disinkronkan otomatis saat koneksi pulih" },
  { icon: PhBrain, text: "Kegagalan sensor dibedakan dari nilai ekstrem yang valid" },
];
