# Security — IronLog

## Overview

IronLog is a client-side only application. All data is stored in browser `localStorage`. No data is transmitted over the network except for:
- Chart.js library loaded from CDN
- Google Fonts

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| localStorage data loss | Medium | No cloud backup; user must export manually |
| CDN compromise | Low | Consider adding SRI integrity to script tags |
| No authentication | Low | No user data stored on server |
| XSS via CDN | Low | Minimal external dependencies |

## Checklist

- [x] No API keys in code
- [x] No passwords in code
- [x] No tokens committed
- [ ] SRI integrity on CDN scripts
- [ ] Content Security Policy
- [ ] localStorage data export feature

## Recommendations

1. Add SRI integrity hashes to CDN script tags
2. Implement data export/backup feature
3. Consider adding Content Security Policy meta tag
