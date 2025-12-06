# 🧪 A/B Testing Guide - Webchat Widget

## Overview

The webchat widget now includes built-in A/B testing to help you optimize launcher performance. Test which launcher icon drives more conversions: **Bubble Icon (💬)** vs **Circle Icon (Company Logo)**.

## Quick Start

### 1. Enable A/B Testing

Edit `config.js`:

```javascript
const config = {
  // ... other settings ...

  // 🧪 A/B Testing Configuration
  abTesting: {
    enabled: true, // Set to true to enable A/B testing
    analyticsEndpoint: null, // Optional: Your analytics endpoint
  },
};
```

### 2. Deploy Your Widget

Once enabled, users will be randomly assigned to one of two variants:
- **Variant A**: Bubble icon (💬) - Standard chat bubble
- **Variant B**: Circle icon (⭕) - Your company logo

Each user's variant is stored in localStorage, ensuring consistent experience across sessions.

## What Gets Tracked

The A/B testing system automatically tracks these key metrics:

| Metric | Description | When Tracked |
|--------|-------------|--------------|
| **Impressions** | Launcher viewed | When page loads with widget visible |
| **Clicks** | Launcher clicked | When user clicks the launcher |
| **Chat Opens** | Chat window opened | When chat window displays |
| **Conversions** | First message sent | When user sends their first message |
| **Time to Conversion** | Speed to first message | Duration from impression to conversion |

## Viewing Results

### Option 1: Dashboard (Recommended)

1. Open `ab-test-dashboard.html` in your browser
2. View real-time metrics for both variants
3. See which variant performs better
4. Export results as CSV

**Dashboard Features:**
- ✅ Visual comparison of both variants
- ✅ Click-through rates (CTR)
- ✅ Conversion rates
- ✅ Average time to conversion
- ✅ Automatic winner detection
- ✅ CSV export for further analysis

### Option 2: Browser Console

```javascript
// View current results
const results = window.__webchatABTest.getResults();
console.log(results);

// Export to CSV
const csv = window.__webchatABTest.exportResultsCSV();
console.log(csv);

// View raw metrics
const metrics = window.__webchatABTest.getStoredMetrics();
console.log(metrics);
```

### Option 3: localStorage

Open DevTools → Application → Local Storage → Your Domain

Look for:
- `webchat_ab_test` - User's variant assignment
- `webchat_ab_metrics` - Collected metrics

## Understanding Results

### Key Metrics Explained

**1. Click-Through Rate (CTR)**
```
CTR = (Clicks / Impressions) × 100
```
- Measures how many people click the launcher
- Higher is better
- Industry average: 3-8%

**2. Conversion Rate**
```
Conversion Rate = (Conversions / Impressions) × 100
```
- Measures how many people send a message
- **This is your most important metric**
- Higher is better
- Industry average: 1-4%

**3. Average Time to Conversion**
- How quickly users convert after seeing the launcher
- Lower is better
- Indicates urgency and clarity

### Sample Results

```javascript
{
  A: {
    impressions: 247,
    clicks: 89,
    ctr: 36.03,           // Variant A has better CTR
    conversions: 34,
    conversionRate: 13.77, // Variant A has better conversion
    avgTimeToConversion: 4821
  },
  B: {
    impressions: 253,
    clicks: 67,
    ctr: 26.48,
    conversions: 28,
    conversionRate: 11.07,
    avgTimeToConversion: 6234
  },
  winner: {
    byCTR: 'A',
    byConversion: 'A',     // Follow this recommendation
    recommendation: 'A'    // Use Variant A (Bubble)
  }
}
```

**Interpretation:** Variant A (Bubble icon) performs better with 13.77% conversion vs 11.07%, and converts faster (4.8s vs 6.2s). **Recommendation: Use bubble icon.**

## Statistical Significance

For reliable results, aim for:
- ✅ **Minimum 100 impressions per variant** (200 total)
- ✅ **Minimum 10 conversions per variant** (20 total)
- ✅ **Test duration: 1-2 weeks** (to account for different traffic patterns)

### Sample Size Calculator

```javascript
// Rule of thumb: Need ~400 total impressions for 95% confidence
// Formula: n = (Z² × p × (1-p)) / E²
// Where:
// - Z = 1.96 (95% confidence)
// - p = 0.05 (expected conversion rate)
// - E = 0.02 (margin of error)
```

## Testing Tips

### Best Practices

1. **Don't peek too early** - Wait for at least 100 impressions per variant
2. **Test one variable at a time** - Only test launcher icon, keep label consistent
3. **Run for full week** - Capture weekday and weekend traffic
4. **Segment by device** - Mobile vs desktop may have different preferences
5. **Consider your brand** - Established brands may benefit from logo (circle)

