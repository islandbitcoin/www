# DigitalOcean App Platform Deployment

This guide covers deploying Island Bitcoin using DigitalOcean App Platform with GitHub integration.

## Overview: App Platform vs Droplet

### App Platform (PaaS)
- **Pros**: Auto-deployment from GitHub, managed infrastructure, built-in CI/CD
- **Cons**: More expensive (~$20-30/month minimum), less control, limited Redis options
- **Best for**: Teams wanting automated deployments without server management

### Droplet with Docker (VPS)
- **Pros**: Full control, cheaper (~$6-20/month), better Redis integration
- **Cons**: Manual deployment, requires server management
- **Best for**: Cost-conscious deployments, full control needed

## App Platform Deployment

### Prerequisites
- GitHub repository with the code
- DigitalOcean account
- Domain name (optional)

### Step 1: Prepare Repository

1. Ensure your repository structure has `public_html` as the source directory
2. The `.do/app.yaml` file is already configured in this project
3. Update the GitHub repo reference in `.do/app.yaml`:
   ```yaml
   github:
     repo: YOUR_GITHUB_USERNAME/islandbitcoin-web
   ```

### Step 2: Create App in DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as source
4. Authorize DigitalOcean to access your repository
5. Select your repository and branch (usually `main`)
6. DigitalOcean will auto-detect the app configuration

### Step 3: Configure App Settings

1. **Source Directory**: Set to `public_html`
2. **Build Command**: `npm install && npm run build`
3. **Run Command**: `node server/unified-server.js`
4. **HTTP Port**: 3000

### Step 4: Environment Variables

Add these in the App Platform console:

```env
NODE_ENV=production
API_SECRET=your-generated-secret-here
# Generate with: openssl rand -base64 32
```

### Step 5: Add Redis Database

1. In your app settings, go to "Components"
2. Click "Add Component" → "Database"
3. Choose Redis
4. Select the smallest size ($15/month)
5. The `REDIS_URL` will be automatically injected

### Step 6: Deploy

1. Review your settings
2. Click "Create Resources"
3. DigitalOcean will build and deploy your app
4. Monitor the build logs for any issues

### Step 7: Configure Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain
3. Update your DNS records as instructed

## Cost Breakdown

**App Platform Minimum Setup**:
- App (Basic): $5/month
- Redis Database: $15/month
- **Total**: ~$20/month

**For comparison, Droplet setup**:
- Basic Droplet: $6/month (includes Redis via Docker)
- **Total**: $6/month

## Automatic Deployments

Once configured, App Platform will:
1. Watch your GitHub repository
2. Auto-deploy on every push to main branch
3. Run build commands
4. Start the application
5. Handle SSL certificates automatically

## Limitations

1. **Redis**: App Platform Redis is managed and more expensive
2. **File Storage**: No persistent file storage (use Spaces for uploads)
3. **Customization**: Limited server-level customization
4. **Cost**: Significantly more expensive than VPS

## Monitoring

App Platform provides:
- Build logs
- Runtime logs
- Metrics dashboard
- Alerts (configure in settings)

## Troubleshooting

### Build Failures
- Check build logs in App Platform console
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Runtime Errors
- Check runtime logs
- Verify environment variables are set
- Ensure Redis connection is working

### Performance Issues
- Scale up instance size
- Add more instances
- Check Redis performance

## Alternative: Stick with Droplet

If cost is a concern or you need more control, the Droplet deployment (see [DEPLOYMENT.md](./DEPLOYMENT.md)) is recommended:
- 3-4x cheaper
- Full control over environment
- Better Redis integration
- More flexible configuration

## Migration from App Platform to Droplet

If you start with App Platform and want to migrate later:
1. Export your Redis data
2. Follow the Droplet setup guide
3. Import Redis data
4. Update DNS records

---

**Recommendation**: Unless you specifically need GitHub auto-deployment and don't mind the extra cost, the Droplet deployment offers better value and flexibility for Island Bitcoin.