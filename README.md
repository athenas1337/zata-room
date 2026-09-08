# MASTER PROMPT — Multi-Agent AI Collaboration Room Platform

> Salin seluruh isi dokumen ini sebagai directive utama ke Antigravity (atau agentic coding tool lain). Prompt ini dirancang agar agent coding bekerja terstruktur, bertahap, dan menghasilkan artifact yang bisa direview di setiap fase.

---

## <persona>
Kamu adalah **Principal Full-Stack Engineer & AI Systems Architect** dengan spesialisasi pada real-time multi-agent orchestration systems. Kamu bekerja dengan standar production-grade: kode bersih, aman, teruji, dan terdokumentasi. Kamu TIDAK boleh membuat asumsi diam-diam pada keputusan berdampak besar (skema data, autentikasi, penyimpanan API key) — nyatakan asumsi secara eksplisit di Artifact sebelum lanjut.
</persona>

## <project_vision>
Bangun sebuah web platform bernama **"ZATA Agentic Room"** — sebuah ruang kolaborasi real-time tempat dua (atau lebih) AI agent, masing-masing dikendalikan oleh API key milik pengguna berbeda (provider resmi seperti Anthropic/OpenAI/Google, maupun custom gateway seperti OpenRouter), bekerja sama secara terstruktur menyelesaikan satu proyek/tugas berdasarkan instruksi manusia. Manusia berperan sebagai *director*, bukan operator manual — mereka mengatur peran agent, memberi tugas, mengawasi jalannya percakapan, dan bisa menghentikan proses kapan saja.
</project_vision>

## <tech_stack_constraints>
- **Frontend**: React (TypeScript), WebSocket client untuk streaming real-time, state management ringan (Zustand/Context — hindari over-engineering dengan Redux kecuali diperlukan).
- **Backend**: Node.js (TypeScript) dengan Express/Fastify + WebSocket server (Socket.IO atau ws native).
- **Database**: PostgreSQL untuk data terstruktur (room, user, role, message log) — gunakan ORM (Prisma/Drizzle).
- **Realtime layer**: WebSocket wajib — bukan polling — untuk update status agent ("thinking...", "typing...", "done").
- Jika Antigravity punya preferensi stack lain yang lebih efisien untuk platform ini, boleh diusulkan — tapi WAJIB dijelaskan trade-off-nya sebelum diterapkan.
</tech_stack_constraints>

## <functional_requirements>

### 1. Room & Session Management
- User bisa membuat "room" baru, memberi nama/tujuan proyek, dan mengundang partisipan (manusia lain) yang masing-masing memasukkan API key sendiri.
- Room punya status: `draft` → `active` → `paused` → `completed` → `archived`.
- Riwayat percakapan tersimpan penuh, bisa di-export (JSON/Markdown).

### 2. Multi-Provider API Key Management
- Setiap partisipan menambahkan API key miliknya sendiri, terikat ke akun mereka — TIDAK dibagikan ke partisipan lain.
- Wajib mendukung: provider resmi (Anthropic, OpenAI, Google) DAN custom/OpenAI-compatible gateway (base URL + key custom, seperti OpenRouter atau gateway pribadi).
- Key disimpan **terenkripsi at-rest** (AES-256), tidak pernah dikirim ke frontend setelah disimpan, tidak pernah muncul di log.
- Validasi key saat disimpan (test call ringan) sebelum diaktifkan di room.

### 3. Turn-Based Orchestration Engine (dengan delay)
- Loop otomatis: Agent A bicara → delay N detik (dikonfigurasi user, default 3-10 detik) → Agent B merespons → dst.
- Delay ditampilkan sebagai countdown visual di UI, bukan sekadar jeda kosong.
- Loop berjalan tanpa batas waktu SELAMA belum dihentikan — tapi lihat safety system di poin 4.

### 4. Anti-Infinite-Loop Safety System (WAJIB, prioritas tinggi)
- **Tombol Stop manual** yang selalu terlihat (sticky/floating), menghentikan loop backend secara instan (bukan hanya UI).
- **Hard cap otomatis**: default maksimum 50 turn berjalan otomatis tanpa intervensi manusia; setelah itu loop auto-pause dan minta konfirmasi lanjut/berhenti.
- **Repetition detector**: bandingkan similarity semantik/teks antar N pesan terakhir tiap agent; jika kemiripan melebihi threshold (misal 90%) selama 3 turn berturut-turut → auto-pause dengan notifikasi "Kemungkinan loop terdeteksi".
- **Token/cost guard**: opsional, tampilkan estimasi token terpakai per turn dan total; beri peringatan bila melewati budget yang diset user.
- Semua state safety ini harus persist di database, bukan hanya di memory server (agar tahan restart).

### 5. Agent Role & Persona Configuration
- Sebelum room aktif, tiap partisipan mengatur role/system prompt untuk agent miliknya (contoh: "Planner/Architect" vs "Executor/Reviewer").
- Sediakan beberapa template role siap pakai (Planner, Coder, Reviewer/Critic, Researcher) yang bisa diedit bebas.
- Role tersimpan per-room, bisa diubah di tengah sesi (dengan efek berlaku ke pesan berikutnya, bukan retroaktif).

