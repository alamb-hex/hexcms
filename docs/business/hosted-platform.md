# Hosted Platform Architecture

## Overview

This document outlines the architecture for the commercial hosted version of the CMS. The hosted platform builds on top of the open-source core to provide a managed, multi-tenant SaaS offering.

---

## Product Tiers

### Free (Self-Hosted)
- Open source core
- Deploy yourself
- Community support
- All core features

### Starter ($15/mo)
- Hosted infrastructure
- 1 site
- Automatic backups
- SSL included
- Email support

### Pro ($49/mo)
- Everything in Starter
- 5 sites
- Team collaboration (3 users)
- Priority support
- Custom domains
- API access

### Business ($149/mo)
- Everything in Pro
- Unlimited sites
- Unlimited team members
- White-label options
- 99.9% SLA
- Dedicated support
- Advanced analytics

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ User Layer                                                   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Web UI  │  │   CLI    │  │   API    │                 │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘                 │
│        │             │             │                        │
└────────┼─────────────┼─────────────┼────────────────────────┘
         │             │             │
         ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│ Control Plane (Multi-Tenant Management)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │  Billing     │  │   Admin      │     │
│  │   (Clerk)    │  │  (Stripe)    │  │  Dashboard   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Provisioning & Orchestration Service            │      │
│  │  - Site creation                                  │      │
│  │  - Database provisioning                          │      │
│  │  - Deployment management                          │      │
│  └──────────────────────────────────────────────────┘      │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Data Plane (Customer Sites)                                 │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │  Customer 1    │  │  Customer 2    │  │  Customer N  │ │
│  │  - Next.js app │  │  - Next.js app │  │  - Next.js   │ │
│  │  - Postgres DB │  │  - Postgres DB │  │  - Postgres  │ │
│  │  - Edge cache  │  │  - Edge cache  │  │  - Edge      │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Control Plane Architecture

### 1. Management Dashboard

**Technology Stack:**
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **State:** React Query
- **Auth:** Clerk or NextAuth

**Routes:**
```
/dashboard                 # Overview
/dashboard/sites           # Site management
/dashboard/sites/new       # Create new site
/dashboard/sites/[id]      # Site details
/dashboard/settings        # Account settings
/dashboard/team            # Team management
/dashboard/billing         # Billing & usage
```

**Features:**
- Site creation wizard
- Real-time deployment status
- Usage metrics & analytics
- Team member management
- Billing & subscription management
- API key generation

---

### 2. Authentication & Authorization

**Provider:** Clerk (recommended) or NextAuth

**User Roles:**
- **Owner:** Full access, billing
- **Admin:** Manage sites & team
- **Editor:** Edit content
- **Viewer:** Read-only access

**Implementation:**
```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/pricing", "/docs"],
});

// Role-based access control
export function requireRole(role: string[]) {
  // Check user role from session
}
```

**Multi-tenancy:**
- Organizations (Clerk feature)
- Each organization has multiple sites
- Team members per organization
- Role-based permissions per site

---

### 3. Billing & Subscription

**Provider:** Stripe

**Subscription Model:**
```typescript
interface Subscription {
  plan: 'starter' | 'pro' | 'business';
  siteLimit: number;
  userLimit: number;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: Date;
}
```

**Usage Tracking:**
```typescript
interface Usage {
  organizationId: string;
  month: string;
  sites: number;
  builds: number;
  bandwidth: number;
  storage: number;
}
```

**Billing Integration:**
```typescript
// Create checkout session
await stripe.checkout.sessions.create({
  customer: user.stripeCustomerId,
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/pricing`,
});

// Handle webhooks
stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

**Metering for Overages:**
- Track builds per month
- Track bandwidth usage
- Track storage usage
- Alert when approaching limits
- Charge overages on Business plan

---

### 4. Database Schema (Control Plane)

