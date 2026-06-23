# Deployment — IronLog

## Hosting

- **Platform:** Vercel
- **Auto-deploy:** GitHub Actions (push to `main`)

## Environment Variables

None required. All configuration is hardcoded in `script.js`.

## Build Command

No build step. Files served directly from `src/` directory.

## Deploy

### Automatic
Push to `main` branch → GitHub Actions → Vercel

### Manual
```bash
npm i -g vercel
vercel --prod
```

## Output Directory

`src/` (configured in `vercel.json`)

## Rollback

1. Vercel Dashboard → Deployments → Select previous → Promote
2. OR: `git revert HEAD && git push`
