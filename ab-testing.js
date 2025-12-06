/**
 * A/B Testing Module for Webchat Widget
 *
 * Tests launcher variants:
 * - Variant A: Bubble icon (chat bubble 💬)
 * - Variant B: Circle icon (company logo)
 *
 * Tracks metrics:
 * - Launcher impressions
 * - Launcher clicks (CTR)
 * - Chat window opens
 * - First message sent (conversion)
 * - Time to first interaction
 */

class WebchatABTesting {
  constructor(config) {
    this.config = config;
    this.testName = 'launcher_icon_test';
    this.storageKey = 'webchat_ab_test';
    this.metricsKey = 'webchat_ab_metrics';
    this.variant = null;
    this.sessionStartTime = Date.now();
    this.launcherImpressionLogged = false;

    // Check if A/B testing is enabled
    this.enabled = config.abTesting?.enabled || false;

    if (this.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize A/B test - assign variant or retrieve existing
   */
  initialize() {
    // Check if user already has a variant assigned
    const stored = this.getStoredVariant();

    if (stored && stored.testName === this.testName) {
      this.variant = stored.variant;
      console.log(`[A/B Test] Returning user - Variant: ${this.variant}`);
    } else {
      // New user - randomly assign variant
      this.variant = Math.random() < 0.5 ? 'A' : 'B';
      this.storeVariant();
      console.log(`[A/B Test] New user - Assigned Variant: ${this.variant}`);
    }

    // Log impression when launcher is rendered
    setTimeout(() => this.logImpression(), 1000);
  }

  /**
   * Get stored variant from localStorage
   */
  getStoredVariant() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('[A/B Test] Error reading stored variant:', e);
      return null;
    }
  }

