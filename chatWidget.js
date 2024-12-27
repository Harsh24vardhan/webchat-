console.log("inside chatWidget");
const initializeChat = (chatWindow, config) => {
  let socket;
  console.log(config);

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
  const closeChatButton = document.querySelector(".close-chat-button");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("chat-send-button");
  const chatMessages = document.querySelector(".chat-messages");
  const chatWindowElement = document.getElementById("chat-window");
  const chatHeader = chatWindowElement.querySelector(".chat-header");
  const clientInfo = chatWindowElement.querySelector(".chat-client-info");
  const clearChatButton = document.querySelector(".clear-chat-button");

  const storedUserDetails =
    JSON.parse(localStorage.getItem(config.clientName)) || {};
  let userToken = storedUserDetails.userToken || "";
  let conversationId = storedUserDetails.conversationId || "";
  let userId = storedUserDetails.userId || "";
  let webchatId = storedUserDetails.webchatId || "";
  let chatStatus = "Bot";
  const chatApi = `${config.ServerURL}`;

  chatWindowElement.style.display = "none";
  clearChatButton.addEventListener("click", function (event) {
    event.stopPropagation();
    chatMessages.innerHTML = "";

    fetch(`https://webchat.botpress.cloud/${webhook}/conversations`, {
      method: "POST",
      headers: {
        "x-user-key": userToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        return fetch(
          `${chatApi}/chat/delete-botpress-messages/${userId}/${uuid}`,
          {
            method: "DELETE",
          }
        );
      })
      .then((chatBackEnd) => {
        if (!chatBackEnd.ok) {
          throw new Error(
            `HTTP error from Chatmate! Status: ${chatBackEnd.status}`
          );
        }
        return chatBackEnd.json();
      })
      .then((chatmateData) => {})
      .catch((error) => {
        console.error("Error clearing messages:", error);
      });
  });

  chatBubble.addEventListener("click", function () {
    chatWindowElement.style.display = "flex";
    closeChatButton.style.display = "block";
    chatBubble.style.display = "none";
  });

  closeChatButton.addEventListener("click", function () {
    chatWindowElement.style.display = "none";
    closeChatButton.style.display = "none";
    chatBubble.style.display = "block";
  });

  chatHeader.addEventListener("click", function (event) {
    if (
      event.target.tagName === "SELECT" ||
      event.target.tagName === "OPTION"
    ) {
      event.stopPropagation();
      return;
    }
    chatHeader.classList.toggle("chat-header-expanded");
    clientInfo.style.display =
      clientInfo.style.display === "block" ? "none" : "block";
    if (chatHeader.classList.contains("chat-header-expanded")) {
      clearChatButton.style.display = "none"; // Hide Clear Chat Button
      const dropdownContainer = document.querySelector(".language-dropdown");
      if (dropdownContainer) dropdownContainer.style.display = "none"; // Hide Dropdown
    } else {
      clearChatButton.style.display = "block"; // Show Clear Chat Button
      const dropdownContainer = document.querySelector(".language-dropdown");
      if (dropdownContainer) dropdownContainer.style.display = "block"; // Show Dropdown
    }
  });

  function initializeChatHeader(config) {
    const chatHeader = document.querySelector(".chat-header");
    if (config.Language && config.Language.includes(",")) {
      const languageOptions = config.Language.split(",");
      const dropdownContainer = document.createElement("div");

      dropdownContainer.classList.add("language-dropdown");
      // dropdownContainer.style.backgroundColor = "rgba(0, 0, 0, 0.05)"; // Subtle background
      dropdownContainer.style.borderRadius = "5px"; // Smooth corners
      dropdownContainer.style.padding = "5px"; // Add padding for better visuals
      // dropdownContainer.style.display = "inline-block"; // Inline styling

      dropdownContainer.classList.add("language-dropdown");
      const dropdownSelect = document.createElement("select");
      languageOptions.forEach((lang) => {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = lang;
        if (lang === "HB") {
          option.style.backgroundImage = "url(https://flagcdn.com/il.svg)";
        } else if (lang === "EN") {
          option.style.backgroundImage = "url(https://flagcdn.com/us.svg)";
        }
        dropdownSelect.appendChild(option);
      });
      dropdownContainer.appendChild(dropdownSelect);
      chatHeader.appendChild(dropdownContainer);
      dropdownSelect.value = "HB";

      const savedLanguage = localStorage.getItem("selectedLanguage") || "HB";
      dropdownSelect.value = savedLanguage;
      dropdownSelect.dispatchEvent(new Event("change"));

      dropdownSelect.addEventListener("change", function () {
        const selectedLanguage = dropdownSelect.value;
        if (selectedLanguage === "HB") {
          chatWindowElement.style.direction = "rtl";
          document.documentElement.lang = "he";
          translateChatToHebrew();
        } else {
          chatWindowElement.style.direction = "ltr";
          document.documentElement.lang = "en";
        }
      });
    }
  }
  initializeChatHeader(config);

  function formatText(text) {
    text = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
    text = text.replace(/~(.*?)~/g, "<del>$1</del>");
    return text;
  }

  const socketScript = document.createElement("script");
  socketScript.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
  socketScript.crossOrigin = "anonymous";
  document.head.appendChild(socketScript);

  function handleMessages(msg) {
    const isUserMessage = msg.senderId.startsWith("user_");
    if (msg?.content?.type === "text") {
      if (!isUserMessage) {
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("incoming-message");
        messageContainer.classList.add("message-container"); // New container for avatar + message
        const avatar = document.createElement("div");
        avatar.classList.add("message-avatar");
        if (config.clientLogo) {
          const logoImg = document.createElement("img");
          logoImg.src = config.clientLogo;
          logoImg.alt = config.clientName || "Bot";
          avatar.appendChild(logoImg);
        } else {
          const initial = document.createElement("span");
          initial.textContent =
            config.clientName?.charAt(0).toUpperCase() || "B";
          avatar.appendChild(initial);
        }
        const textMessage = document.createElement("div");
        textMessage.classList.add("incoming-message");
        const formattedText = formatText(
          msg.content?.data?.text || msg.content?.data?.body
        );
        textMessage.innerHTML = formattedText;
        messageContainer.appendChild(avatar);
        messageContainer.appendChild(textMessage);
        chatMessages.appendChild(messageContainer);
      } else {
        const messageElement = document.createElement("div");
        messageElement.classList.add(
          isUserMessage ? "outgoing-message" : "incoming-message"
        );
        const formattedText = formatText(
          msg.content?.data?.text || msg.content?.data?.body
        );
        messageElement.innerHTML = formattedText;
        chatMessages.appendChild(messageElement);
      }
    } else if (msg?.content?.type === "image") {
      const imageMessage = document.createElement("div");
      imageMessage.classList.add("incoming-message");
      imageMessage.innerHTML = `
                <p>${msg.content?.data?.title || "Image"}</p>
                <img src="${msg.content?.data?.imageUrl}" alt="${
        msg.content?.data?.title || "Image"
      }" style="max-width: 100%; border-radius: 10px;">
            `;
      chatMessages.appendChild(imageMessage);
    } else if (msg?.content?.type === "form") {
      if (msg.content?.data?.formfields) {
        createForm(msg._id, msg.content?.data, chatMessages);
      }
    } else if (msg?.content?.type === "choice") {
      const choiceContainer = document.createElement("div");
      choiceContainer.classList.add("message-container"); // Container for avatar + text
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
      const choiceMessage = document.createElement("div");
      choiceMessage.classList.add("incoming-message");
      choiceMessage.innerHTML = `<p>${formatText(
        msg.content?.data?.text || "Choose an option:"
      )}</p>`;
      choiceContainer.appendChild(avatar);
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
          button.style.borderRadius = "5px";
          button.style.backgroundColor = "#0078d7";
          button.style.color = "white";
          button.style.cursor = "pointer";
          button.addEventListener("click", function () {
            sendChoiceMessage(option.value);
          });
          optionsContainer.appendChild(button);
        });
      } else {
        const selectBox = document.createElement("select");
        selectBox.style.padding = "10px";
        selectBox.style.borderRadius = "5px";
        selectBox.style.border = "1px solid #ddd";
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
        const description = document.createElement("p");
        description.textContent = item.description || "";
        const button = document.createElement("button");
        button.classList.add("carousel-button");
        button.textContent = item.actions[0]?.label || "Action";
        button.addEventListener("click", () => {
          sendChoiceMessage(item.actions[0]?.value);
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
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  socketScript.onload = () => {
    socket = io(chatApi);
    if (userId) {
      socket.on("connect", () => {
        socket.emit("subscribe", userId);
      });
    }
    socket.onAny((event, ...args) => {
      console.log(`Received event: ${event}`, args);
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from the server");
    });
    socket.on("sending message", (msg) => {
      handleMessages(msg); // Using the new function for handling messages
    });

    socket.on("toggle update", (data) => {
      chatStatus = data === "Human" ? "Human" : "Bot";
    });
  };

  async function loadPreviousMessages() {
    try {
      const response = await fetch(
        `${chatApi}/chat/get-botpress-messages/${userId}/${config.uuid}`
      );

      if (response.ok) {
        const data = await response.json();
        data.message?.forEach((msg) => {
          handleMessages(msg); // Using the new function for handling messages
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    } catch (error) {
      console.error("Error loading previous messages: ", error);
    }
  }
  loadPreviousMessages();

  async function sendMessage() {
    const message = chatInput.value.trim(); // Get the message from the input field
    if (!message) return; // Don't send if empty
    const userMessage = document.createElement("p");
    userMessage.classList.add("outgoing-message");
    userMessage.textContent = message;
    chatMessages.appendChild(userMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = "";
    try {
      let payload = {};
      if (webchatId && webchatId !== "") {
        payload = {
          conversation: {
            userId: userId || "",
            conversation_id: conversationId || "",
            userToken: userToken || "",
          },
          message,
        };
      } else {
        payload = {
          conversation: {
            userId: "",
            conversation_id: "",
            userToken: "",
          },
          message,
        };
      }
      if (config?.clientId && config?.clientId !== "") {
        payload.toggle_status = chatStatus;
        payload.clientId = config?.uuid;
        payload.webhookId = config?.clientId;
      } else {
        payload.toggle_status = "Human";
      }
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
      if (response.status === 200) {
        const result = await response.json();
        if (!userId) {
          userId = result?.data?.res?.user_id;
          webchatId = userId;
          conversationId = result?.data?.res?.conversation_id;
          userToken = result?.data?.res?.user_token;
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
          socket.emit("subscribe", userId);
        }
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("An error occurred while sending the message:", error);
    }
  }

  async function sendChoiceMessage(choice) {
    const userMessage = document.createElement("p");
    userMessage.classList.add("outgoing-message");
    userMessage.textContent = choice;
    chatMessages.appendChild(userMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
      }
    } catch (error) {
      console.error("Error sending choice:", error);
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
                <div class="icon">📝</div>
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
        const response = await fetch(
          `${chatApi}/wc-webhook/recieve-webchat-message/${config.uuid}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
            }),
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

function loadChatBubble() {
  const chatContainer = document.createElement("div");
  chatContainer.id = "chat-window";
  document.body.appendChild(chatContainer);
  const chatBubble = document.createElement("div");
  chatBubble.id = "chat-bubble";
  document.body.appendChild(chatBubble);
  chatContainer.innerHTML = `
          <div class="chat-header">
          <img class="client-logo" src="" alt="Client Logo">
          <span class="chat-header-title">
              Versalence Chat 
          </span>
          <button class="clear-chat-button">
              <img class="refresh-ico" src="" style="max-width: 70%;" />
              <span class="tooltip-text">Clear Chat</span>
          </button>
          </div>
          <div class="chat-client-info">
              <img class="client-logo" src="" alt="Client Logo">
              <b><div class="client-name"></div></b>
              <div class="contact-details"></div>
          </div>
          <div class="chat-messages"></div>
          <div class="chat-input-container">
              <div class="input-area">
                  <input type="text" id="chat-input" placeholder="Type a message...">
                  <button id="chat-send-button">
                      Send &nbsp;&nbsp;  
                      <img class="send-button" src="" alt="Send Icon">
                  </button>
              </div>
              <div class="chat-powered">⚡Powered by Versalence AI</div>
          </div>
          <button class="close-chat-button" title="Close Chat" style="display:none;">🗙</button>
      `;
  const config = getConfig();
  const clientLogos = chatContainer.querySelectorAll(".client-logo");
  clientLogos.forEach((logo) => {
    logo.src = config.clientLogo;
  });

  let fsURL = config.ServerURL.replace(/^https?:\/\/([^\.]+)\./, "https://fs.");

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

loadChatBubble();