### Common Mistakes

❌ **Stopping test too early** - Need statistical significance
❌ **Testing during special events** - Holiday traffic isn't representative
❌ **Changing test mid-way** - Invalidates results
❌ **Only looking at CTR** - Conversion rate is what matters!

## Advanced: Analytics Integration

Send results to your analytics platform:

```javascript
const config = {
  abTesting: {
    enabled: true,
    analyticsEndpoint: 'https://your-domain.com/api/analytics',
  },
};
```

### Endpoint Requirements

Your endpoint should accept POST requests with this payload:

```javascript
{
  "testName": "launcher_icon_test",
  "event": "first_message",        // launcher_impression | launcher_click | chat_open | first_message
  "variant": "A",                   // A or B
  "timestamp": "2025-12-06T10:30:00Z",
  "timeToClick": 2341,              // milliseconds (if applicable)
  "timeToOpen": 2456,               // milliseconds (if applicable)
  "timeToFirstMessage": 4821,       // milliseconds (if applicable)
  "converted": true,                // boolean (for first_message events)
  "clientId": "your-uuid",
  "url": "https://yoursite.com/page",
  "referrer": "https://google.com",
  "userAgent": "Mozilla/5.0...",
  "screenWidth": 1920,
  "screenHeight": 1080
}
```

### Example: Google Analytics 4

```javascript
// In ab-testing.js, modify sendToAnalytics():
async sendToAnalytics(eventName, data) {
  // Send to GA4
  gtag('event', eventName, {
    test_name: this.testName,
    variant: this.variant,
    conversion_value: data.converted ? 1 : 0,
    time_to_conversion: data.timeToFirstMessage || 0
  });

  // Also send to your custom endpoint
  // ... existing code ...
}
```

## Disabling A/B Testing

Once you've determined a winner:

```javascript
const config = {
  abTesting: {
    enabled: false,  // Disable A/B testing
  },

  // Use the winning variant
  launcherType: "bubble",  // or "circle" based on results
};
```

## Troubleshooting

### No Data Showing

**Problem:** Dashboard shows "No Data Yet"

**Solutions:**
1. Ensure `abTesting.enabled: true` in config.js
2. Check browser console for errors
3. Verify ab-testing.js is loaded (check Network tab)
4. Test in incognito mode to see fresh variant assignment
5. Manually check localStorage for `webchat_ab_metrics`

### Same Variant Every Time

**Problem:** Always getting same variant (A or B)

**Solution:** Clear localStorage or use incognito mode
```javascript
// In console:
localStorage.removeItem('webchat_ab_test');
location.reload();
```

### Events Not Tracking

**Problem:** Clicks/conversions not incrementing

**Solutions:**
1. Check console for `[A/B Test]` log messages
2. Verify `window.__webchatABTest` exists
3. Ensure widget is fully loaded before interactions
4. Check if ad blockers are interfering

## API Reference

### WebchatABTesting Class

```javascript
const abTest = new WebchatABTesting(config);

// Get variant configuration
const variantConfig = abTest.getLauncherConfig();

// Manual event tracking
abTest.logImpression();
abTest.logLauncherClick();
abTest.logChatOpen();
abTest.logFirstMessage();

// Get results
const results = abTest.getResults();

// Export as CSV
const csv = abTest.exportResultsCSV();

// Clear all data
abTest.clearTestData();
```

## FAQ

**Q: How long should I run the test?**
A: At least 1-2 weeks with minimum 100 impressions per variant.

**Q: Can I test more than 2 variants?**
A: Currently supports 2 variants (A/B). For multivariate testing, modify the code.

**Q: Will this affect SEO?**
A: No, it's purely client-side JavaScript.

**Q: Can I test on mobile separately?**
A: Yes! Export the data and filter by screenWidth in your analysis.

**Q: What if results are 50/50?**
A: Choose based on brand strategy. Established brands → Circle, New brands → Bubble.

**Q: Does this work with the notification badge?**
A: Yes! The badge is independent of variant assignment.

**Q: Can I force a specific variant for testing?**
A: Yes, in console:
```javascript
localStorage.setItem('webchat_ab_test', JSON.stringify({
  testName: 'launcher_icon_test',
  variant: 'A',  // or 'B'
  assignedAt: new Date().toISOString()
}));
location.reload();
```

## Support

For issues or questions:
1. Check the browser console for errors
2. Review this documentation
3. Contact support with:
   - Config settings
   - Console logs
   - Dashboard screenshot
   - Test duration and sample size

---

**Happy Testing! 🚀**

May the best variant win! 🏆
