# Recovery — IronLog

## Accounts Required

| Service | Purpose |
|---|---|
| GitHub | Source control |
| Vercel | Hosting |

## Restore Steps

### 1. Clone Repository
```bash
git clone https://github.com/keerthanswarup00-bot/workout-tracker.git
cd workout-tracker
```

### 2. Install Dev Dependencies
```bash
npm install
```

### 3. Verify
```bash
npm run lint
```

### 4. Deploy
```bash
vercel --prod
```

## Critical Note

**All user data is in browser localStorage.** There is no server-side backup. Users who clear browser data will lose their workout history. Implement data export/backup before migrating users.
