const config = {
  headerTitle: "james stevens",
  clientLogo: "https://versal.one/assets/images/favicon.png",
  clientName: "james stevens",
  contactDetails: "james@evergreenjunction.com",
  chatPoweredBy: "⚡Powered by evergreen junction",
  PoweredBy: "evergreen junction",
  Language: "EN",
  clientId: "58aa9b93-2a7a-4733-bf29-18ce121f0df7",
  uuid: "139b0afd-3e5e-4743-99c5-9d59b59359b4",
  ServerURL: "https://chatapp.versalence.online",

  // ✨ Launcher Configuration
  launcherType: "circle", // Options: "circle" or "bubble" (overridden if A/B testing enabled)
  launcherLabel: "Need help? Chat with us 👋", // Text label for the launcher
  showLauncherLabel: true, // Show/hide the label
  notificationCount: 0, // Set to 0 to hide badge, or any number to show

  // 🧪 A/B Testing Configuration
  abTesting: {
    enabled: true, // Set to true to enable A/B testing
    analyticsEndpoint: null, // Optional: Set to your analytics endpoint URL (e.g., "https://your-domain.com/analytics")
    // When enabled, users will be randomly assigned to:
    // - Variant A: Bubble icon (💬)
    // - Variant B: Circle icon (logo)
  },
};

window.getConfig = () => config;

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "chat-ui.css";
document.head.appendChild(link);

// Load A/B testing module first
const abTestScript = document.createElement("script");
abTestScript.src = "ab-testing.js";
document.head.appendChild(abTestScript);

const script = document.createElement("script");
script.src = "chatWidget.js";
document.head.appendChild(script);