```sql
-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  clerk_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (organization_id, user_id)
);

-- Sites (customer deployments)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE,
  github_repo_url TEXT,
  vercel_project_id VARCHAR(255),
  postgres_db_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  site_limit INTEGER NOT NULL,
  user_limit INTEGER NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  site_id UUID REFERENCES sites(id),
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  builds INTEGER DEFAULT 0,
  bandwidth_gb DECIMAL(10,2) DEFAULT 0,
  storage_gb DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, month)
);

-- Deployments
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  commit_sha VARCHAR(40),
  status VARCHAR(50) NOT NULL,
  vercel_deployment_id VARCHAR(255),
  url TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  prefix VARCHAR(20) NOT NULL,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Provisioning Service

### Site Creation Flow

```typescript
// Orchestration service
async function createSite(input: CreateSiteInput) {
  // 1. Validate subscription limits
  await validateLimits(organizationId);
  
  // 2. Create database
  const dbName = `customer_${siteId}`;
  await createCustomerDatabase(dbName);
  
  // 3. Initialize schema
  await initializeDatabaseSchema(dbName);
  
  // 4. Create Vercel project
  const vercelProject = await createVercelProject({
    name: siteName,
    framework: 'nextjs',
    environmentVariables: {
      POSTGRES_URL: getDatabaseUrl(dbName),
      GITHUB_REPO: githubRepo,
      // ... other vars
    }
  });
  
  // 5. Set up GitHub webhook
  await setupGitHubWebhook({
    repo: githubRepo,
    url: `${vercelProject.url}/api/sync-content`,
    secret: generateWebhookSecret()
  });
  
  // 6. Deploy from template
  await deployFromTemplate(vercelProject.id);
  
  // 7. Save to control plane DB
  await saveSite({
    organizationId,
    vercelProjectId: vercelProject.id,
    postgresDbName: dbName,
    status: 'active'
  });
  
  return { siteId, url: vercelProject.url };
}
```

---

### Database Provisioning

**Option 1: Shared Postgres (Simpler)**

```typescript
// Create schema per customer
async function createCustomerDatabase(customerId: string) {
  await sql`CREATE SCHEMA ${sql(customerId)}`;
  
  // Create tables in customer schema
  await sql`
    CREATE TABLE ${sql(`${customerId}.posts`)} (
      -- same schema as open source
    );
  `;
  
  // Use schema in queries
  await sql`
    SELECT * FROM ${sql(`${customerId}.posts`)}
    WHERE status = 'published'
  `;
}
```

**Pros:**
- Simpler infrastructure
- Lower costs
- Easier backups

**Cons:**
- Shared resources
- Potential noisy neighbor
- Less isolation

---

**Option 2: Isolated Databases (More Scalable)**

```typescript
// Create separate database per customer
async function createCustomerDatabase(customerId: string) {
  const dbName = `customer_${customerId}`;
  
  // Using Neon (serverless Postgres)
  const database = await neon.createDatabase({
    name: dbName,
    region: 'us-east-1'
  });
  
  // Initialize schema
  const client = new Client({ connectionString: database.connectionString });
  await client.query(SCHEMA_SQL);
  
  return {
    name: dbName,
    connectionString: database.connectionString
  };
}
```

**Pros:**
- Complete isolation
- Better performance
- Independent scaling
- Easier data portability

**Cons:**
- Higher costs ($1-5 per database)
- More complex management
- More connection overhead

**Recommendation:** Start with Option 1 (schemas), migrate to Option 2 when you have 50+ customers or $5k+ MRR.

---

### Deployment Management

**Vercel API Integration:**

```typescript
import { Vercel } from '@vercel/sdk';

const vercel = new Vercel({ token: process.env.VERCEL_TOKEN });

// Create project
async function createVercelProject(config: ProjectConfig) {
  const project = await vercel.projects.create({
    name: config.name,
    framework: 'nextjs',
    gitRepository: {
      repo: config.githubRepo,
      type: 'github'
    },
    environmentVariables: config.env.map(({ key, value }) => ({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview']
    }))
  });
  
  return project;
}

// Trigger deployment
async function triggerDeployment(projectId: string) {
  const deployment = await vercel.deployments.create({
    name: projectId,
    gitSource: {
      type: 'github',
      ref: 'main'
    }
  });
  
  return deployment;
}

// Get deployment status
async function getDeploymentStatus(deploymentId: string) {
  const deployment = await vercel.deployments.get(deploymentId);
  return deployment.readyState; // READY, ERROR, BUILDING, etc.
}
```

---

## Data Plane Architecture

### Customer Site Structure

Each customer site is a deployed Next.js application with:

```
Customer Site (on Vercel)
├── Next.js application
│   ├── /api/sync-content     # Webhook from GitHub
│   ├── /api/revalidate       # ISR revalidation
│   ├── /blog                 # Public blog pages
│   └── Environment variables # Isolated per site
├── Postgres database
│   └── Customer schema/DB
└── GitHub webhook
    └── Points to site's sync endpoint
