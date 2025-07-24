# Prisma Production Setup Guide

This guide explains how to set up Prisma for production deployment when pushing to the main branch.

## Overview

Your project uses Prisma with PostgreSQL. For production, you need to:

1. Set up a production database
2. Configure environment variables
3. Set up database migrations
4. Configure deployment scripts

## 1. Production Database Setup

### Option A: Vercel Postgres (Recommended for Vercel deployments)

1. **Create Vercel Postgres Database:**

    ```bash
    # Install Vercel CLI if not already installed
    npm i -g vercel

    # Create a new Postgres database
    vercel storage create postgres
    ```

2. **Link to your project:**
    ```bash
    vercel link
    vercel env pull .env.production
    ```

### Option B: External PostgreSQL Provider

Popular options:

- **Neon** (Serverless PostgreSQL)
- **Supabase** (PostgreSQL with additional features)
- **Railway** (Easy deployment)
- **PlanetScale** (MySQL, but can work with Prisma)

## 2. Environment Variables Setup

### Development (.env)

```bash
# Development database
DATABASE_URL="postgresql://username:password@localhost:5432/your_db_name"
```

### Production (.env.production)

```bash
# Production database (Vercel Postgres example)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### Vercel Environment Variables

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add:
    - **Name**: `DATABASE_URL`
    - **Value**: Your production database URL
    - **Environment**: Production (and Preview if needed)

## 3. Database Migration Strategy

### For Vercel Deployments

Add these scripts to your `package.json`:

```json
{
	"scripts": {
		"db:generate": "prisma generate",
		"db:push": "prisma db push",
		"db:migrate": "prisma migrate deploy",
		"db:studio": "prisma studio",
		"db:seed": "tsx prisma/seed.ts",
		"postinstall": "prisma generate"
	}
}
```

### Migration Workflow

1. **Development:**

    ```bash
    # Make schema changes
    npx prisma db push

    # Create migration when ready
    npx prisma migrate dev --name descriptive_name
    ```

2. **Production:**
    ```bash
    # Deploy migrations
    npx prisma migrate deploy
    ```

## 4. Vercel Configuration

### vercel.json (Updated)

```json
{
	"crons": [
		{
			"path": "/api/cron/delete-expired-users",
			"schedule": "0 2 * * *"
		}
	],
	"buildCommand": "npm run build",
	"installCommand": "npm install",
	"framework": "nextjs"
}
```

### Build Configuration

Add to your `package.json`:

```json
{
	"scripts": {
		"build": "prisma generate && prisma migrate deploy && next build",
		"vercel-build": "prisma generate && prisma migrate deploy && next build"
	}
}
```

## 5. Deployment Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18"
                  cache: "npm"

            - name: Install dependencies
              run: npm ci

            - name: Generate Prisma Client
              run: npx prisma generate

            - name: Deploy to Vercel
              uses: amondnet/vercel-action@v25
              with:
                  vercel-token: ${{ secrets.VERCEL_TOKEN }}
                  vercel-org-id: ${{ secrets.ORG_ID }}
                  vercel-project-id: ${{ secrets.PROJECT_ID }}
                  vercel-args: "--prod"
```

## 6. Database Connection Optimization

### Prisma Client Configuration

Update `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
		datasources: {
			db: {
				url: process.env.DATABASE_URL,
			},
		},
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## 7. Production Checklist

### Before Deploying to Main

1. **✅ Database Setup:**

    - [ ] Production database created
    - [ ] DATABASE_URL environment variable set
    - [ ] Database accessible from your deployment platform

2. **✅ Migrations:**

    - [ ] All migrations tested locally
    - [ ] Migration files committed to repository
    - [ ] No pending schema changes

3. **✅ Environment Variables:**

    - [ ] DATABASE_URL set in production
    - [ ] All other required env vars configured
    - [ ] Secrets properly secured

4. **✅ Build Configuration:**
    - [ ] Prisma generate in build process
    - [ ] Migrations run during deployment
    - [ ] Postinstall script configured

## 8. Deployment Commands

### Manual Deployment

```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Build and deploy
npm run build
```

### Vercel Deployment

```bash
# Deploy to Vercel
vercel --prod
```

## 9. Monitoring and Maintenance

### Database Monitoring

- Monitor connection pool usage
- Set up alerts for failed migrations
- Regular backup verification

### Migration Safety

- Always test migrations on staging first
- Use `prisma migrate diff` to review changes
- Keep migration files in version control

## 10. Troubleshooting

### Common Issues

1. **"Database does not exist"**

    - Check DATABASE_URL format
    - Verify database exists and is accessible

2. **"Migration failed"**

    - Check migration files for syntax errors
    - Verify database permissions
    - Review migration logs

3. **"Prisma client not generated"**

    - Run `npx prisma generate`
    - Check if postinstall script is working

4. **"Connection timeout"**
    - Verify database is running
    - Check firewall settings
    - Review connection pool settings

### Debug Commands

```bash
# Check database connection
npx prisma db pull

# View migration status
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## 11. Security Best Practices

1. **Environment Variables:**

    - Never commit DATABASE_URL to repository
    - Use different databases for dev/staging/prod
    - Rotate database passwords regularly

2. **Database Access:**

    - Use connection pooling in production
    - Limit database user permissions
    - Enable SSL connections

3. **Migration Safety:**
    - Always backup before migrations
    - Test migrations on staging environment
    - Use transaction-safe migrations

## 12. Performance Optimization

### Connection Pooling

For production, consider using connection pooling:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL,
		},
	},
	// Connection pooling configuration
	log: ["error"],
});
```

### Query Optimization

- Use Prisma's query optimization features
- Implement proper indexing
- Monitor slow queries

This setup ensures your Prisma configuration is production-ready and follows best practices for deployment and maintenance.
