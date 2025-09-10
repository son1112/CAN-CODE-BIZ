# Portfolio Data Directory

This directory contains the automatically generated portfolio data used by the CAN-CODE-BIZ marketing website.

## Files

- **`portfolio.json`** - Main portfolio metrics file used by the website
- **`portfolio.json.prev`** - Previous version for change detection (auto-generated)

## Data Source

Portfolio data is automatically fetched and updated daily via GitHub Actions from the Project Universe Strategic Intelligence Platform.

## Security

All data in this directory contains only aggregated, public-safe metrics:
- ✅ Total project counts and aggregated statistics
- ✅ Technology distribution percentages  
- ✅ Portfolio health indicators
- ❌ **NO individual project names, paths, or sensitive details**

## Update Process

1. **Daily automation** (6 AM UTC) via `.github/workflows/update-portfolio.yml`
2. **Manual trigger** available via GitHub Actions UI
3. **Fallback data** used if Project Universe is unavailable
4. **Automatic commits** when data changes detected

## Data Schema

```json
{
  "timestamp": "ISO-8601 timestamp",
  "portfolio": {
    "scale": {
      "projectCount": "number",
      "linesOfCode": "number", 
      "avgHealthScore": "number (0-10)",
      "techStackCount": "number"
    },
    "quality": {
      "excellentProjects": "number",
      "goodProjects": "number", 
      "needsAttentionProjects": "number",
      "productionReadyRate": "percentage string"
    },
    "technologies": {
      "languages": { "Language": "percentage" },
      "frameworks": { "Framework": "percentage" }
    },
    "trends": {
      "growth": "trend description",
      "healthTrend": "improving|stable|declining",
      "modernizationRate": "percentage"
    }
  },
  "metadata": {
    "dataPrivacyLevel": "aggregated-marketing-safe|fallback-static",
    "updateFrequency": "daily",
    "privacyNote": "Security disclaimer",
    "lastScanCompleted": "ISO-8601 timestamp",
    "version": "semantic version"
  }
}
```

## Usage in Marketing Site

The portfolio data is consumed by the can-code.dev website to transform static marketing claims into live proof of capabilities:

- **Static**: "17+ specialized agents" → **Dynamic**: "128+ active projects"
- **Static**: "MongoDB architecture" → **Dynamic**: "147M+ lines of code analyzed"  
- **Static**: "Production system" → **Dynamic**: "8.2/10 health score, 77% production ready"

This creates credible, proof-based marketing backed by real portfolio metrics.

---

**Security Classification**: Public-safe aggregated data only
**Last Updated**: 2025-09-09
**Automation**: GitHub Actions daily pipeline