```

---

### Environment Variable Management

Each site needs isolated environment variables:

```typescript
interface SiteEnvironment {
  // Database
  POSTGRES_URL: string;
  POSTGRES_PRISMA_URL: string;
  
  // GitHub
  GITHUB_TOKEN: string;
  GITHUB_REPO_OWNER: string;
  GITHUB_REPO_NAME: string;
  GITHUB_WEBHOOK_SECRET: string;
  
  // App config
  NEXT_PUBLIC_SITE_URL: string;
  REVALIDATION_SECRET: string;
  
  // Control plane (for callbacks)
  CONTROL_PLANE_API_KEY: string;
  CONTROL_PLANE_URL: string;
}
```

**Security:**
- Encrypt at rest (Vercel does this)
- Never log secrets
- Rotate periodically
- Unique per site

---

### Multi-Tenancy Patterns

**Pattern 1: Separate Deployments (Recommended)**

```
Customer A → Vercel Project A → Database A
Customer B → Vercel Project B → Database B
Customer C → Vercel Project C → Database C
```

**Pros:**
- Complete isolation
- Independent scaling
- Easy to debug
- Customer-specific customization

**Cons:**
- More infrastructure to manage
- Higher base costs
- More deployment overhead

---

**Pattern 2: Shared Deployment**

```
All Customers → Single Vercel Project → Route by domain → Database per customer
```

**Pros:**
- Simpler infrastructure
- Lower costs initially
- Shared code updates

**Cons:**
- Complex routing logic
- Shared resources
- One bug affects all
- Harder to customize

**Recommendation:** Use Pattern 1 (separate deployments). The isolation is worth it.

---

## Monitoring & Observability

### Control Plane Monitoring

**Metrics to Track:**

```typescript
// Business metrics
const metrics = {
  // Revenue
  mrr: 0,
  arr: 0,
  churn: 0,
  
  // Growth
  signups: 0,
  activations: 0,
  conversions: 0,
  
  // Usage
  totalSites: 0,
  activeOrgs: 0,
  totalBuilds: 0,
  
  // Performance
  avgProvisioningTime: 0,
  provisioningSuccessRate: 0,
  deploymentSuccessRate: 0
};
```

**Tools:**
- **Vercel Analytics** - Web vitals
- **PostHog** - Product analytics
- **Sentry** - Error tracking
- **LogDrain** - Structured logs
- **Better Stack** - Uptime monitoring

---

### Customer Site Monitoring

**Per-Site Metrics:**

```typescript
interface SiteMetrics {
  siteId: string;
  period: string;
  
  // Performance
  avgPageLoad: number;
  p95PageLoad: number;
  
  // Usage
  pageViews: number;
  builds: number;
  bandwidth: number;
  storage: number;
  
  // Health
  uptime: number;
  errors: number;
  