  /**
   * Store variant assignment in localStorage
   */
  storeVariant() {
    try {
      const data = {
        testName: this.testName,
        variant: this.variant,
        assignedAt: new Date().toISOString(),
        sessionId: this.generateSessionId()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('[A/B Test] Error storing variant:', e);
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get launcher configuration based on variant
   */
  getLauncherConfig() {
    if (!this.enabled) {
      return {
        launcherType: this.config.launcherType,
        showLauncherLabel: this.config.showLauncherLabel,
        launcherLabel: this.config.launcherLabel,
        notificationCount: this.config.notificationCount
      };
    }

    // Variant A: Bubble icon
    if (this.variant === 'A') {
      return {
        launcherType: 'bubble',
        showLauncherLabel: true,
        launcherLabel: this.config.launcherLabel || 'Need help? Chat with us 👋',
        notificationCount: this.config.notificationCount || 0
      };
    }

    // Variant B: Circle (logo)
    return {
      launcherType: 'circle',
      showLauncherLabel: true,
      launcherLabel: this.config.launcherLabel || 'Need help? Chat with us 👋',
      notificationCount: this.config.notificationCount || 0
    };
  }

  /**
   * Log launcher impression
   */
  logImpression() {
    if (!this.enabled || this.launcherImpressionLogged) return;

    this.launcherImpressionLogged = true;
    this.trackEvent('launcher_impression', {
      variant: this.variant,
      timestamp: new Date().toISOString()
    });

    console.log(`[A/B Test] Logged impression for Variant ${this.variant}`);
  }

  /**
   * Log launcher click
   */
  logLauncherClick() {
    if (!this.enabled) return;

    const timeToClick = Date.now() - this.sessionStartTime;

    this.trackEvent('launcher_click', {
      variant: this.variant,
      timeToClick: timeToClick,
      timestamp: new Date().toISOString()
    });

    console.log(`[A/B Test] Launcher clicked - Variant ${this.variant} - Time: ${timeToClick}ms`);
  }

  /**
   * Log chat window open
   */
  logChatOpen() {
    if (!this.enabled) return;

    const timeToOpen = Date.now() - this.sessionStartTime;

    this.trackEvent('chat_open', {
      variant: this.variant,
      timeToOpen: timeToOpen,
      timestamp: new Date().toISOString()
    });

    console.log(`[A/B Test] Chat opened - Variant ${this.variant} - Time: ${timeToOpen}ms`);
  }

  /**
   * Log first message sent (conversion!)
   */
  logFirstMessage() {
    if (!this.enabled) return;

    const timeToFirstMessage = Date.now() - this.sessionStartTime;

    this.trackEvent('first_message', {
      variant: this.variant,
      timeToFirstMessage: timeToFirstMessage,
      timestamp: new Date().toISOString(),
      converted: true
    });

    console.log(`[A/B Test] 🎉 CONVERSION - Variant ${this.variant} - Time: ${timeToFirstMessage}ms`);
  }

  /**
   * Track event and store in localStorage (can be extended to send to analytics service)
   */
  trackEvent(eventName, data) {
    // Store locally
    this.storeMetric(eventName, data);

    // Send to analytics endpoint (if configured)
    if (this.config.abTesting?.analyticsEndpoint) {
      this.sendToAnalytics(eventName, data);
    }
  }

  /**
   * Store metric in localStorage
   */
  storeMetric(eventName, data) {
    try {
      const metrics = this.getStoredMetrics();

      if (!metrics[this.variant]) {
        metrics[this.variant] = [];
      }

      metrics[this.variant].push({
        event: eventName,
        ...data,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      });

      localStorage.setItem(this.metricsKey, JSON.stringify(metrics));
    } catch (e) {
      console.error('[A/B Test] Error storing metric:', e);
    }
  }

  /**
   * Get stored metrics
   */
  getStoredMetrics() {
    try {
      const data = localStorage.getItem(this.metricsKey);
      return data ? JSON.parse(data) : { A: [], B: [] };
    } catch (e) {
      console.error('[A/B Test] Error reading metrics:', e);
      return { A: [], B: [] };
    }
  }

  /**
   * Send metrics to analytics endpoint
   */
  async sendToAnalytics(eventName, data) {
    try {
      const endpoint = this.config.abTesting.analyticsEndpoint;
      const payload = {
        testName: this.testName,
        event: eventName,
        variant: this.variant,
        ...data,
        clientId: this.config.uuid,
        url: window.location.href,
        referrer: document.referrer
      };

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log(`[A/B Test] Sent to analytics: ${eventName}`);
    } catch (e) {
      console.error('[A/B Test] Error sending to analytics:', e);
    }
  }

  /**
   * Get test results summary
   */
  getResults() {
    const metrics = this.getStoredMetrics();

    const summary = {
      A: this.calculateVariantMetrics(metrics.A),
      B: this.calculateVariantMetrics(metrics.B)
    };

    // Calculate winner
    const winnerCTR = summary.A.ctr > summary.B.ctr ? 'A' : 'B';
    const winnerConversion = summary.A.conversionRate > summary.B.conversionRate ? 'A' : 'B';

    return {
      ...summary,
      winner: {
        byCTR: winnerCTR,
        byConversion: winnerConversion,
        recommendation: winnerConversion // Conversion is more important than CTR
      }
    };
  }

  /**
   * Calculate metrics for a variant
   */
  calculateVariantMetrics(events) {
    const impressions = events.filter(e => e.event === 'launcher_impression').length;
    const clicks = events.filter(e => e.event === 'launcher_click').length;
    const opens = events.filter(e => e.event === 'chat_open').length;
    const conversions = events.filter(e => e.event === 'first_message').length;

    const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : 0;
    const conversionRate = impressions > 0 ? (conversions / impressions * 100).toFixed(2) : 0;

    // Average time to first message for converted users
    const conversionEvents = events.filter(e => e.event === 'first_message');
    const avgTimeToConversion = conversionEvents.length > 0
      ? Math.round(conversionEvents.reduce((sum, e) => sum + e.timeToFirstMessage, 0) / conversionEvents.length)
      : 0;

    return {
      impressions,
      clicks,
      opens,
      conversions,
      ctr: parseFloat(ctr),
      conversionRate: parseFloat(conversionRate),
      avgTimeToConversion
    };
  }

  /**
   * Export results as CSV
   */
  exportResultsCSV() {
    const results = this.getResults();

    let csv = 'Variant,Impressions,Clicks,CTR %,Opens,Conversions,Conversion Rate %,Avg Time to Conversion (ms)\n';
    csv += `A (Bubble),${results.A.impressions},${results.A.clicks},${results.A.ctr},${results.A.opens},${results.A.conversions},${results.A.conversionRate},${results.A.avgTimeToConversion}\n`;
    csv += `B (Circle),${results.B.impressions},${results.B.clicks},${results.B.ctr},${results.B.opens},${results.B.conversions},${results.B.conversionRate},${results.B.avgTimeToConversion}\n`;

    return csv;
  }

  /**
   * Clear all test data (use with caution!)
   */
  clearTestData() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.metricsKey);
      console.log('[A/B Test] Test data cleared');
    } catch (e) {
      console.error('[A/B Test] Error clearing test data:', e);
    }
  }
}

// Make it available globally
window.WebchatABTesting = WebchatABTesting;
