# Frontend Deployment Guide (Vercel)

## Bước 1: Tạo tài khoản Vercel

1. Vào [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Chọn **Continue with GitHub** (quan trọng - để auto connect)

---

## Bước 2: Import Project

1. Sau khi login, click **Add New...** → **Project**
2. Chọn **Import Git Repository**
3. Tìm repo `project-management` và click **Import**

---

## Bước 3: Configure Project

### Root Directory
```
client
```
*(Vì frontend nằm trong folder client)*

### Framework Preset
```
Vite
```

### Build Settings (thường tự detect)
| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

---

## Bước 4: Environment Variables

Click **Environment Variables** và thêm:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_BASEURL` | `https://api.yourdomain.com/api` | Production |

> ⚠️ Thay `api.yourdomain.com` bằng domain/IP backend thực tế của bạn

### Nếu chưa có domain:
```
VITE_BASEURL = http://YOUR_EC2_IP:3000/api
```

---

## Bước 5: Deploy

1. Click **Deploy**
2. Đợi 1-2 phút
3. Xong! Vercel sẽ cấp URL như: `your-project.vercel.app`

---

## Auto Deployment

Sau khi setup xong:

| Action | Result |
|--------|--------|
| Push to `main` | Auto deploy to Production |
| Push to other branch | Tạo Preview URL |
| Pull Request | Tạo Preview URL cho PR |

---

## Custom Domain (Optional)

### Bước 1: Thêm domain trong Vercel
1. Vào Project → **Settings** → **Domains**
2. Nhập domain: `app.yourdomain.com`
3. Click **Add**

### Bước 2: Cấu hình DNS
Thêm record trong DNS provider (Cloudflare, GoDaddy, etc.):

**Option A - CNAME (recommended):**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

**Option B - A Record:**
```
Type: A
Name: app
Value: 76.76.21.21
```

### Bước 3: Đợi DNS propagate (5-30 phút)

---

## Environment Variables cho các môi trường

### Production (main branch)
```
VITE_BASEURL = https://api.yourdomain.com/api
```

### Preview (other branches)
```
VITE_BASEURL = https://api-staging.yourdomain.com/api
```

Để set riêng cho từng môi trường:
1. **Settings** → **Environment Variables**
2. Chọn checkbox: `Production`, `Preview`, `Development`

---

## Troubleshooting

### Build Failed
```bash
# Check logs trong Vercel Dashboard
# Thường do:
1. Missing dependencies
2. TypeScript errors
3. Environment variables không set
```

### API không connect được
```bash
# Check CORS trong backend
# Thêm frontend URL vào allowed origins
```

### 404 on refresh
```bash
# Đã fix trong vercel.json với rewrites
# Nếu vẫn lỗi, check file vercel.json
```

---

## Vercel CLI (Optional)

### Install
```bash
npm i -g vercel
```

### Login
```bash
vercel login
```

### Deploy manual
```bash
cd client
vercel --prod
```

### Preview deploy
```bash
vercel
```

---

## Summary

```
1. vercel.com → Sign up with GitHub
2. Add New Project → Import repo
3. Root Directory: client
4. Add Environment Variable: VITE_BASEURL
5. Deploy!
6. (Optional) Add custom domain
```

**Done! Frontend sẽ auto deploy mỗi khi push code lên GitHub** 🚀