  // Content
  posts: number;
  authors: number;
}
```

**Alerting:**
- Site down > 5 minutes
- Build failures
- Error rate > 1%
- Approaching usage limits
- Subscription expiring

---

## Scaling Considerations

### Infrastructure Scaling

**Phase 1: 0-50 customers**
- Single control plane
- Shared Postgres (schemas)
- Manual provisioning acceptable
- Basic monitoring

**Phase 2: 50-500 customers**
- Automated provisioning
- Isolated databases (Neon)
- Advanced monitoring
- Support team

**Phase 3: 500-5000 customers**
- Multi-region control plane
- Database clustering
- Automated scaling
- Enterprise features
- 24/7 support

---

### Database Scaling Strategy

**Vertical Scaling (First):**
- Increase Postgres instance size
- Add read replicas
- Optimize queries
- Add caching layer (Redis)

**Horizontal Scaling (Later):**
- Shard by customer
- Multi-region deployments
- Separate read/write databases

**Cost Optimization:**
- Archive inactive sites
- Compress old content
- Optimize storage
- Use spot instances where possible

---

## Security Architecture

### Security Layers

**1. Authentication**
- Clerk/NextAuth for users
- API keys for programmatic access
- JWT tokens for sessions
- Multi-factor authentication

**2. Authorization**
- Role-based access control
- Organization-level permissions
- Site-level permissions
- API scope limitations

**3. Data Security**
- Encryption at rest (Vercel Postgres)
- Encryption in transit (TLS)
- Database access via private network
- Secrets in encrypted vault

**4. Network Security**
- Rate limiting on all endpoints
- DDoS protection (Vercel)
- WAF rules
- IP allowlisting (Enterprise)

**5. Application Security**
- Input validation (Zod)
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping)
- CSRF protection

---

### Compliance & Privacy

**Data Processing:**
- GDPR compliant
- Data processing agreements
- Right to data export
- Right to deletion
- Privacy policy

**Security Certifications:**
- SOC 2 Type II (for Enterprise)
- GDPR compliance
- ISO 27001 (optional)

---

## Disaster Recovery

### Backup Strategy

**Control Plane:**
- Daily automated backups
- Point-in-time recovery
- Multi-region replication
- Backup retention: 30 days

**Customer Sites:**
- Daily database backups
- Backup retention: 7 days (Starter), 30 days (Pro), 90 days (Business)
- Git serves as content backup
- Export functionality for full portability

---

### Recovery Procedures

**Site Failure:**
1. Detect via monitoring
2. Attempt auto-recovery
3. Notify customer if > 5 min
4. Manual intervention if needed
5. Post-mortem after resolution

**Control Plane Failure:**
1. Automatic failover to secondary region
2. Customer sites continue running (isolated)
3. Restore control plane from backup
4. Validate all systems
5. Customer communication

**Data Loss:**
1. Restore from latest backup
2. Sync from Git repository
3. Validate data integrity
4. Customer notification
5. Incident report

---

## API for Customers

### REST API

**Endpoints:**

```
Authentication:
POST   /api/auth/token              # Get API token

Sites:
GET    /api/sites                   # List sites
POST   /api/sites                   # Create site
GET    /api/sites/:id               # Get site details
PATCH  /api/sites/:id               # Update site
DELETE /api/sites/:id               # Delete site

Content:
POST   /api/sites/:id/sync          # Trigger sync
GET    /api/sites/:id/posts         # List posts
GET    /api/sites/:id/posts/:slug   # Get post
POST   /api/sites/:id/posts         # Create post
PATCH  /api/sites/:id/posts/:slug   # Update post
DELETE /api/sites/:id/posts/:slug   # Delete post

Deployments:
GET    /api/sites/:id/deployments   # List deployments
POST   /api/sites/:id/deployments   # Trigger deployment
GET    /api/deployments/:id         # Get deployment status

Analytics:
GET    /api/sites/:id/analytics     # Get site analytics
```

**Authentication:**
```typescript
// API key in header
headers: {
  'Authorization': 'Bearer sk_live_xxxxx',
  'Content-Type': 'application/json'
}
```

---

### Webhooks (for customers)

Allow customers to receive events:

```typescript
// Webhook events
enum WebhookEvent {
  SITE_CREATED = 'site.created',
  SITE_UPDATED = 'site.updated',
  SITE_DELETED = 'site.deleted',
  DEPLOYMENT_STARTED = 'deployment.started',
  DEPLOYMENT_SUCCEEDED = 'deployment.succeeded',
  DEPLOYMENT_FAILED = 'deployment.failed',
  POST_PUBLISHED = 'post.published',
  POST_UPDATED = 'post.updated',
}

// Payload
interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  timestamp: string;
  signature: string;
}
```

---

## White-Label Features (Business Tier)

### Customization Options

**Branding:**
- Custom logo in dashboard
- Custom colors/theme
- Remove "[Product Name]" branding
- Custom domain for dashboard

**Features:**
- Custom email templates
- Custom authentication page
- Custom error pages
- API with customer branding

**Implementation:**
```typescript
interface WhiteLabelConfig {
  organizationId: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  dashboardDomain: string;
  emailFromName: string;
  emailFromAddress: string;
}
```

---

## Cost Structure

### Infrastructure Costs (Per Customer)

**Starter ($15/mo):**
- Vercel hosting: $0 (free tier)
- Database: $1-2
- Bandwidth: $0.50
- Monitoring: $0.50
- **Cost:** ~$2-3
- **Margin:** $12-13 (80%)

**Pro ($49/mo):**
- Vercel hosting: $5 (5 sites)
- Database: $5 (5 DBs)
- Bandwidth: $2
- Monitoring: $1
- Support: $2
- **Cost:** ~$15
- **Margin:** $34 (69%)

**Business ($149/mo):**
- Vercel hosting: $20
- Database: $20
- Bandwidth: $5
- Monitoring: $2
- Support: $10
- **Cost:** ~$57
- **Margin:** $92 (62%)

---

### Fixed Monthly Costs

**Months 1-6 (MVP):**
- Control plane hosting: $0 (Vercel free)
- Control plane DB: $20
- Auth (Clerk): $25
- Monitoring: $0 (free tiers)
- Email: $0 (free tier)
- **Total:** ~$45/month

**Months 6-12 (Scaling):**
- Control plane hosting: $20
- Control plane DB: $50
- Auth: $50
- Monitoring: $50
- Email: $20
- Stripe fees: ~3% of revenue
- **Total:** ~$200/month + 3% revenue

---

## Technical Implementation

### Control Plane Setup

```bash
# Create control plane project
npx create-next-app@latest control-plane --typescript --tailwind

