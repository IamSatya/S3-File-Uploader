# HackFiles - Deployment Guide

This guide will help you deploy HackFiles on your own server (VPS, cloud instance, etc.).

## Prerequisites

- Node.js 18+ installed on your server
- PostgreSQL database (local or cloud-hosted like Neon, Supabase, etc.)
- AWS S3 bucket for file storage
- Domain name (optional, for production)
- Reverse proxy (nginx or similar) for HTTPS

## 1. Server Setup

### Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 for process management
sudo npm install -g pm2
```

## 2. Application Setup

### Clone and Install

```bash
# Clone your repository or upload files to server
cd /var/www
git clone <your-repo-url> hackfiles
cd hackfiles

# Install dependencies
npm install

# Build the application
npm run build
```

### Build Output

The build process creates:
- `dist/public/` - Frontend static files
- `dist/index.js` - Backend server bundle

## 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# .env
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Session Secret (generate a strong random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Server Port (default: 5000)
PORT=5000
```

### Generate Strong Session Secret

```bash
# Generate a random 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Database Setup

### Run Migrations

```bash
# Push schema to database
npm run db:push
```

### Create Initial Admin User

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Generate password hash (run this in Node.js first)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourSecurePassword123!', 10, (err, hash) => { if (err) console.error(err); else console.log(hash); });"

# Insert admin user (replace the hash with output from above)
INSERT INTO users (email, password, first_name, last_name, is_admin) 
VALUES (
  'admin@yourdomain.com',
  '$2b$10$YOUR_HASHED_PASSWORD_HERE',
  'Admin',
  'User',
  true
);
```

## 5. AWS S3 Configuration

### Create S3 Bucket

1. Go to AWS S3 Console
2. Create a new bucket with a unique name
3. Set up CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Create IAM User

1. Create IAM user with programmatic access
2. Attach policy with S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## 6. Start Application with PM2

```bash
# Start application
pm2 start dist/index.js --name hackfiles

# Save PM2 process list
pm2 save

# Setup PM2 to start on server boot
pm2 startup
# Follow the instructions printed by the command above

# View logs
pm2 logs hackfiles

# Monitor application
pm2 monit
```

### PM2 Common Commands

```bash
# Restart application
pm2 restart hackfiles

# Stop application
pm2 stop hackfiles

# View status
pm2 status

# View logs
pm2 logs hackfiles --lines 100
```

## 7. Nginx Configuration (HTTPS with Let's Encrypt)

### Install Nginx and Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Configure Nginx

Create `/etc/nginx/sites-available/hackfiles`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client max upload size (adjust based on your needs)
    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for large file uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

### Enable Site and Get SSL Certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hackfiles /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

## 8. Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 9. Post-Deployment

### Test Your Deployment

1. Visit `https://yourdomain.com`
2. Login with admin credentials
3. Test file upload/download
4. Check PM2 logs for errors: `pm2 logs hackfiles`

### Set Up Timer Configuration

1. Login as admin
2. Go to Admin Dashboard
3. Set hackathon deadline and activate timer

### Monitor Application

```bash
# View real-time logs
pm2 logs hackfiles --lines 100

# Check application status
pm2 status

# View resource usage
pm2 monit

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 10. Updates and Maintenance

### Update Application

```bash
cd /var/www/hackfiles

# Pull latest changes
git pull

# Install dependencies
npm install

# Rebuild application
npm run build

# Run database migrations if needed
npm run db:push

# Restart application
pm2 restart hackfiles
```

### Backup Database

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_20241029_120000.sql
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs hackfiles --err

# Check if port is in use
sudo lsof -i :5000

# Verify environment variables
pm2 env 0
```

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check if database exists
psql $DATABASE_URL -c "SELECT version();"
```

### File Upload Issues

- Verify AWS credentials are correct
- Check S3 bucket CORS configuration
- Verify bucket permissions
- Check Nginx `client_max_body_size` setting

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Security Recommendations

1. **Use strong passwords** for admin accounts
2. **Enable firewall** and only allow necessary ports
3. **Regular updates**: Keep Node.js, npm, and system packages updated
4. **Database backups**: Set up automated daily backups
5. **Monitor logs**: Regularly check application and server logs
6. **Rate limiting**: Consider adding rate limiting for auth endpoints
7. **Session security**: Use HTTPS only, secure session cookies
8. **Environment variables**: Never commit `.env` file to git

## Performance Optimization

1. **Enable Nginx caching** for static assets
2. **Set up CDN** for static files (optional)
3. **Database indexing**: Already configured in schema
4. **PM2 cluster mode**: For high traffic, use `pm2 start dist/index.js -i max`

## Support

For issues or questions, check:
- Application logs: `pm2 logs hackfiles`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -u nginx`
