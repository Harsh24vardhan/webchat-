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
};

window.getConfig = () => config;

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "chat-ui.css";
document.head.appendChild(link);
//hjgjh

const script = document.createElement("script");
script.src = "chatWidget.js";
document.head.appendChild(script);
