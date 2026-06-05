# TrustLens Deployment Guide

## Pre-Launch Checklist

- [ ] Seed 50 products: `python -m backend.scripts.seed_products`
- [ ] Run full test suite: `python -m pytest backend/tests/ -v` (49+ passing)
- [ ] Frontend build clean: `cd frontend && npm run build`
- [ ] Verify `/sitemap.xml` has 60+ URLs
- [ ] Verify `/robots.txt` disallows /admin
- [ ] Check for "fake review" language: `grep -ri "fake review" .`
- [ ] Verify admin dashboard at `/admin` works
- [ ] Test search flow: home → search → product page
- [ ] Verify Authenticity Score displays correctly (never "fake")

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/trustlens
REDIS_URL=redis://host:6379
YOUTUBE_API_KEY=...
RAINFOREST_API_KEY=...
GROQ_API_KEY=...
ANTHROPIC_API_KEY=...
ENVIRONMENT=production
ALLOWED_ORIGINS=https://trustlens.in,https://www.trustlens.in
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.trustlens.in
```

## Deployment Steps

### Backend (Railway)
1. Push code to GitHub
2. Create Railway project
3. Add PostgreSQL + Redis add-ons
4. Set environment variables
5. Deploy: `railway up`
6. Verify health: `curl https://api.trustlens.in/api/v1/health`

### Frontend (Vercel)
1. Connect GitHub repo
2. Set `NEXT_PUBLIC_API_URL` env var
3. Deploy: `vercel deploy --prod`
4. Verify: `https://trustlens.in`

## Post-Launch

- Monitor Sentry for errors
- Track UptimeRobot alerts
- Monitor admin dashboard at `/admin/stats`
- Set up cron job for refresh_scheduler (every 6 hours)
- Prepare Product Hunt launch post
- Plan social media rollout

## Rollback

If critical issue:
```bash
git revert [commit-hash]
git push
# Re-deploy Vercel + Railway
```

## Support

Admin dashboard: https://trustlens.in/admin
Health check: https://api.trustlens.in/api/v1/health
Support email: (TBD)