# Install dependencies
npm install @clerk/nextjs stripe @vercel/sdk @neondatabase/serverless

# Set up database
# Create on Vercel Postgres or Neon

# Environment variables
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
VERCEL_TOKEN=
NEON_API_KEY=
DATABASE_URL=
```

---

### Site Template

```bash
# Create template repository
git clone your-open-source-cms template-site
cd template-site

# Configure for hosted platform
# Add control plane callback
# Add usage tracking
# Configure defaults

# Create template on GitHub
```

---

### Provisioning Service

```typescript
// src/lib/provisioning/site-creator.ts
export async function createSite(config: SiteConfig) {
  const siteId = generateId();
  
  try {
    // Update status
    await updateSiteStatus(siteId, 'provisioning');
    
    // Create database
    const db = await createDatabase(siteId);
    
    // Create Vercel project
    const project = await createVercelProject({
      name: config.name,
      template: 'template-site',
      env: {
        POSTGRES_URL: db.connectionString,
        ...config.env
      }
    });
    
    // Set up webhooks
    await setupWebhooks(config.githubRepo, project.url);
    
    // Update status
    await updateSiteStatus(siteId, 'active');
    
    return { siteId, url: project.url };
  } catch (error) {
    await updateSiteStatus(siteId, 'failed');
    throw error;
  }
}
```

---

## Migration Path

### From Open Source to Hosted

**Step 1: Export data**
```bash
# Export from self-hosted
pg_dump $POSTGRES_URL > backup.sql
```

**Step 2: Import to hosted**
```bash
# Provide import tool
curl -X POST https://api.yourplatform.com/v1/sites/:id/import \
  -F "backup=@backup.sql" \
  -F "github_repo=user/repo"
```

**Step 3: Update GitHub webhook**
- Point to new hosted URL
- Test sync

**Step 4: Update DNS**
- Point domain to hosted site
- Verify SSL

---

## Roadmap

### Phase 1: MVP (Months 1-3)
- [ ] Control plane dashboard
- [ ] Basic site creation
- [ ] Stripe integration
- [ ] Manual provisioning
- [ ] Basic monitoring

### Phase 2: Automation (Months 4-6)
- [ ] Automated provisioning
- [ ] API endpoints
- [ ] Usage tracking
- [ ] Better monitoring
- [ ] Email notifications

### Phase 3: Scale (Months 7-12)
- [ ] White-label features
- [ ] Advanced analytics
- [ ] Team collaboration
- [ ] API webhooks
- [ ] Enterprise features

---

## Success Metrics

**Technical Metrics:**
- Provisioning time: < 2 minutes
- Provisioning success rate: > 99%
- Site uptime: > 99.9%
- Average response time: < 200ms
- Error rate: < 0.1%

**Business Metrics:**
- Trial to paid: > 20%
- Monthly churn: < 5%
- NPS score: > 50
- Support ticket volume: < 1 per customer/month

---

## Conclusion

This hosted platform architecture provides:
- ✅ Complete isolation between customers
- ✅ Scalable infrastructure
- ✅ High margins (60-80%)
- ✅ Enterprise-ready security
- ✅ Clear upgrade path from open source

The key is to start simple (shared Postgres schemas, manual provisioning) and evolve as you grow. Build what you need when you need it, not before.

**Next Steps:**
1. Build control plane MVP
2. Test provisioning flow
3. Onboard beta customers
4. Iterate based on feedback
5. Scale infrastructure as needed
