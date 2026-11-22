# Triển khai VNPT Heart lên máy chủ

Bộ chạy gồm 3 container (Docker Compose):

| Container | Vai trò |
|---|---|
| `db` | PostgreSQL 16 — dữ liệu người chơi, tiến độ, nội dung level |
| `api` | Node.js (thư mục `server/`) — đăng nhập, chấm điểm, BXH, API trang quản trị |
| `web` | Caddy — phục vụ game (`/`) và trang quản trị (`/admin.html`), chuyển `/api` sang `api`, ảnh tải lên `/uploads`, tự cấp HTTPS khi có tên miền |

## 1. Cài lần đầu trên Ubuntu (22.04 / 24.04)

```bash
# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker

# Tường lửa: SSH + web
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable

# Mã nguồn
sudo mkdir -p /opt/vnpt-heart && sudo chown $USER /opt/vnpt-heart
git clone https://github.com/namnt877431/vnpt-heart.git /opt/vnpt-heart
cd /opt/vnpt-heart

# Cấu hình
cp deploy/.env.example deploy/.env
nano deploy/.env        # đặt POSTGRES_PASSWORD (openssl rand -base64 24), SITE_ADDRESS, AUTH_PROVIDER…

# Build + chạy
docker compose -f deploy/docker-compose.yml up -d --build

# Nạp dữ liệu ban đầu (6 chặng mẫu, nhóm, huy hiệu, mùa; + tài khoản test nếu AUTH_PROVIDER=dev)
docker compose -f deploy/docker-compose.yml run --rm api node dist/db/seed-cli.js
```

Mở `http://<IP máy chủ>/` (game) và `http://<IP máy chủ>/admin.html` (quản trị).
Với `AUTH_PROVIDER=dev`: tài khoản `admin`, `btc`, `lan`, `dung`… mật khẩu `vnpt@123` — **chỉ dùng cho demo**.

### Tên miền + HTTPS

Trỏ bản ghi DNS (A) của tên miền về IP máy chủ, rồi trong `deploy/.env`:

```
SITE_ADDRESS=game.vnptdaklak.vn
COOKIE_SECURE=true
```

`docker compose -f deploy/docker-compose.yml up -d` — Caddy tự xin và gia hạn chứng chỉ Let's Encrypt
(cần cổng 80/443 mở ra Internet). Mạng nội bộ không ra Internet: dùng chứng chỉ của đơn vị (hỏi CNTT).

### Chuyển sang đăng nhập LDAP/AD

Khi CNTT cung cấp thông số, sửa `deploy/.env`:

```
AUTH_PROVIDER=ldap
LDAP_URL=ldaps://…:636
LDAP_BASE_DN=…
LDAP_BIND_DN=…          # tài khoản dịch vụ chỉ cần quyền đọc
LDAP_BIND_PASSWORD=…
LDAP_USER_ATTR=sAMAccountName   # hoặc uid / mail
ADMIN_USERNAMES=namnt.dlc       # ai được quyền quản trị khi đăng nhập
```

rồi `docker compose -f deploy/docker-compose.yml up -d`. Máy chủ phải kết nối được tới LDAP
(thử: `nc -vz <ldap-host> 636`). Tài khoản dev không còn đăng nhập được khi đã chuyển sang `ldap`.

## 2. Cập nhật phiên bản mới

```bash
cd /opt/vnpt-heart
git pull
docker compose -f deploy/docker-compose.yml up -d --build
```

Migration CSDL chạy tự động khi `api` khởi động. Nội dung BTC đã soạn trong trang quản trị nằm trong
CSDL, không bị ghi đè khi cập nhật (seed chỉ thêm, không sửa dữ liệu có sẵn).

## 3. Sao lưu & khôi phục

```bash
chmod +x deploy/backup.sh
deploy/backup.sh                       # tạo deploy/backups/db-*.dump và uploads-*.tgz, giữ 14 ngày
crontab -e                             # chạy hằng ngày lúc 2:30
30 2 * * * /opt/vnpt-heart/deploy/backup.sh >> /var/log/vnpt-heart-backup.log 2>&1
```

Nên chép thư mục `deploy/backups/` sang máy khác/ổ lưu trữ của đơn vị.

Khôi phục CSDL từ một bản dump:

```bash
docker compose -f deploy/docker-compose.yml exec -T db pg_restore -U vnpt_heart -d vnpt_heart --clean --if-exists < deploy/backups/db-YYYYMMDD-HHMMSS.dump
```

## 4. Vận hành hằng ngày

```bash
docker compose -f deploy/docker-compose.yml ps                 # trạng thái
docker compose -f deploy/docker-compose.yml logs -f api        # log API
docker compose -f deploy/docker-compose.yml restart api        # khởi động lại API
docker compose -f deploy/docker-compose.yml exec db psql -U vnpt_heart vnpt_heart   # vào CSDL
```

## 5. Chạy trên Windows Server (không dùng Docker)

Mã nguồn không đổi, chỉ khác cách cài:

1. Cài **Node.js 22 LTS** và **PostgreSQL 16** (bản Windows). Tạo database `vnpt_heart` + user.
2. Build:
   ```powershell
   cd client; npm ci; npm run build:api        # -> client\dist (game + admin)
   cd ..\server; npm ci; npm run build         # -> server\dist
   ```
3. `server\.env` (xem `server\.env.example`): `DATABASE_URL=postgres://…@localhost:5432/vnpt_heart`,
   `UPLOAD_DIR=D:\vnpt-heart\uploads`, `AUTH_PROVIDER`, `LDAP_*`…
   - Cách đơn giản nhất: thêm `CLIENT_DIST=..\client\dist` — Node phục vụ luôn game, admin và `/uploads`
     trên một cổng (mặc định 3000).
4. Chạy Node như dịch vụ Windows: **PM2** (`npm i -g pm2 pm2-windows-startup`, `pm2 start dist/index.js --name vnpt-heart`)
   hoặc **NSSM** (`nssm install vnpt-heart "C:\Program Files\nodejs\node.exe" dist\index.js`, thư mục làm việc `server\`).
5. **IIS** làm cổng ngoài (HTTPS bằng chứng chỉ của đơn vị): cài *URL Rewrite* + *Application Request Routing*,
   bật proxy, thêm rule chuyển mọi request về `http://localhost:3000`. Không dùng `iisnode` (đã ngừng phát triển).
6. Seed lần đầu: `node dist\db\seed-cli.js` trong `server\`. Sao lưu: `pg_dump -Fc` theo lịch Task Scheduler.

## Lưu ý bảo mật

- Không commit `deploy/.env`, `server/.env` (đã có trong `.gitignore`).
- Repo hiện **công khai**: nên chuyển sang private trước khi chạy thật với SSO và dữ liệu nhân viên.
- `AUTH_PROVIDER=dev` chỉ dùng cho demo; tắt trước khi mời nhân viên thật.
- Chỉ mở cổng 22/80/443; PostgreSQL không mở ra ngoài (chỉ trong mạng Docker).
