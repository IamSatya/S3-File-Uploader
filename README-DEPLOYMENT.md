# HackFiles - Deployment Package

This ZIP contains everything you need to deploy the HackFiles application on your own server.

## 📦 What's Inside

- **Application Code**: Full source code for frontend and backend
- **Deployment Files**: Docker, PM2, Nginx configurations
- **Helper Scripts**: Admin user creation, environment validation
- **Documentation**: Complete deployment guides

## 🚀 Quick Start

### 1. Extract the ZIP

```bash
unzip hackfiles-deployment.zip
cd hackfiles-deployment
```

### 2. Choose Your Deployment Method

**Option A: Traditional Server (Recommended)**
- Read `QUICKSTART.md` - Method 1
- Follow step-by-step server setup
- Uses PM2 for process management

**Option B: Docker**
- Read `QUICKSTART.md` - Method 2
- One-command deployment
- Includes PostgreSQL and Nginx

**Option C: Development/Testing**
- Read `QUICKSTART.md` - Method 3
- For local testing before production

### 3. Start Reading

1. **QUICKSTART.md** ← Start here!
2. **DEPLOYMENT.md** ← Full deployment guide
3. **.env.example** ← Required environment variables

## 📋 Prerequisites

Before deploying, you need:

1. **PostgreSQL Database**
   - Local installation OR
   - Managed service (Neon, Supabase, AWS RDS)

2. **AWS S3 Bucket**
   - For file storage
   - Access key and secret from IAM

3. **Server** (for non-Docker deployment)
   - Ubuntu/Debian VPS
   - Node.js 20+
   - At least 1GB RAM

## 🔧 Installation Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
nano .env  # Add your credentials

# 3. Build application
npm run build

# 4. Setup database
npm run db:push

# 5. Create admin user
tsx scripts/create-admin.js

# 6. Start application
# For PM2:
pm2 start ecosystem.config.js --env production

# For Docker:
docker-compose up -d
```

## 📁 File Structure

```
hackfiles-deployment/
├── client/              # Frontend React application
├── server/              # Backend Express server
├── shared/              # Shared types and schemas
├── scripts/             # Helper scripts
│   ├── create-admin.js     # Create admin user
│   └── check-env.js        # Validate environment
├── QUICKSTART.md        # Fast deployment guide
├── DEPLOYMENT.md        # Complete deployment guide
├── .env.example         # Environment template
├── ecosystem.config.js  # PM2 configuration
├── Dockerfile           # Docker image
├── docker-compose.yml   # Docker stack
├── nginx.conf           # Nginx reverse proxy
└── package.json         # Dependencies
```

## 🌐 Environment Variables

Create `.env` file with these variables:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=[32+ character random string]
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
NODE_ENV=production
```

Generate session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ Verify Installation

```bash
# Check environment variables
node scripts/check-env.js

# Test server
curl http://localhost:5000/api/auth/user
# Should return: {"message":"Unauthorized"}
```

## 📖 Documentation

- **QUICKSTART.md** - 3 deployment methods, fastest path
- **DEPLOYMENT.md** - Complete guide with:
  - Server setup
  - Database configuration
  - AWS S3 setup
  - Nginx/HTTPS setup
  - Security best practices
  - Troubleshooting

## 🔐 Security

- All passwords are bcrypt hashed (10 salt rounds)
- Session-based authentication
- HTTPS recommended for production
- Rate limiting configured in Nginx
- User isolation enforced

## 🆘 Common Issues

**Dependencies won't install**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Database connection failed**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

**Build fails**
```bash
# Check Node.js version
node --version  # Should be 20+
```

## 📞 Support

- Check `QUICKSTART.md` for fast deployment
- Read `DEPLOYMENT.md` section 10 for troubleshooting
- Verify environment with `node scripts/check-env.js`

## 🎯 Next Steps

1. **Extract files** to your server
2. **Read QUICKSTART.md** to choose deployment method
3. **Configure .env** with your credentials
4. **Deploy** using chosen method
5. **Create admin** user
6. **Set timer** in Admin Dashboard
7. **Create users** for hackathon participants

---

## Default Admin Credentials

**IMPORTANT**: The ZIP does NOT include any default admin user in the database. You MUST create one using:

```bash
tsx scripts/create-admin.js
```

This interactive script will prompt you for:
- Email
- Password (min 8 characters)
- First Name
- Last Name

## Production Checklist

- [ ] Environment variables configured
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Admin user created
- [ ] Application builds successfully (`npm run build`)
- [ ] Server is running
- [ ] HTTPS configured (Nginx + Let's Encrypt)
- [ ] Firewall rules set (ports 22, 80, 443)
- [ ] AWS S3 bucket configured with CORS
- [ ] Timer deadline set in Admin Dashboard

---

**Ready to deploy? Start with QUICKSTART.md!** 🚀
