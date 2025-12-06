const initializeChat = (chatWindow, config) => {
  let socket;
  let socketReady = false;
  let firstMessageSent = false;
  let unreadMessageCount = 0;
  let isChatOpen = false;

  const headerTitle = chatWindow.querySelector(".chat-header-title");
  const clientLogo = chatWindow.querySelector(".client-logo");
  const clientName = chatWindow.querySelector(".client-name");
  const contactDetails = chatWindow.querySelector(".contact-details");
  const poweredBy = chatWindow.querySelector(".chat-powered");

  headerTitle.innerText = config.headerTitle;
  clientLogo.src = config.clientLogo;
  clientName.innerText = `${config.PoweredBy}`;
  contactDetails.innerText = `${config.contactDetails}`;
  poweredBy.innerText = config.chatPoweredBy;
  uuid = config.uuid;
  webhook = config.clientId;

  const chatBubble = document.getElementById("chat-bubble");
  const launcherWrapper = document.getElementById("chat-launcher-wrapper");
  const closeChatButton = document.querySelector(".close-chat-button");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("chat-send-button");
  const chatMessages = document.querySelector(".chat-messages");
  const chatWindowElement = document.getElementById("chat-window");
  const chatHeader = chatWindowElement.querySelector(".chat-header");
  const clientInfo = chatWindowElement.querySelector(".chat-client-info");
  const clearChatButton = document.querySelector(".clear-chat-button");
  const inputmessage = document.querySelector("#input-area .input-message");

  const urlParams = new URLSearchParams(window.location.search);
  const isEmbedded = urlParams.get("embed") === "true";

  const storedUserDetails =
    JSON.parse(localStorage.getItem(config.clientName)) || {};
  let userToken = storedUserDetails.userToken || "";
  let conversationId = storedUserDetails.conversationId || "";
  let userId = storedUserDetails.userId || "";
  let webchatId = storedUserDetails.webchatId || "";

  // ✨ Capture external_id from localStorage
  let externalId = "";
  try {
    const externalIdValue = localStorage.getItem("external_id");
    if (externalIdValue && externalIdValue !== "not-provided") {
      externalId = externalIdValue;
      console.log("External ID captured:", externalId);
    }
  } catch (error) {
    console.error("Error reading external_id from localStorage:", error);
  }

  let chatStatus = "Bot";
  const chatApi = `https://chat.versalence.info/webchat/v2`;
  console.log("Chat App API EndPoint URL : ", chatApi);

  chatMessages.innerHTML = `<div class="welcome-panel" id="welcome-panel">
        <img src="${config.clientLogo}" alt="Client Logo" class="welcome-logo">
        <h2 class="welcome-client-name">${config.PoweredBy}</h2>
        <p class="welcome-contact-details">${config.contactDetails}</p>
    </div>`;

  const socketScript = document.createElement("script");
  socketScript.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
  socketScript.crossOrigin = "anonymous";
  document.head.appendChild(socketScript);

  if (isEmbedded) {
    document.body.classList.add("chat-embedded-body");
    chatWindowElement.classList.add("chat-embedded");
    chatWindowElement.style.display = "flex";
    if (launcherWrapper) launcherWrapper.style.display = "none";
    closeChatButton.style.display = "none";
    isChatOpen = true;
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    loadPreviousMessages();
  }

  chatBubble.addEventListener("click", function () {
    // 🧪 Track launcher click for A/B testing
    if (window.__webchatABTest) {
      window.__webchatABTest.logLauncherClick();
    }

    chatWindowElement.style.display = "flex";
    if (launcherWrapper) launcherWrapper.style.display = "none";
    isChatOpen = true;

    // Clear unread messages when chat is opened
    unreadMessageCount = 0;
    updateNotificationBadge();

    // 🧪 Track chat open for A/B testing
    if (window.__webchatABTest) {
      window.__webchatABTest.logChatOpen();
    }

    setTimeout(() => {
      scrollToBottom();
    }, 100);
    loadPreviousMessages();
  });

  closeChatButton.addEventListener("click", function (e) {
    e.stopPropagation();
    chatWindowElement.style.display = "none";
    if (launcherWrapper) launcherWrapper.style.display = "flex";
    isChatOpen = false;
  });

  chatHeader.addEventListener("click", function (event) {
    if (
      event.target.tagName === "SELECT" ||
      event.target.tagName === "OPTION"
    ) {
      event.stopPropagation();
      return;
    }
    // Don't toggle when clicking buttons
    if (
      event.target.closest(".close-chat-button") ||
      event.target.closest(".clear-chat-button")
    ) {
      return;
    }
    chatHeader.classList.toggle("chat-header-expanded");
    clientInfo.style.display =
      clientInfo.style.display === "block" ? "none" : "block";
    if (chatHeader.classList.contains("chat-header-expanded")) {
      clearChatButton.style.display = "none";
      if (closeChatButton) closeChatButton.style.display = "none";
      const dropdownContainer = document.querySelector(".language-dropdown");
      if (dropdownContainer) dropdownContainer.style.display = "none";
    } else {
      clearChatButton.style.display = "flex";
      if (closeChatButton && !isEmbedded)
        closeChatButton.style.display = "flex";
      const dropdownContainer = document.querySelector(".language-dropdown");
      if (dropdownContainer) dropdownContainer.style.display = "block";
    }
  });

  socketScript.onload = () => {
    console.log("chat app url in socket : ", chatApi);
    const websocapi = chatApi.replace("/webchat/v2", "");
    socket = io(websocapi);
    console.log("User id on socket load", userId);
    if (userId) {
      socket.on("connect", () => {
        socket.emit("subscribe", userId);
        socketReady = true;
        console.log("User Id from Socket ", userId);
      });
    }
    socket.onAny((event, ...args) => {
      console.log(`Received event: ${event}`, args);
      if (event === "typing started") {
        console.log("Typing started event received:", args);
        showTypingIndicator();
      } else if (event === "typing stopped") {
        console.log("Typing stopped event received:", args);
        hideTypingIndicator();
      }
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from the server");
    });
    socket.on("sending message", (msg) => {
      hideTypingIndicator();
      handleMessages(msg);
    });

    socket.on("toggle update", (data) => {
      chatStatus = data === "Human" ? "Human" : "Bot";
    });
  };

  function hideWelcomePanel() {
    const welcomePanel = document.getElementById("welcome-panel");
    if (welcomePanel) {
      welcomePanel.style.display = "none";
    }
  }

  function disableChatInput() {
    chatInput.disabled = true;
    sendButton.disabled = true;
    inputmessage.placeholder = "Please wait...";
    chatInput.style.opacity = "0.6";
  }
  //hjd

  function enableChatInput() {
    chatInput.disabled = false;
    sendButton.disabled = false;
    inputmessage.placeholder = "Type a message...";
    chatInput.style.opacity = "1";
  }

  function initializeChatHeader(config) {
    const chatHeader = document.querySelector(".chat-header");

    if (config.Language.includes(",")) {
      const languageOptions = config.Language.split(",");
      const dropdownContainer = document.createElement("div");
      dropdownContainer.classList.add("language-dropdown");
      dropdownContainer.style.borderRadius = "5px";
      dropdownContainer.style.padding = "5px";

      const dropdownSelect = document.createElement("select");
      languageOptions.forEach((lang) => {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = lang === "EN" ? "English" : "Hebrew";
        dropdownSelect.appendChild(option);
      });

      dropdownContainer.appendChild(dropdownSelect);
      chatHeader.appendChild(dropdownContainer);

      const savedLanguage =
        localStorage.getItem("selectedLanguage") || languageOptions[0];
      dropdownSelect.value = savedLanguage;
      applyLanguageSettings(savedLanguage);

      dropdownSelect.addEventListener("change", function () {
        const selectedLanguage = dropdownSelect.value;
        applyLanguageSettings(selectedLanguage);
        localStorage.setItem("selectedLanguage", selectedLanguage);
      });
    } else {
      const defaultLanguage = config.Language;
      applyLanguageSettings(defaultLanguage);
      localStorage.setItem("selectedLanguage", defaultLanguage);
    }
  }

  function applyLanguageSettings(language) {
    const chatWindowElement = document.getElementById("chat-window");
    const inputMessage = document.querySelector("#input-area .input-message");

    if (language === "HB") {
      chatWindowElement.style.direction = "rtl";
      document.documentElement.lang = "he";
      inputMessage.placeholder = "×”×§×œ×“ ××ª ×”×”×•×“×¢×” ×©×œ×š...";
    } else {
      chatWindowElement.style.direction = "ltr";
      document.documentElement.lang = "en";
      inputMessage.placeholder = "Type a message...";
    }
  }

  initializeChatHeader(config);

  if (!isEmbedded) {
    chatWindowElement.style.display = "none";
  }

  clearChatButton.addEventListener("click", function (event) {
    event.stopPropagation();

    firstMessageSent = false;

    chatMessages.innerHTML = `<div class="welcome-panel" id="welcome-panel">
        <img src="${config.clientLogo}" alt="Client Logo" class="welcome-logo">
        <h2 class="welcome-client-name">${config.PoweredBy}</h2>
        <p class="welcome-contact-details">${config.contactDetails}</p>
    </div>`;
    scrollToBottom();

    fetch(`${chatApi}/chat/delete-botpress-messages/${userId}/${uuid}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Calling restart");
        // const stored =
        //   JSON.parse(localStorage.getItem(config.clientName)) || {};
        // stored.conversationId = "";
        // stored.userToken = "";
        // stored.userId = "";
        // stored.webchatId = "";
        // localStorage.setItem(config.clientName, JSON.stringify(stored));
        // conversationId = "";
        // userToken = "";
        // userId = "";
        // webchatId = "";
        console.log("Cleared local conversation data");
        window.__didInitialFetch = false;
      })
      .then((response) => {
        return response;
      })
      .then((data) => {
        if (userId) socket.emit("subscribe", userId);
        return ensureSession();
      })
      .catch((error) => {
        console.error("Error clearing messages:", error);
      });
  });

  function formatAsList(text) {
    const lines = text.split("\n");
    const listItems = [];
    let isList = false;
    let currentListType = "";
    const messageClass = "message-container";

    lines.forEach((line) => {
      const bulletMatch = line.match(/^\s*[-*â€¢]\s+(.*)/);
      const numberedMatch = line.match(/^\s*\d+(\.|\))\s+(.*)/);

      if (bulletMatch) {
        if (!isList || currentListType !== "ul") {
          if (isList) listItems.push(`</${currentListType}>`);
          listItems.push(`<ul>`);
          currentListType = "ul";
          isList = true;
        }
        listItems.push(`<li>${bulletMatch[1]}</li>`);
      } else if (numberedMatch) {
        if (!isList || currentListType !== "ol") {
          if (isList) listItems.push(`</${currentListType}>`);
          listItems.push(`<ol>`);
          currentListType = "ol";
          isList = true;
        }
        listItems.push(`<li>${numberedMatch[2]}</li>`);
      } else if (line.trim() === "" && isList) {
        listItems.push(`</${currentListType}>`);
        isList = false;
        currentListType = "";
      } else {
        if (isList) {
          listItems.push(`</${currentListType}>`);
          isList = false;
          currentListType = "";
        }
        if (line.trim()) {
          listItems.push(`<p>${line.trim()}</p>`);
        }
      }
    });

    if (isList) {
      listItems.push(`</${currentListType}>`);
    }

    return `<div class="${messageClass}">${listItems.join("")}</div>`;
  }

  function formatText(text) {
    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
    text = text.replace(
      /\[(.*?)\]\((https?:\/\/[^\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    text = text.replace(
      /\[(.*?)\]\(mailto:(.*?)\)/g,
      '<a href="mailto:$2">$1</a>'
    );
    text = text.replace(/\[(.*?)\]\(tel:(.*?)\)/g, '<a href="tel:$2">$1</a>');
    return formatAsList(text);
  }

  function createAvatar() {
    const avatar = document.createElement("div");
    avatar.classList.add("message-avatar");

    if (config.clientLogo) {
      const logoImg = document.createElement("img");
      logoImg.src = config.clientLogo;
      logoImg.alt = config.clientName || "Bot";
      avatar.appendChild(logoImg);
    } else {
      const initial = document.createElement("span");
      initial.textContent = config.clientName?.charAt(0).toUpperCase() || "B";
      avatar.appendChild(initial);
    }

    return avatar;
  }

  function isUserSideMessage(msg) {
    const from = msg?.content?.data?.from;
    if (typeof from === "string") {
      const f = from.toLowerCase();
      if (f === "bot") return false;
      if (f === "user") return true;
    }
    if (msg?.recipientId?.startsWith?.("user_")) return false;
    if (msg?.senderId?.startsWith?.("user_")) return true;
    return false;
  }

  function showTypingIndicator() {
    const typingContainer = document.getElementById("typing-container");
    const chatInputContainer = document.querySelector(".chat-input-container");

    if (typingContainer) {
      typingContainer.style.display = "block";
      if (chatInputContainer) {
        const inputContainerHeight = chatInputContainer.offsetHeight || 0;
        typingContainer.style.bottom = `${inputContainerHeight + 10}px`;
      }
      console.log("Showing typing indicator");
      scrollToBottom();
    }
  }

  function hideTypingIndicator() {
    const typingContainer = document.getElementById("typing-container");
    if (typingContainer) {
      typingContainer.style.display = "none";
      console.log("Hiding typing indicator");
    }
  }

  function updateNotificationBadge() {
    const chatBubble = document.getElementById("chat-bubble");
    if (!chatBubble) return;

    // Remove existing badge if any
    const existingBadge = chatBubble.querySelector(".chat-notification-badge");
    if (existingBadge) {
      existingBadge.remove();
    }

    // Add new badge if there are unread messages
    if (unreadMessageCount > 0) {
      const badge = document.createElement("span");
      badge.className = "chat-notification-badge";
      badge.textContent = unreadMessageCount > 99 ? "99+" : unreadMessageCount;
      chatBubble.appendChild(badge);
    }
  }

  function handleMessages(msg) {
    const isUserMessage = isUserSideMessage(msg);

    // Increment unread count for incoming bot messages when chat is closed
    if (!isUserMessage && !isChatOpen) {
      unreadMessageCount++;
      updateNotificationBadge();
    }

    if (msg?.content?.type === "text") {
      console.log("Text message detected:", msg);
      const messageText = msg.content?.data?.text || msg.content?.data?.body;
      if (!messageText || messageText.trim() === "") {
        console.warn("Empty message detected, ignoring...");
        return;
      }
      if (!isUserMessage) {
        const row = document.createElement("div");
        row.classList.add("message-row", "incoming");

        if (!window.__activeIncomingAvatar) {
          window.__activeIncomingAvatar = createAvatar();
        } else if (window.__activeIncomingAvatar.parentElement) {
          window.__activeIncomingAvatar.parentElement.removeChild(
            window.__activeIncomingAvatar
          );
        }
        window.__activeIncomingAvatar.classList.remove("drop-in");
        void window.__activeIncomingAvatar.offsetWidth;
        window.__activeIncomingAvatar.classList.add("drop-in");
        row.appendChild(window.__activeIncomingAvatar);

        const bubble = document.createElement("div");
        bubble.classList.add("incoming-message", "message-container");
        const formattedText = formatText(
          msg.content?.data?.text || msg.content?.data?.body
        );
        bubble.innerHTML = formattedText;
        row.appendChild(bubble);

        chatMessages.appendChild(row);
      } else {
        const messageElement = document.createElement("div");
        messageElement.classList.add("outgoing-message");
        const formattedText =
          msg.content?.data?.text || msg.content?.data?.body;
        messageElement.innerHTML = formattedText;
        chatMessages.appendChild(messageElement);
      }
    } else if (msg?.content?.type === "image") {
      if (!isUserMessage) {
        const row = document.createElement("div");
        row.classList.add("message-row", "incoming");

        if (!window.__activeIncomingAvatar) {
          window.__activeIncomingAvatar = createAvatar();
        } else if (window.__activeIncomingAvatar.parentElement) {
          window.__activeIncomingAvatar.parentElement.removeChild(
            window.__activeIncomingAvatar
          );
        }
        window.__activeIncomingAvatar.classList.remove("drop-in");
        void window.__activeIncomingAvatar.offsetWidth;
        window.__activeIncomingAvatar.classList.add("drop-in");
        row.appendChild(window.__activeIncomingAvatar);

        const imageMessage = document.createElement("div");
        imageMessage.classList.add("incoming-message", "message-container");
        imageMessage.innerHTML += `
                    <p>${msg.content?.data?.title || ""}</p>
                    <img src="${msg.content?.data?.imageUrl}" alt="${
          msg.content?.data?.title || "Image"
        }" style="max-width: 100%; border-radius: 10px;">
                `;
        row.appendChild(imageMessage);
        chatMessages.appendChild(row);
      } else {
        const imageMessage = document.createElement("div");
        imageMessage.classList.add("outgoing-message");
        imageMessage.innerHTML += `
                    <p>${msg.content?.data?.title || ""}</p>
                    <img src="${msg.content?.data?.imageUrl}" alt="${
          msg.content?.data?.title || "Image"
        }" style="max-width: 100%; border-radius: 10px;">
                `;
        chatMessages.appendChild(imageMessage);
      }
    } else if (msg?.content?.type === "card") {
      if (!isUserMessage) {
        const row = document.createElement("div");
        row.classList.add("message-row", "incoming");

        if (!window.__activeIncomingAvatar) {
          window.__activeIncomingAvatar = createAvatar();
        } else if (window.__activeIncomingAvatar.parentElement) {
          window.__activeIncomingAvatar.parentElement.removeChild(
            window.__activeIncomingAvatar
          );
        }
        window.__activeIncomingAvatar.classList.remove("drop-in");
        void window.__activeIncomingAvatar.offsetWidth;
        window.__activeIncomingAvatar.classList.add("drop-in");
        row.appendChild(window.__activeIncomingAvatar);

        const cardMessage = document.createElement("div");
        cardMessage.classList.add("incoming-message", "message-container");
        cardMessage.innerHTML += `
                    <div class="card-container">
                        <img src="${msg.content?.data?.imageUrl}" 
                             alt="${msg.content?.data?.title || "Image"}" 
                             class="card-image">
                        <p class="card-title">${
                          msg.content?.data?.title || ""
                        }</p>
                        <hr class="card-divider">
                        <p class="card-subtitle">${
                          msg.content?.data?.subtitle || ""
                        }</p>
                        <div class="card-buttons">
                            ${msg.content?.data?.actions
                              ?.map(
                                (action) => `
                                <button onclick="${
                                  action.action === "url"
                                    ? `window.open('${action.value}', '_blank')`
                                    : `handlePostback('${action.value}')`
                                }" 
                                    class="card-button">
                                    ${action.label}
                                </button>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                `;
        row.appendChild(cardMessage);
        chatMessages.appendChild(row);
      } else {
        const cardMessage = document.createElement("div");
        cardMessage.classList.add("outgoing-message");
        cardMessage.innerHTML += `
                    <div class="card-container">
                        <img src="${msg.content?.data?.imageUrl}" 
                             alt="${msg.content?.data?.title || "Image"}" 
                             class="card-image">
                        <p class="card-title">${
                          msg.content?.data?.title || ""
                        }</p>
                        <hr class="card-divider">
                        <p class="card-subtitle">${
                          msg.content?.data?.subtitle || ""
                        }</p>
                        <div class="card-buttons">
                            ${msg.content?.data?.actions
                              ?.map(
                                (action) => `
                                <button onclick="${
                                  action.action === "url"
                                    ? `window.open('${action.value}', '_blank')`
                                    : `handlePostback('${action.value}')`
                                }" 
                                    class="card-button">
                                    ${action.label}
                                </button>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                `;
        chatMessages.appendChild(cardMessage);
      }
    } else if (msg?.content?.type === "video") {
      const videoUrl = msg.content?.data?.videoUrl;
      if (!isUserMessage) {
        const row = document.createElement("div");
        row.classList.add("message-row", "incoming");

        if (!window.__activeIncomingAvatar) {
          window.__activeIncomingAvatar = createAvatar();
        } else if (window.__activeIncomingAvatar.parentElement) {
          window.__activeIncomingAvatar.parentElement.removeChild(
            window.__activeIncomingAvatar
          );
        }
        window.__activeIncomingAvatar.classList.remove("drop-in");
        void window.__activeIncomingAvatar.offsetWidth;
        window.__activeIncomingAvatar.classList.add("drop-in");
        row.appendChild(window.__activeIncomingAvatar);

        const videoMessage = document.createElement("div");
        videoMessage.classList.add("incoming-message", "message-container");
        if (videoUrl) {
          videoMessage.innerHTML += `
                        <p>${msg.content?.data?.title || "Video message"}</p>
                        <video controls style="max-width: 100%; border-radius: 10px;">
                            <source src="${videoUrl}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    `;
        } else {
          console.error("Invalid video URL:", videoUrl);
          videoMessage.innerHTML += `<p>Failed to load video.</p>`;
        }
        row.appendChild(videoMessage);
        chatMessages.appendChild(row);
      } else {
        const videoMessage = document.createElement("div");
        videoMessage.classList.add("outgoing-message");
        if (videoUrl) {
          videoMessage.innerHTML += `
                        <p>${msg.content?.data?.title || "Video message"}</p>
                        <video controls style="max-width: 100%; border-radius: 10px;">
                            <source src="${videoUrl}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    `;
        } else {
          console.error("Invalid video URL:", videoUrl);
          videoMessage.innerHTML += `<p>Failed to load video.</p>`;
        }
        chatMessages.appendChild(videoMessage);
      }
    } else if (msg?.content?.type === "audio") {
      const audioUrl = msg.content?.data?.audioUrl;
      if (!isUserMessage) {
        const row = document.createElement("div");
        row.classList.add("message-row", "incoming");

        if (!window.__activeIncomingAvatar) {
          window.__activeIncomingAvatar = createAvatar();
        } else if (window.__activeIncomingAvatar.parentElement) {
          window.__activeIncomingAvatar.parentElement.removeChild(
            window.__activeIncomingAvatar
          );
        }
        window.__activeIncomingAvatar.classList.remove("drop-in");
        void window.__activeIncomingAvatar.offsetWidth;
        window.__activeIncomingAvatar.classList.add("drop-in");
        row.appendChild(window.__activeIncomingAvatar);

        const audioMessage = document.createElement("div");
        audioMessage.classList.add("incoming-message", "message-container");
        if (audioUrl) {
          const audioElement = document.createElement("audio");
          audioElement.controls = true;
          audioElement.style.maxWidth = "100%";
          audioElement.style.borderRadius = "10px";

          const sourceElement = document.createElement("source");
          sourceElement.src = audioUrl;
          sourceElement.type = "audio/mp3";

          audioElement.appendChild(sourceElement);

          audioElement.onerror = () => {
            console.error("Error loading audio: ", audioUrl);
            audioMessage.innerHTML += `<p>Failed to load audio.</p>`;
          };

          audioMessage.innerHTML += `<p>${
            msg.content?.data?.title || "Audio message"
          }</p>`;
          audioMessage.appendChild(audioElement);
        } else {
          console.error("Audio URL is invalid:", audioUrl);
          audioMessage.innerHTML += `<p>Invalid audio URL</p>`;
        }
        row.appendChild(audioMessage);
        chatMessages.appendChild(row);
      } else {
        const audioMessage = document.createElement("div");
        audioMessage.classList.add("outgoing-message");
        if (audioUrl) {
          const audioElement = document.createElement("audio");
          audioElement.controls = true;
          audioElement.style.maxWidth = "100%";
          audioElement.style.borderRadius = "10px";
          const sourceElement = document.createElement("source");
          sourceElement.src = audioUrl;
          sourceElement.type = "audio/mp3";
          audioElement.appendChild(sourceElement);
          audioMessage.innerHTML += `<p>${
            msg.content?.data?.title || "Audio message"
          }</p>`;
          audioMessage.appendChild(audioElement);
        } else {
          audioMessage.innerHTML += `<p>Invalid audio URL</p>`;
        }
        chatMessages.appendChild(audioMessage);
      }
    } else if (msg?.content?.type === "location") {
      const { latitude, longitude, address, title } = msg.content?.data || {};
      if (!isUserMessage) {
        const row = document.createElement("div");
        row.classList.add("message-row", "incoming");

        if (!window.__activeIncomingAvatar) {
          window.__activeIncomingAvatar = createAvatar();
        } else if (window.__activeIncomingAvatar.parentElement) {
          window.__activeIncomingAvatar.parentElement.removeChild(
            window.__activeIncomingAvatar
          );
        }
        window.__activeIncomingAvatar.classList.remove("drop-in");
        void window.__activeIncomingAvatar.offsetWidth;
        window.__activeIncomingAvatar.classList.add("drop-in");
        row.appendChild(window.__activeIncomingAvatar);

        const locationMessage = document.createElement("div");
        locationMessage.classList.add("incoming-message", "message-container");
        if (latitude && longitude) {
          locationMessage.innerHTML += `
                        <p>${title || "Location"}</p>
                        <p>${address || "Address not available"}</p>
                        <iframe 
                            src="https://www.google.com/maps?q=${latitude},${longitude}&hl=es;z=14&output=embed" 
                            width="100%" height="250" style="border-radius: 10px;">
                        </iframe>
                    `;
        } else {
          locationMessage.innerHTML += `<p>Location data is missing or invalid.</p>`;
        }
        row.appendChild(locationMessage);
        chatMessages.appendChild(row);
      } else {
        const locationMessage = document.createElement("div");
        locationMessage.classList.add("outgoing-message");
        if (latitude && longitude) {
          locationMessage.innerHTML += `
                        <p>${title || "Location"}</p>
                        <p>${address || "Address not available"}</p>
                        <iframe 
                            src="https://www.google.com/maps?q=${latitude},${longitude}&hl=es;z=14&output=embed" 
                            width="100%" height="250" style="border-radius: 10px;">
                        </iframe>
                    `;
        } else {
          locationMessage.innerHTML += `<p>Location data is missing or invalid.</p>`;
        }
        chatMessages.appendChild(locationMessage);
      }
    } else if (msg?.content?.type === "form") {
      if (msg.content?.data?.formfields) {
        createForm(msg._id, msg.content?.data, chatMessages);
      }
    } else if (msg?.content?.type === "choice") {
      const choiceContainer = document.createElement("div");
      choiceContainer.classList.add("message-container");

      const choiceMessage = document.createElement("div");
      choiceMessage.classList.add("incoming-message");
      choiceMessage.innerHTML = `<p>${formatText(
        msg.content?.data?.text || "Choose an option:"
      )}</p>`;
      choiceContainer.appendChild(choiceMessage);

      chatMessages.appendChild(choiceContainer);
      const optionsContainer = document.createElement("div");
      optionsContainer.style.marginBottom = "20px";

      if (msg.content?.data?.options.length <= 3) {
        optionsContainer.style.display = "flex";
        optionsContainer.style.gap = "10px";
        msg.content?.data?.options.forEach((option) => {
          const button = document.createElement("button");
          button.textContent = option.label;
          button.setAttribute("data-value", option.value);
          button.style.padding = "10px 15px";
          button.style.border = "none";
          button.style.borderRadius = "10px";
          button.style.background =
            "linear-gradient(135deg, #8B9DC3 0%, #9CADC7 100%)";
          button.style.color = "white";
          button.style.cursor = "pointer";
          button.style.fontWeight = "600";
          button.style.transition = "all 0.2s ease";
          button.addEventListener("click", function () {
            const userMessage = document.createElement("div");
            userMessage.classList.add("outgoing-message");
            userMessage.textContent = option.label;
            chatMessages.appendChild(userMessage);
            sendChoiceMessage(option.value);
          });
          button.addEventListener("mouseenter", function () {
            button.style.opacity = "0.9";
          });
          button.addEventListener("mouseleave", function () {
            button.style.opacity = "1";
          });
          optionsContainer.appendChild(button);
        });
      } else {
        const selectBox = document.createElement("select");
        selectBox.style.padding = "10px";
        selectBox.style.borderRadius = "10px";
        selectBox.style.border = "2px solid #e2e8f0";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectBox.appendChild(defaultOption);
        msg.content?.data?.options.forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          selectBox.appendChild(optionElement);
        });
        selectBox.addEventListener("change", function () {
          if (selectBox.value) {
            const selectedLabel =
              selectBox.options[selectBox.selectedIndex].text;
            const userMessage = document.createElement("div");
            userMessage.classList.add("outgoing-message");
            userMessage.textContent = selectedLabel;
            chatMessages.appendChild(userMessage);
            sendChoiceMessage(selectBox.value);
          }
        });
        optionsContainer.appendChild(selectBox);
      }
      chatMessages.appendChild(optionsContainer);
    } else if (msg?.content?.type === "carousel") {
      const carouselWrapper = document.createElement("div");
      carouselWrapper.classList.add("carousel-wrapper");

      const leftArrow = document.createElement("button");
      leftArrow.classList.add("carousel-arrow", "left-arrow");
      leftArrow.textContent = "<";
      const rightArrow = document.createElement("button");
      rightArrow.classList.add("carousel-arrow", "right-arrow");
      rightArrow.textContent = ">";

      const carouselContainer = document.createElement("div");
      carouselContainer.classList.add("carousel-container");

      msg.content?.data?.items.forEach((item) => {
        const carouselItem = document.createElement("div");
        carouselItem.classList.add("carousel-item");

        const image = document.createElement("img");
        image.src = item.imageUrl;
        image.alt = item.title;
        const title = document.createElement("h3");
        title.textContent = item.title;
        const subtitle = document.createElement("h5");
        subtitle.textContent = item.subtitle;
        const description = document.createElement("p");
        description.textContent = item.description || "";

        const button = document.createElement("button");
        button.classList.add("carousel-button");
        button.textContent = item.actions[0]?.label || "Action";
        button.addEventListener("click", () => {
          const actionValue = item.actions[0]?.value;
          const actionType = item.actions[0]?.action;

          if (actionType === "url" && actionValue) {
            window.open(actionValue, "_blank");
          } else {
            sendChoiceMessage(actionValue);
          }
        });
        carouselItem.appendChild(image);
        carouselItem.appendChild(title);
        carouselItem.appendChild(description);
        carouselItem.appendChild(button);
        carouselContainer.appendChild(carouselItem);
      });

      carouselWrapper.appendChild(leftArrow);
      carouselWrapper.appendChild(carouselContainer);
      carouselWrapper.appendChild(rightArrow);
      chatMessages.appendChild(carouselWrapper);

      let currentIndex = 0;
      const totalItems = msg.content?.data?.items.length;

      leftArrow.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--;
          carouselContainer.style.transform = `translateX(-${
            currentIndex * 100
          }%)`;
        }
      });

      rightArrow.addEventListener("click", () => {
        if (currentIndex < totalItems - 1) {
          currentIndex++;
          carouselContainer.style.transform = `translateX(-${
            currentIndex * 100
          }%)`;
        }
      });
    } else {
      console.warn("Unhandled message type:", msg?.content?.type);
    }
    scrollToBottom();
  }

  function handlePostback(value) {
    console.log("Postback action triggered:", value);
    fetch("/postback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: value }),
    })
      .then((response) => response.json())
      .then((data) => console.log("Postback response:", data))
      .catch((error) => console.error("Error handling postback:", error));
  }

  function scrollToBottom() {
    const chatMessages = document.querySelector(".chat-messages");
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
      console.log("Scrolled to bottom: ", chatMessages.scrollHeight);
    }
  }

  async function loadPreviousMessages() {
    try {
      console.log("Loading Prev Messages");
      const response = await fetch(
        `${chatApi}/chat/get-botpress-messages/${userId}/${config.uuid}`
      );
      console.log("Checking Response", response);
      if (response.ok) {
        const data = await response.json();
        if (data.message && data.message.length > 0) {
          hideWelcomePanel();
          firstMessageSent = true;
          chatMessages.innerHTML = "";
          data.message.forEach((msg) => {
            handleMessages(msg);
          });
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        }
      } else {
        console.log("Failed Loading Previous Messages", response.ok);
        sendMessage();
      }
    } catch (error) {
      console.error("Error loading previous messages: ", error);
    }
  }

  async function fetchAndAppendMissedMessages() {
    try {
      if (!userId || !uuid) return;
      const response = await fetch(
        `${chatApi}/chat/get-botpress-messages/${userId}/${uuid}`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (!data?.message || !Array.isArray(data.message)) return;
      data.message.forEach((msg) => {
        const isUserMessage = isUserSideMessage(msg);
        if (!isUserMessage) {
          handleMessages(msg);
        }
      });
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    } catch (err) {
      console.warn("Failed to fetch missed messages", err);
    }
  }

  async function ensureSession() {
    // if (userId && conversationId && userToken) return;
    // try {
    //   const payload = {
    //     conversation: {
    //       userId: userId || "",
    //       conversation_id: conversationId || "",
    //       userToken: userToken || "",
    //     },
    //     message: "",
    //   };
    //   if (config?.clientId && config?.clientId !== "") {
    //     payload.toggle_status = chatStatus;
    //     payload.clientId = config?.uuid;
    //     payload.webhookId = config?.clientId;
    //   } else {
    //     payload.toggle_status = "Human";
    //   }
    //   console.log("In Send Message Payload 11", payload);
    //   const resp = await fetch(
    //     `${chatApi}/wc-webhook/recieve-webchat-message/${config?.uuid}`,
    //     {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify(payload),
    //     }
    //   );
    //   if (!resp.ok) return;
    //   const result = await resp.json();
    //   const resRoot = result?.data?.res || result?.data || result;
    //   const nextUserId = resRoot?.user_id || userId;
    //   const nextConversationId = resRoot?.conversation_id || conversationId;
    //   const nextUserToken = resRoot?.user_token || userToken;
    //   let changed = false;
    //   if (nextUserId && nextUserId !== userId) {
    //     userId = nextUserId;
    //     webchatId = nextUserId;
    //     changed = true;
    //   }
    //   if (nextConversationId && nextConversationId !== conversationId) {
    //     conversationId = nextConversationId;
    //     changed = true;
    //   }
    //   if (nextUserToken && nextUserToken !== userToken) {
    //     userToken = nextUserToken;
    //     changed = true;
    //   }
    //   if (changed) {
    //     localStorage.setItem(
    //       config.clientName,
    //       JSON.stringify({ userId, webchatId, conversationId, userToken, uuid })
    //     );
    //     if (socket) socket.emit("subscribe", userId);
    //   }
    // } catch (e) {
    //   console.warn("ensureSession failed", e);
    // } finally {
    //   enableChatInput();
    // }
  }

  async function sendMessage() {
    const message = chatInput.value.trim();
    console.log("Message is: ", message);

    if (message) {
      if (message.trim() === "") {
        console.warn("Empty message detected, ignoring...");
      } else {
        if (!firstMessageSent) {
          hideWelcomePanel();
          firstMessageSent = true;

          // 🧪 Track first message (conversion!) for A/B testing
          if (window.__webchatABTest) {
            window.__webchatABTest.logFirstMessage();
          }
        }

        const userMessage = document.createElement("p");
        userMessage.classList.add("outgoing-message");
        userMessage.textContent = message;
        chatMessages.appendChild(userMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = "";
        console.log("In Send Message with Message");

        showTypingIndicator();
      }
    }
    try {
      if (!userId || !conversationId || !userToken) {
        await ensureSession();
      }
      let payload = {};
      payload = {
        conversation: {
          userId: userId || "",
          conversation_id: conversationId || "",
          userToken: userToken || "",
        },
        message,
      };
      console.log("In Send Message Payload 1", payload);
      if (config?.clientId && config?.clientId !== "") {
        payload.toggle_status = chatStatus;
        payload.clientId = config?.uuid;
        payload.webhookId = config?.clientId;
      } else {
        payload.toggle_status = "Human";
      }

      // ✨ Add external_id if it exists
      if (externalId) {
        payload.external_id = externalId;
      }

      console.log("In Send Message Payload 2", payload);
      const response = await fetch(
        `${chatApi}/wc-webhook/recieve-webchat-message/${config?.uuid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      console.log("Receive Webchat ", response.status);
      if (response.status === 200) {
        const result = await response.json();
        console.log("In Send Message in Response");

        const resRoot = result?.data?.res || result?.data || result;

        const nextUserId = resRoot?.user_id || userId;
        const nextConversationId = resRoot?.conversation_id || conversationId;
        const nextUserToken = resRoot?.user_token || userToken;

        let shouldPersist = false;

        if (!userId && nextUserId) {
          userId = nextUserId;
          webchatId = nextUserId;
          shouldPersist = true;
          if (socket) socket.emit("subscribe", userId);
        }

        if (nextConversationId && nextConversationId !== conversationId) {
          conversationId = nextConversationId;
          shouldPersist = true;
        }
        if (nextUserToken && nextUserToken !== userToken) {
          userToken = nextUserToken;
          shouldPersist = true;
        }

        if (shouldPersist) {
          localStorage.setItem(
            config.clientName,
            JSON.stringify({
              userId,
              webchatId,
              conversationId,
              userToken,
              uuid,
            })
          );
        }

        if (shouldPersist && !window.__didInitialFetch) {
          try {
            await new Promise((r) => setTimeout(r, 400));
            await fetchAndAppendMissedMessages();
            window.__didInitialFetch = true;
          } catch {}
        }
      } else {
        console.error("Failed to send message");
        hideTypingIndicator();
      }
    } catch (error) {
      console.error("An error occurred while sending the message:", error);
      hideTypingIndicator();
    }
  }

  async function sendChoiceMessage(choice) {
    if (!socketReady) {
      console.warn("Socket not ready â€“ choice ignored");
      return;
    }
    if (!userId || !conversationId || !userToken) {
      await ensureSession();
    }
    const userMessage = document.createElement("p");
    userMessage.classList.add("outgoing-message");
    userMessage.textContent = choice;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    showTypingIndicator();

    try {
      const payload = {
        conversation: {
          userId: userId || "",
          conversation_id: conversationId || "",
          userToken: userToken || "",
        },
        message: choice,
        toggle_status: chatStatus,
        clientId: config.uuid,
        webhookId: config.clientId,
      };

      // ✨ Add external_id if it exists
      if (externalId) {
        payload.external_id = externalId;
      }
      console.log("In Send Message Payload 3", payload);
      const response = await fetch(
        `${chatApi}/wc-webhook/recieve-webchat-message/${config.uuid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
      } else {
        console.error("Failed to send choice.");
        hideTypingIndicator();
      }
    } catch (error) {
      console.error("Error sending choice:", error);
      hideTypingIndicator();
    }
  }

  function createForm(payload, chatMessages) {
    let fields, description;
    if (typeof payload === "string") {
      try {
        const parsed = JSON.parse(payload);
        fields = parsed.formfields;
        description = parsed.description || "Please fill out this form.";
      } catch {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(payload, "text/xml");
        fields = Array.from(xmlDoc.getElementsByTagName("field")).map(
          (field) => ({
            id: field.getAttribute("id"),
            label: field.getAttribute("label"),
            type: field.getAttribute("type"),
            placeholder: field.getAttribute("placeholder"),
            value: field.getAttribute("value"),
            required: field.getAttribute("required") === "true",
          })
        );
        const descNode = xmlDoc.getElementsByTagName("description")[0];
        description = descNode
          ? descNode.textContent
          : "Please fill out this form.";
      }
    } else if (typeof payload === "object") {
      fields = payload.formfields;
      description = payload.description || "Please fill out this form.";
    } else {
      throw new Error("Unsupported payload format");
    }
    const formContainer = document.createElement("div");
    formContainer.classList.add("form-container");

    formContainer.innerHTML = `
            <div class="form-header">
                <div class="icon">ðŸ“‹</div>
            </div>
            <p class="form-description">${description}</p>
        `;

    const form = document.createElement("form");
    form.classList.add("chat-form");
    fields.forEach((field) => {
      const fieldContainer = document.createElement("div");
      fieldContainer.classList.add("form-field");

      fieldContainer.innerHTML = `
                <label for="${field.id}">${field.label}</label>
                <input 
                    type="${field.type}" 
                    id="${field.id}" 
                    name="${field.id}" 
                    placeholder="${field.placeholder || ""}" 
                    value="${field.value || ""}" 
                    ${field.required ? "required" : ""} 
                />
            `;
      form.appendChild(fieldContainer);
    });
    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Submit";
    form.appendChild(submitButton);
    form.onsubmit = async function (event) {
      event.preventDefault();
      const formData = {};
      fields.forEach((field) => {
        formData[field.id] = form.elements[field.id].value;
      });
      try {
        const formPayload = {
          conversation: {
            userId: userId || "",
            conversation_id: conversationId || "",
            userToken: userToken || "",
          },
          message: {
            type: "formdata",
            data: {
              formfields: formData,
              form_sms_id: payload.msgId,
              formstatus: true,
            },
          },
          toggle_status: "Human",
          clientId: config.uuid,
          webhookId: config.clientId,
        };

        // ✨ Add external_id if it exists
        if (externalId) {
          formPayload.external_id = externalId;
        }
        console.log("In Send Message Payload 4");
        const response = await fetch(
          `${chatApi}/wc-webhook/recieve-webchat-message/${config.uuid}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formPayload),
          }
        );
        if (response.ok) {
          const successMessage = document.createElement("p");
          successMessage.classList.add("outgoing-message");
          successMessage.innerText = "Form Submitted Successfully!";
          chatMessages.appendChild(successMessage);
        } else {
          alert("Failed to submit the form.");
        }
      } catch (error) {
        alert("An error occurred. Please try again.");
      }
    };
    formContainer.appendChild(form);
    chatMessages.appendChild(formContainer);
  }

  sendButton.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
};

function loadedChat() {
  const chatContainer = document.createElement("div");
  chatContainer.id = "chat-window";
  document.body.appendChild(chatContainer);

  // ✨ Initialize A/B Testing
  const config = getConfig();
  let abTest = null;
  let launcherConfig = config;

  if (window.WebchatABTesting && config.abTesting?.enabled) {
    abTest = new window.WebchatABTesting(config);
    // Get variant-specific configuration
    const variantConfig = abTest.getLauncherConfig();
    launcherConfig = { ...config, ...variantConfig };
    console.log('[Webchat] A/B Testing enabled - Using variant config:', variantConfig);
  }

  // Make abTest available globally for event tracking
  window.__webchatABTest = abTest;

  // ✨ Create the new launcher structure with label and badge
  const launcherWrapper = document.createElement("div");
  launcherWrapper.id = "chat-launcher-wrapper";
  launcherWrapper.classList.add("chat-launcher-wrapper");

  // Add launcher type class (from A/B test variant or config)
  if (launcherConfig.launcherType === "bubble") {
    launcherWrapper.classList.add("launcher-type-bubble");
  } else {
    launcherWrapper.classList.add("launcher-type-circle");
  }

  // Create label if enabled
  if (launcherConfig.showLauncherLabel && launcherConfig.launcherLabel) {
    const launcherLabel = document.createElement("div");
    launcherLabel.className = "chat-launcher-label";
    launcherLabel.textContent = launcherConfig.launcherLabel;
    launcherWrapper.appendChild(launcherLabel);
  }

  // Create the chat bubble
  const chatBubble = document.createElement("div");
  chatBubble.id = "chat-bubble";

  // Note: Notification badge is created dynamically by updateNotificationBadge()
  // when unread messages arrive

  launcherWrapper.appendChild(chatBubble);
  document.body.appendChild(launcherWrapper);

  chatContainer.innerHTML = `
           <div class="chat-header">
        <img class="client-logo" src="" alt="Client Logo">
        <span class="chat-header-title">
            Versalence Chat 
        </span>
        <button class="clear-chat-button" title="Restart Chat">
            <span class="refresh-icon">🔄</span>
            <img class="refresh-ico" src="" style="display: none;" />
        </button>
        <button class="close-chat-button" title="Close Chat">
            <span class="close-icon">✕</span>
        </button>
        </div>
        <div class="chat-client-info">
            <img class="client-logo" src="" alt="Client Logo">
            <b><div class="client-name"></div></b>
            <div class="contact-details"></div>
        </div>
        <div id="typing-container" style="display: none;">
        
            <div class="typing-indicator" aria-label="Assistant is typing">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>
        <div class="chat-messages">
        </div>
        <div class="chat-input-container">
            <div class="input-area" id="input-area">
                <input type="text" id="chat-input" class="input-message" placeholder="Type a message...">
                <button id="chat-send-button" title="Send message">
                    <svg class="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
                        <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <img class="send-button" src="" alt="Send" style="display: none;">
                </button>
            </div>
            <div class="chat-powered">⚡Powered by Versalence AI</div>
        </div>
    `;

  const clientLogos = chatContainer.querySelectorAll(".client-logo");
  clientLogos.forEach((logo) => {
    logo.src = config.clientLogo;
  });

  let fsURL = config.fsURL || "https://fs.versalence.online";

  const refreshico = chatContainer.querySelectorAll(".refresh-ico");
  refreshico.forEach((ico) => {
    ico.src = `${fsURL}/chatconfig/refresh.png`;
  });

  const sendButtons = chatContainer.querySelectorAll(".send-button");
  sendButtons.forEach((send) => {
    send.src = `${fsURL}/chatconfig/send-mail.png`;
  });

  initializeChat(chatContainer, config);
}

loadedChat();