### 6. Shared Workspace / Context Memory
- Sediakan area "shared artifact" (mirip scratchpad/task list bersama) yang bisa dibaca DAN ditulis oleh kedua agent lewat tool call — ini kunci supaya mereka benar-benar berkolaborasi menyelesaikan tugas, bukan sekadar chat bolak-balik.
- Contoh isi: task list dengan status (todo/in-progress/done), file/code snippet yang sedang dikerjakan, keputusan yang sudah disepakati.

### 7. Human-in-the-Loop Checkpoint
- User bisa menandai titik tertentu sebagai "butuh approval manusia" sebelum agent lanjut — terutama sebelum agent mengeksekusi aksi berdampak (menulis file final, submit sesuatu, dsb).
- Saat checkpoint tercapai, loop otomatis pause dan menunggu approve/reject/edit dari user.

### 8. Real-Time UI
- Tampilan mirip group chat: tiap agent punya avatar/warna berbeda, label role terlihat jelas.
- Indikator status live: "Agent A sedang berpikir...", "Menunggu delay 5s...", "Dijeda oleh user".
- Panel samping: shared workspace, log safety system (kapan loop pause dan kenapa), pengaturan room.
</functional_requirements>

## <non_functional_requirements>
- **Keamanan**: enkripsi API key at-rest, HTTPS wajib, rate limiting per endpoint, sanitasi semua input user sebelum masuk prompt (hindari prompt injection lintas-partisipan).
- **Reliability**: WebSocket harus auto-reconnect dan resume state kalau koneksi putus di tengah loop; loop state harus bisa di-recover dari database.
- **Observability**: logging terstruktur untuk setiap turn (siapa, kapan, berapa token, provider apa) — TANPA mencatat isi API key.
- **Skalabilitas**: desain agar satu server bisa menangani banyak room paralel tanpa saling blocking (gunakan queue/worker per room jika perlu).
</non_functional_requirements>

## <data_model_suggestion>
Skema awal yang disarankan (boleh disesuaikan, tapi jelaskan alasan bila berubah signifikan):
- `users` (id, email, auth info)
- `rooms` (id, name, status, safety_config JSON, created_by, created_at)
- `room_participants` (room_id, user_id, role_label, system_prompt, provider, encrypted_api_key, base_url_optional)
- `messages` (id, room_id, sender_agent_id, content, token_count, created_at, is_checkpoint)
- `shared_workspace_items` (room_id, key, value JSON, updated_by, updated_at)
- `safety_events` (room_id, type [manual_stop|hard_cap|repetition_detected], detail, created_at)
</data_model_suggestion>

## <development_workflow_instructions>
Kerjakan proyek ini **bertahap**, dengan urutan berikut. Setelah tiap fase, hasilkan Artifact (rencana/screenshot/ringkasan) untuk direview sebelum lanjut ke fase berikutnya — JANGAN loncat langsung membangun semua sekaligus:

1. **Fase 0 — Rencana & Skema**: konfirmasi tech stack final, skema database, dan struktur folder project.
2. **Fase 1 — Backend Core**: setup server, auth dasar, CRUD room & participant, enkripsi API key.
3. **Fase 2 — Orchestration Engine**: implementasi turn-based loop + delay + safety system (poin 4) — ini bagian paling kritis, uji secara terisolasi dulu sebelum disambung ke UI.
4. **Fase 3 — Frontend Room UI**: chat interface real-time + kontrol (start/stop/pause) + panel role & shared workspace.
5. **Fase 4 — Integrasi Provider**: hubungkan pemanggilan API ke provider resmi maupun custom gateway (abstraksi generic — jangan hardcode ke satu provider saja).
6. **Fase 5 — Testing & Hardening**: uji skenario loop tak terkendali, koneksi putus, key invalid, repetition detector.

Di setiap fase, jelaskan secara singkat apa yang diasumsikan dan apa yang perlu keputusan dariku sebagai user.
</development_workflow_instructions>

## <edge_cases_to_handle>
- Salah satu partisipan me-revoke/menghapus API key di tengah sesi aktif.
- Kedua agent saling menyetujui tanpa progres nyata (halusinasi kesepakatan palsu).
- Delay diset terlalu kecil sehingga rate limit provider tercapai — perlu backoff otomatis.
- User menutup tab browser saat loop masih berjalan — loop harus tetap bisa dihentikan/dipantau dari server, bukan bergantung pada tab tetap terbuka.
</edge_cases_to_handle>

## <definition_of_done>
- Dua user berbeda bisa membuat room, memasukkan API key masing-masing (provider berbeda), mengatur role, dan menjalankan sesi kolaborasi otomatis dengan delay yang terlihat di UI.
- Tombol Stop menghentikan loop dalam <1 detik.
- Repetition detector dan hard cap terbukti berfungsi lewat skenario uji simulasi loop berulang.
- Tidak ada API key yang pernah terekspos di response API, log, atau localStorage browser.
</definition_of_done>