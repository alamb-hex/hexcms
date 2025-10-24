# ADR-004: Deploy to Vercel Platform

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** heXcms Core Team

## Context

We need a production hosting platform for deploying heXcms applications. The platform must support:

- Next.js 14 with App Router
- Edge runtime and serverless functions
- PostgreSQL database connectivity
- GitHub integration for CI/CD
- Custom domains and SSL certificates
- Environment variable management
- High availability and global CDN
- Reasonable pricing for open source projects

Key requirements:
- Zero-downtime deployments
- Automatic HTTPS
- Preview deployments for pull requests
- Fast global performance
- Easy rollback capabilities
- Minimal DevOps overhead
- Good developer experience

Constraints:
- Must support Next.js Server Components
- Must support PostgreSQL connections
- Need edge runtime for low latency
- Want automatic CI/CD from Git

## Decision

We will use **Vercel** as the primary recommended hosting platform for heXcms deployments.

Specifically:
- Vercel Pro or Enterprise plans for production
- Hobby plan for personal projects
- Vercel Postgres for database hosting
- Automatic deployments from GitHub
- Edge network for global performance
- Environment variables for configuration

We will also document self-hosting options for users who prefer:
- Docker Compose
- Kubernetes
- AWS/GCP/Azure
- Traditional VPS (DigitalOcean, Linode, etc.)

## Consequences

### Positive

- **Zero-config deploys**: Push to Git, Vercel handles the rest
- **Preview deployments**: Every PR gets a live preview URL
- **Edge network**: Content served from 100+ global edge locations
- **Automatic HTTPS**: SSL certificates provisioned automatically
- **Environment variables**: Secure config management built-in
- **Instant rollback**: One-click rollback to previous deployment
- **Analytics**: Built-in Web Vitals monitoring
- **Made by Next.js creators**: First-class Next.js support
- **Serverless functions**: Auto-scaling with zero config
- **Free for open source**: Hobby plan includes generous limits
- **Vercel Postgres**: Integrated database solution
- **DDoS protection**: Built-in security

### Negative

- **Vendor lock-in**: Tight coupling to Vercel platform
- **Cost at scale**: Can get expensive for high-traffic sites
- **Regional restrictions**: Edge functions have execution time limits
- **Limited customization**: Less control than self-hosted infrastructure
- **Cold starts**: Serverless functions can have cold start latency
- **Build limits**: Free tier has build minute limits
- **Bandwidth costs**: High bandwidth usage incurs charges

### Risks

- **Pricing changes**: Vercel could change pricing in the future
- **Service outages**: Dependent on Vercel's uptime
- **Regional availability**: May not be available in all countries
- **Lock-in concerns**: Migration to other platforms requires work
- **Build complexity**: Complex builds may hit time limits

## Alternatives Considered

### Alternative 1: Netlify

- **Pros:**
  - Similar DX to Vercel
  - Preview deployments
  - Good Next.js support
  - Competitive pricing
  - Serverless functions
- **Cons:**
  - Next.js support not as mature as Vercel
  - Edge functions limited compared to Vercel
  - No integrated database solution
  - Less optimized for Next.js specifically
- **Reason for rejection:** Vercel has better Next.js support (they created it). Edge network is faster. Vercel Postgres integration is simpler.

### Alternative 2: AWS (Amplify or ECS)

- **Pros:**
  - Maximum flexibility and control
  - No vendor lock-in to a specific framework platform
  - Wide range of services (RDS, S3, CloudFront)
  - Enterprise-grade reliability
  - Competitive pricing at scale
- **Cons:**
  - Complex setup and configuration
  - Steep learning curve
  - More DevOps overhead
  - No automatic preview deployments
  - Manual SSL/CDN configuration
  - Slower deployment process
- **Reason for rejection:** Too much complexity for most users. Vercel provides better DX with similar performance. We can document AWS deployment for enterprise users.

### Alternative 3: Self-Hosted VPS (DigitalOcean, Linode)

- **Pros:**
  - Full control over infrastructure
  - Predictable pricing
  - No vendor lock-in
  - Can host PostgreSQL on same server
  - SSH access for debugging
