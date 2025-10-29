# HackFiles - Quick Deployment Guide

Choose your deployment method:

## Option 1: Traditional Server (VPS/Cloud Instance)

### Prerequisites
- Ubuntu/Debian server with Node.js 20+
- PostgreSQL database (or use managed service)
- AWS S3 bucket

### Quick Steps

1. **Upload files to server**
   ```bash
   scp -r ./* user@your-server:/var/www/hackfiles/
   ```

2. **SSH into server and setup**
   ```bash
   ssh user@your-server
   cd /var/www/hackfiles
   
   # Install dependencies
   npm ci
   
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your values
   nano .env
   ```

3. **Configure environment variables** (edit .env)
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket
   ```

4. **Build and deploy**
   ```bash
   # Build application
   npm run build
   
   # Setup database
   npm run db:push
   
   # Create admin user
   npm run create:admin
   # Or manually: tsx scripts/create-admin.js
   
   # Start with PM2
   npm install -g pm2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx** (optional, for HTTPS)
   - See `DEPLOYMENT.md` for full Nginx configuration
   - Or use the included `nginx.conf` as reference

---

## Option 2: Docker Deployment

### Quick Start with Docker

1. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Build the application
   - Start PostgreSQL database
   - Start Nginx reverse proxy
   - Expose on port 80

3. **Create admin user**
   ```bash
   docker-compose exec app npm run create:admin
   ```

4. **View logs**
   ```bash
   docker-compose logs -f app
   ```

### Docker without Compose

```bash
# Build image
docker build -t hackfiles .

# Run container
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="your-db-url" \
  -e SESSION_SECRET="your-secret" \
  -e AWS_ACCESS_KEY_ID="your-key" \
  -e AWS_SECRET_ACCESS_KEY="your-secret" \
  -e AWS_REGION="us-east-1" \
  -e AWS_S3_BUCKET_NAME="your-bucket" \
  --name hackfiles \
  hackfiles
```

---

## Option 3: Development/Testing

For local testing before deployment:

```bash
# Install dependencies
npm install

# Setup .env file
cp .env.example .env
# Edit .env with your values

# Push database schema
npm run db:push

# Create admin user
tsx scripts/create-admin.js

# Start development server
npm run dev
```

Access at `http://localhost:5000`

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Yes | Secret for session encryption (32+ chars) | Generated random string |
| `AWS_ACCESS_KEY_ID` | Yes | AWS access key | From AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret key | From AWS IAM |
| `AWS_REGION` | Yes | AWS region | `us-east-1` |
| `AWS_S3_BUCKET_NAME` | Yes | S3 bucket name | `my-hackfiles-bucket` |
| `NODE_ENV` | No | Environment mode | `production` or `development` |
| `PORT` | No | Server port (default: 5000) | `5000` |

---

## Verify Deployment

### Check Environment
```bash
node scripts/check-env.js
```

### Health Check
```bash
curl http://localhost:5000/api/auth/user
# Should return: {"message":"Unauthorized"}
```

### Admin Login
1. Navigate to `http://your-domain.com`
2. Click "Login" tab
3. Enter admin credentials
4. Should redirect to dashboard

---

## Post-Deployment

1. **Set Hackathon Timer** (Admin Dashboard)
   - Login as admin
   - Navigate to Admin Dashboard
   - Set deadline date/time
   - Activate timer

2. **Create Users** (Admin Dashboard)
   - Click "Create User" button
   - Fill in email, password, name
   - Toggle "Admin User" if needed
   - Submit

3. **Monitor Logs**
   - PM2: `pm2 logs hackfiles`
   - Docker: `docker-compose logs -f app`

---

## Troubleshooting

### Application won't start
```bash
# Check environment variables
node scripts/check-env.js

# Check logs
pm2 logs hackfiles --err
# or
docker-compose logs app
```

### Database connection failed
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### File uploads not working
- Verify AWS credentials
- Check S3 bucket CORS settings
- Ensure bucket permissions allow PUT/GET/DELETE

---

## Need Help?

- **Full Documentation**: See `DEPLOYMENT.md`
- **AWS S3 Setup**: See `DEPLOYMENT.md` section 5
- **Nginx/HTTPS**: See `DEPLOYMENT.md` section 7
- **PM2 Commands**: See `DEPLOYMENT.md` section 6

---

## Quick Commands

```bash
# Verify environment
node scripts/check-env.js

# Create admin user
tsx scripts/create-admin.js

# Build for production
npm ci && npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs hackfiles

# Restart application
pm2 restart hackfiles

# Deploy with Docker
docker-compose up -d

# View Docker logs
docker-compose logs -f
```
