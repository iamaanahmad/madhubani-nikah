# Production Deployment Guide

This guide covers the production deployment and maintenance of the Madhubani Nikah application.

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Appwrite Cloud account or self-hosted Appwrite instance
- Domain name with SSL certificate
- Email service (SMTP) for notifications
- SMS service (Twilio) for OTP verification

## Environment Setup

### 1. Environment Variables

Copy the production environment template:
```bash
cp .env.production.example .env.production
```

Update the following required variables:

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint.com/v1
APPWRITE_API_KEY=your_production_api_key

# Security
NEXTAUTH_SECRET=your_super_secure_secret_32_chars_min
NEXTAUTH_URL=https://your-domain.com

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@your-domain.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 2. Security Configuration

Ensure the following security settings are enabled:

```bash
ENABLE_SECURITY_HEADERS=true
CONTENT_SECURITY_POLICY_ENABLED=true
RATE_LIMIT_ENABLED=true
ENABLE_ERROR_TRACKING=true
ENABLE_PERFORMANCE_MONITORING=true
```

## Deployment Process

### 1. Pre-deployment Checks

Run the automated deployment script:
```bash
npm run deploy:production
```

This script will:
- Validate environment variables
- Run security audit
- Check TypeScript compilation
- Optimize for production
- Build the application
- Generate deployment report

### 2. Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Install dependencies
npm ci --only=production

# 2. Run type checking
npm run typecheck

# 3. Run security audit
npm run security:audit

# 4. Build for production
npm run build:production

# 5. Start the application
npm run start:production
```

### 3. Health Check

After deployment, verify the application is running:
```bash
npm run health:check
```

Or check the health endpoint:
```bash
curl https://your-domain.com/api/health
```

## Monitoring and Maintenance

### 1. Performance Monitoring

The application includes built-in performance monitoring:
- Real-time metrics collection
- Slow query detection
- Memory usage tracking
- Error rate monitoring

Access monitoring data through the admin dashboard or health endpoint.

### 2. Error Tracking

Configure error tracking by setting:
```bash
ENABLE_ERROR_TRACKING=true
SENTRY_DSN=your_sentry_dsn  # Optional
```

### 3. Backup and Recovery

#### Create Backups

```bash
# Full backup
npm run backup:create full

# Database only
npm run backup:create database

# Files only
npm run backup:create files
```

#### List Backups

```bash
npm run backup:list
```

#### Restore from Backup

```bash
npm run backup:restore backup-id
```

#### Cleanup Old Backups

```bash
# Clean backups older than 30 days
npm run backup:cleanup 30
```

### 4. Log Management

Logs are managed based on the LOG_LEVEL environment variable:
- `error`: Only errors (recommended for production)
- `warn`: Warnings and errors
- `info`: Informational messages
- `debug`: All messages (not recommended for production)

## Security Best Practices

### 1. Environment Security

- Use strong, unique secrets for all environment variables
- Rotate API keys and secrets regularly
- Use HTTPS for all endpoints
- Enable security headers

### 2. Database Security

- Use strong passwords for database access
- Enable database encryption at rest
- Regularly backup database
- Monitor for suspicious activity

### 3. File Storage Security

- Enable virus scanning for uploaded files
- Implement file type restrictions
- Use CDN for static assets
- Monitor storage usage

### 4. Network Security

- Use firewall to restrict access
- Enable DDoS protection
- Monitor network traffic
- Use VPN for admin access

## Performance Optimization

### 1. Caching

Enable caching for better performance:
```bash
ENABLE_CACHING=true
CDN_URL=https://your-cdn-domain.com
```

### 2. Image Optimization

Images are automatically optimized by Next.js. Configure additional settings:
```bash
ENABLE_IMAGE_OPTIMIZATION=true
```

### 3. Bundle Analysis

Analyze bundle size:
```bash
npm run performance:analyze
```

## Troubleshooting

### 1. Application Won't Start

Check the following:
- All required environment variables are set
- Database is accessible
- Port is not already in use
- SSL certificates are valid

### 2. High Memory Usage

- Check for memory leaks in custom code
- Monitor database query performance
- Review file upload sizes
- Consider scaling horizontally

### 3. Slow Response Times

- Check database query performance
- Review network latency
- Monitor third-party API response times
- Consider implementing caching

### 4. Database Connection Issues

- Verify database credentials
- Check network connectivity
- Review connection pool settings
- Monitor database server health

## Scaling Considerations

### 1. Horizontal Scaling

- Use load balancer for multiple instances
- Implement session storage (Redis)
- Use CDN for static assets
- Consider microservices architecture

### 2. Database Scaling

- Implement read replicas
- Use database connection pooling
- Consider database sharding
- Monitor query performance

### 3. File Storage Scaling

- Use cloud storage (AWS S3, Google Cloud Storage)
- Implement CDN for file delivery
- Consider image processing services
- Monitor storage costs

## Maintenance Schedule

### Daily
- Monitor application health
- Check error logs
- Review performance metrics

### Weekly
- Review security logs
- Check backup integrity
- Update dependencies (if needed)
- Performance analysis

### Monthly
- Security audit
- Backup cleanup
- Performance optimization review
- Capacity planning

### Quarterly
- Full security review
- Disaster recovery testing
- Performance benchmarking
- Architecture review

## Support and Contacts

For production issues:
- Technical Support: tech@madhubaninikah.com
- Security Issues: security@madhubaninikah.com
- Emergency Contact: +91-XXXX-XXXX-XX

## Additional Resources

- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Appwrite Production Guide](https://appwrite.io/docs/production)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Security Checklist](https://github.com/shieldfy/API-Security-Checklist)

---

**Note**: This is a production system handling sensitive user data. Always follow security best practices and test changes in a staging environment before deploying to production.