- **Cons:**
  - Manual server management
  - No automatic scaling
  - Need to configure CI/CD
  - Manual SSL certificate management
  - No edge network (single region)
  - Security updates are manual
  - Higher maintenance burden
- **Reason for rejection:** Too much DevOps work for most users. Vercel automates 95% of deployment tasks. Self-hosting is better suited for advanced users with specific needs.

### Alternative 4: Docker + Kubernetes

- **Pros:**
  - Ultimate flexibility
  - Can run anywhere
  - Auto-scaling and orchestration
  - No platform lock-in
  - Industry standard
- **Cons:**
  - Very complex setup
  - Requires Kubernetes expertise
  - Expensive (need cluster)
  - Significant DevOps overhead
  - Overkill for most CMS deployments
  - Long deployment times
- **Reason for rejection:** Massive overkill for a CMS. Kubernetes is great for complex microservices but adds unnecessary complexity here. Document as an option for enterprise users.

### Alternative 5: Cloudflare Pages

- **Pros:**
  - Excellent global CDN
  - Competitive pricing
  - Good Next.js support
  - Cloudflare Workers (edge compute)
  - DDoS protection
- **Cons:**
  - Next.js support not as mature as Vercel
  - No integrated database solution
  - More configuration required
  - Smaller ecosystem than Vercel
- **Reason for rejection:** While Cloudflare has an excellent CDN, their Next.js support is not as polished as Vercel's. Vercel is purpose-built for Next.js.

## Implementation Notes

### Vercel Deployment

#### Initial Setup

1. **Connect repository**:
   - Connect GitHub repo to Vercel
   - Select framework preset: Next.js
   - Configure root directory: `./`

2. **Environment variables**:
   ```bash
   POSTGRES_URL=postgres://...
   GITHUB_TOKEN=ghp_...
   GITHUB_WEBHOOK_SECRET=...
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

3. **Database**:
   - Create Vercel Postgres database
   - Copy connection string to `POSTGRES_URL`
   - Run initialization: `npm run db:init`

#### Custom Domain

```bash
# Add custom domain in Vercel dashboard
your-domain.com

# Vercel provides DNS records:
CNAME @ cname.vercel-dns.com
```

#### Preview Deployments

Every PR automatically gets a preview URL:
```
https://hexcms-git-feature-branch-username.vercel.app
```

Team can review content changes before merging.

### Self-Hosting Documentation

We will provide comprehensive self-hosting guides:

**Option 1: Docker Compose**
- Single server deployment
- PostgreSQL in Docker
- Nginx reverse proxy
- Let's Encrypt SSL

**Option 2: AWS**
- ECS/Fargate for app
- RDS for PostgreSQL
- CloudFront for CDN
- Route 53 for DNS

**Option 3: Kubernetes**
- Helm chart provided
- Horizontal pod autoscaling
- External PostgreSQL
- Ingress with SSL

### Cost Estimation

**Vercel Hobby (Free):**
- Perfect for: Personal blogs, portfolios
- Limits: 100GB bandwidth, commercial use not allowed

**Vercel Pro ($20/month):**
- Perfect for: Small businesses, side projects
- Includes: 1TB bandwidth, custom domains, analytics

**Vercel Enterprise (Custom):**
- Perfect for: Large organizations
- Includes: SLA, dedicated support, advanced features

**Vercel Postgres:**
- Hobby: Free (256MB, 1 database)
- Pro: $24/month (512MB, multiple databases)

**Total for small site:**
- ~$44/month (Pro + Postgres)
- Comparable to managed WordPress hosting
- Zero DevOps time required

### Migration Plan

If users want to migrate away from Vercel:

1. **Containerize**: Use provided Dockerfile
2. **Database export**: Export PostgreSQL data
3. **Environment variables**: Copy to new platform
4. **Build**: `npm run build`
5. **Deploy**: Run container on target platform

No code changes required - it's standard Next.js.

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Deploy Next.js](https://nextjs.org/docs/deployment)
- [Vercel Pricing](https://vercel.com/pricing)

---

**Related ADRs:**
- [ADR-001: Use Next.js 14 as Framework](./001-use-nextjs-14.md)
- [ADR-002: Use PostgreSQL Over MongoDB](./002-use-postgresql-over-mongodb.md)
