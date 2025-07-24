# Cron Job Setup for Deleting Expired Users

This document explains how to set up a cron job to automatically delete users that have been soft-deleted for more than 12 months.

## Overview

The system uses a soft-delete approach where users are marked with a `deletedAt` timestamp instead of being immediately removed from the database. After 12 months, these users are permanently deleted to comply with data retention policies.

## Files Created

1. **`src/services/cron.ts`** - Core service functions for deleting expired users
2. **`scripts/delete-expired-users.ts`** - Standalone script for manual execution
3. **`src/app/api/cron/delete-expired-users/route.ts`** - API endpoint for external cron services
4. **`vercel.json`** - Vercel Cron configuration
5. **`docs/cron-job-setup.md`** - This documentation

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

1. **Set Environment Variable:**

    ```bash
    # Add to your .env file
    CRON_SECRET=your-secret-key-here
    ```

2. **Deploy to Vercel:**
   The `vercel.json` file is already configured to run the cron job daily at 2:00 AM.

3. **Verify Setup:**
    ```bash
    # Test the endpoint (replace with your domain)
    curl -X POST https://your-domain.vercel.app/api/cron/delete-expired-users \
      -H "Authorization: Bearer your-secret-key-here"
    ```

### Option 2: Manual Cron Job (Linux/Unix systems)

1. **Make the script executable:**

    ```bash
    chmod +x scripts/delete-expired-users.ts
    ```

2. **Add to crontab:**

    ```bash
    # Open crontab
    crontab -e

    # Add this line to run daily at 2:00 AM
    0 2 * * * cd /path/to/your/project && npm run delete-expired-users >> /var/log/cron.log 2>&1
    ```

### Option 3: Manual Execution

Run the script manually for testing or one-time cleanup:

```bash
npm run delete-expired-users
```

## Environment Variables

| Variable       | Description                           | Required               |
| -------------- | ------------------------------------- | ---------------------- |
| `CRON_SECRET`  | Secret key to secure the API endpoint | Yes (for API endpoint) |
| `DATABASE_URL` | Database connection string            | Yes                    |

## API Endpoints

### POST `/api/cron/delete-expired-users`

Deletes expired users and returns results.

**Headers:**

```
Authorization: Bearer your-secret-key-here
```

**Response:**

```json
{
  "success": true,
  "message": "Expired users cleanup completed successfully",
  "result": {
    "deletedCount": 5,
    "message": "Successfully deleted 5 users permanently",
    "deletedUsers": [...]
  },
  "stats": {
    "before": { "totalSoftDeleted": 10, "expiredUsers": 5 },
    "after": { "totalSoftDeleted": 5, "expiredUsers": 0 }
  },
  "timestamp": "2024-01-15T02:00:00.000Z"
}
```

### GET `/api/cron/delete-expired-users`

Returns statistics about soft-deleted users.

**Headers:**

```
Authorization: Bearer your-secret-key-here
```

**Response:**

```json
{
	"success": true,
	"stats": {
		"totalSoftDeleted": 5,
		"expiredUsers": 0,
		"retentionPeriod": "12 months"
	},
	"timestamp": "2024-01-15T02:00:00.000Z"
}
```

## Monitoring and Logs

### Vercel Logs

If using Vercel Cron, check the function logs in your Vercel dashboard.

### Manual Cron Logs

If using manual cron, logs will be written to `/var/log/cron.log` (or your specified log file).

### Application Logs

The script logs important information to the console:

- Number of users found for deletion
- Success/failure messages
- Statistics before and after cleanup

## Testing

### Test the API Endpoint

```bash
# Test GET endpoint
curl -X GET https://your-domain.vercel.app/api/cron/delete-expired-users \
  -H "Authorization: Bearer your-secret-key-here"

# Test POST endpoint
curl -X POST https://your-domain.vercel.app/api/cron/delete-expired-users \
  -H "Authorization: Bearer your-secret-key-here"
```

### Test the Script Locally

```bash
npm run delete-expired-users
```

## Security Considerations

1. **Keep the CRON_SECRET secure** - Use a strong, random string
2. **HTTPS only** - Always use HTTPS for API calls in production
3. **IP restrictions** - Consider adding IP restrictions for additional security
4. **Monitoring** - Set up alerts for failed cron job executions

## Troubleshooting

### Common Issues

1. **"Cron secret not configured"**

    - Ensure `CRON_SECRET` is set in your environment variables

2. **"Unauthorized"**

    - Check that the Authorization header matches your `CRON_SECRET`

3. **Database connection errors**

    - Verify `DATABASE_URL` is correctly set
    - Check database connectivity

4. **Script fails to run**
    - Ensure all dependencies are installed
    - Check file permissions for the script
    - Verify the path in crontab is correct

### Debug Mode

To run with more verbose logging, you can modify the script to include additional console.log statements or use a logging library like `winston`.

## Data Retention Policy

- Users are soft-deleted when they request account deletion
- Soft-deleted users are retained for 12 months
- After 12 months, users and all related data are permanently deleted
- This policy ensures compliance with data protection regulations while providing a grace period for account recovery

## Related Files

- `src/services/user.ts` - Contains the `deleteUserAccount` function for soft deletion
- `prisma/schema.prisma` - Database schema with `deletedAt` field
- `src/lib/prisma.ts` - Database client configuration
