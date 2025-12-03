if (window.pendingConfig) {
  console.log("Ã¢Å¡Â¡ Using previously saved config...");
  window.setupChatLogic(window.pendingConfig);
  window.pendingConfig = null;
}

// Draggable resizer
const resizer = document.getElementById("resizer");
const chatPane = document.getElementById("chat-pane");
let isResizing = false;

resizer?.addEventListener("mousedown", (e) => {
  isResizing = true;
  document.body.style.cursor = "ew-resize";
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;
  const newWidth = e.clientX - chatPane.getBoundingClientRect().left;
  chatPane.style.width = newWidth + "px";
});

document.addEventListener("mouseup", () => {
  isResizing = false;
  document.body.style.cursor = "default";
});

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const cfg = typeof window.getConfig === "function" ? window.getConfig() : {};

  document
    .getElementById("chatInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessageToBot();
      }
    });
  // Ã°Å¸Å’Ë† Set top bar theming via CSS variables
  if (cfg.topBarBackground)
    root.style.setProperty("--chat-header-bg", cfg.topBarBackground);
  if (cfg.topBarHover)
    root.style.setProperty("--chat-header-hover-bg", cfg.topBarHover);
  if (cfg.topBarButtonHover)
    root.style.setProperty("--chat-header-btn-hover", cfg.topBarButtonHover);

  // Ã°Å¸â€™Â¬ Handle collapsed mode via query param
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "collapsed") {
    root.classList.add("chat-collapsed");
  }

  // Ã°Å¸Å½â€º Button interactions
  const expandBtn = document.getElementById("expand-toggle");
  const closeBtn = document.querySelector(".close-chat-button");
  const restartBtn = document.querySelector(".restart-chat-button");

  expandBtn?.addEventListener("click", () => {
    const root = document.documentElement;
    const isExpanded = root.classList.contains("chat-modal");

    if (!isExpanded) {
      root.classList.remove("chat-collapsed"); // Ã°Å¸Â§Â¹ Remove collapsed state
      root.classList.add("chat-modal"); // Ã°Å¸Å½Â¯ Apply full modal state
      window.parent.postMessage(
        { type: "resize-iframe", mode: "fullscreen" },
        "*"
      );
    } else {
      root.classList.remove("chat-modal"); // Ã°Å¸Â§Â¹ Remove modal view
      root.classList.add("chat-collapsed"); // Ã°Å¸Å½Â¯ Restore compact view
      window.parent.postMessage({ type: "resize-iframe", mode: "widget" }, "*");
    }
  });

  closeBtn?.addEventListener("click", () => {
    window.parent.postMessage({ type: "close-chat" }, "*");
  });

  restartBtn?.addEventListener("click", function () {
    // Add visual rotation feedback
    this.style.transition = "transform 0.5s ease";
    this.style.transform = "rotate(360deg)";

    // Trigger clear chat
    document.querySelector(".clear-chat-button")?.click();

    // Reset rotation
    setTimeout(() => {
      this.style.transform = "rotate(0deg)";
    }, 500);
  });
});

// 5. Expand toggle from parent (iframe)
window.addEventListener("message", (event) => {
  if (event.data.type === "expand-chat") {
    document.documentElement.classList.toggle("chat-collapsed");
  }
});

// File Management
const fileUploadBtn = document.getElementById("file-upload-button");
const fileInput = document.getElementById("file-input");

fileUploadBtn?.addEventListener("click", () => fileInput.click());

fileInput?.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const bubble = document.createElement("div");
    bubble.textContent = `Ã°Å¸â€œÅ½ ${file.name}`;
    bubble.style.marginBottom = "10px";
    bubble.style.background = "#fff3cd";
    bubble.style.padding = "10px";
    bubble.style.borderRadius = "10px";
    bubble.style.border = "1px solid #ffeeba";
    document.getElementById("chatMessages").appendChild(bubble);
  }
});

// Voice Input
const micBtn = document.getElementById("mic-button");
const recDot = document.getElementById("recording-indicator");
const wave = document.getElementById("voice-wave");
let recognition;
let isRecognizing = false;
let stopTimeout;

if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isRecognizing = true;
    micBtn.style.display = "none";
    recDot.style.display = "inline-block";
    wave.style.display = "block";
  };

  recognition.onspeechend = () => {
    recognition.stop();
  };

  recognition.onend = () => {
    isRecognizing = false;
    micBtn.style.display = "inline-block";
    recDot.style.display = "none";
    wave.style.display = "none";
  };

  recognition.onerror = (event) => {
    console.error("Speech error:", event.error);
    recognition.stop();
  };

  recognition.onresult = (event) => {
    clearTimeout(stopTimeout);
    let interim = "",
      final = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += transcript;
      else interim += transcript;
    }
    document.getElementById("chatInput").value = final + interim;
    stopTimeout = setTimeout(() => {
      if (isRecognizing) recognition.stop();
    }, 2000);
  };
}

micBtn?.addEventListener("click", () => {
  if (!recognition) return;
  if (!isRecognizing) recognition.start();
  else recognition.stop();
});

// Pane toggling
function togglePane(side) {
  const chatPane = document.getElementById("chat-pane");
  const dynamicPane = document.getElementById("dynamic-pane");
  const toggleChatBtn = document.getElementById("toggle-chat");
  const toggleDynamicBtn = document.getElementById("toggle-dynamic");

  if (side === "chat") {
    const isNowHidden = chatPane.classList.toggle("hidden");
    toggleChatBtn.textContent = isNowHidden ? "Ã°Å¸Â¡Âº" : "Ã°Å¸Â¡Â¸";

    // Optional: expand dynamic pane when chat is hidden
    if (isNowHidden) {
      dynamicPane.classList.add("expanded");
    } else {
      dynamicPane.classList.remove("expanded");
    }
  } else if (side === "dynamic") {
    const isNowHidden = dynamicPane.classList.toggle("hidden");
    toggleDynamicBtn.textContent = isNowHidden ? "Ã°Å¸Â¡Â¸" : "Ã°Å¸Â¡Âº";

    // Optional: expand chat pane when dynamic is hidden
    if (isNowHidden) {
      chatPane.classList.add("expanded");
    } else {
      chatPane.classList.remove("expanded");
    }
  }
}
