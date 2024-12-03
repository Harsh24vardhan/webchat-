const chatApi = 'https://chatbackenddev.versal.one'

const company = window?.vcxWebChat;


let webchat_id = localStorage.getItem("user_id");
let user_id = webchat_id;
let conversation_id = localStorage.getItem("conversation_id");
let user_token = localStorage.getItem("user_token");

console.log(
  webchat_id,
  "       ",
  user_id,
  "       ",
  conversation_id,
  "       ",
  user_token
);

const socket = io(`${chatApi}`);

// Connect to the Socket.IO server
if (webchat_id) {
  socket.on("connect", () => {
    console.log("Connected to the server");
    socket.emit("subscribe", webchat_id); // Joining the 'plugin' room
  });
}

socket.on("disconnect", () => {
  console.log("Disconnected from socket server");
});

async function fetchPreviousMessages() {
  try {
    // /8082f57c-1d2c-4b0e-aa18-86dc95222137
    const response = await fetch(
      `${chatApi}/chat/get-botpress-messages/${webchat_id}/${company?.uuid}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(response);

    if (response.status === 200) {
      const messages = await response.json();
      console.log(messages);
      return messages?.message || []; // Return fetched messages
    } else {
      console.log("Failed to fetch previous messages");
      return [];
    }
  } catch (error) {
    console.log("An error occurred while fetching previous messages:", error);
    return [];
  }
}

/************************/
// Define the function to render the form
/************************/

// function createForm(msgId, fields, chatBody) {
//   // Create form container
//   const formContainer = document.createElement("div");
//   formContainer.style.cssText = `
//     width: 100%;
//     max-width: 70%;
//     background-color: #f9fafb;
//     padding: 16px;
//     border-radius: 8px;
//     box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
//   `;

//   // Header and icon
//   formContainer.innerHTML = `
//     <div class="form-header" style="width: 100%; text-align: center; margin-bottom: 16px;">
//       <div class="icon" style="background-color: #4ade80; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 8px;">👤</div>
//     </div>
//     <p class="form-description" style="font-size: 0.9rem; color: #374151; margin-bottom: 16px; text-align: center;">Welcome to our LiveChat! Please fill the form and submit.</p>
//   `;

//   // Create the form
//   const form = document.createElement("form");
//   form.style.cssText = `width: 100%; display: flex; flex-direction: column; gap: 8px;`;

//   fields.forEach((field) => {
//     // Label and input
//     form.innerHTML += `
//       <div style="width: 100%; display:flex; flex-direction: column; margin-bottom: 12px;">
//         <label for="${
//           field.id
//         }" style=" font-size: 0.85rem; color: #374151; font-weight: 500;">${field.label}
//           <span style="color: #ef4444;">*</span></label>
//         <div style="width: 100%; padding-right: 10px">
//           <input
//             type="${field.type}"
//             id="${field.id}"
//             name="${field.id}"
//             placeholder="${field.placeholder}"
//             value="${field.value || ""}"
//             required="${field.required ? "true" : ""}"
//             style="width: 95%; padding: 5px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;"
//             onfocus="this.style.borderColor='#4ade80'; this.style.boxShadow='0 0 0 1px #4ade80'; this.style.outline='none';"
//             onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none';"
//           />
//         </div>
//       </div>
//     `;
//   });

//   // Submit Button
//   form.innerHTML += `
//     <button type="submit" style="background-color: #4ade80; color: white; padding: 10px 15px; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500; cursor: pointer; margin-top: 8px;"
//       onmouseover="this.style.backgroundColor='#22c55e';" onmouseout="this.style.backgroundColor='#4ade80';">Submit</button>
//   `;

//   formContainer.appendChild(form);
//   chatBody.appendChild(formContainer);
// }

function createForm(msgId, content, chatBody) {
  // Create form container
  const fields = content?.formfields
  const formContainer = document.createElement("div");
  formContainer.style.cssText = `
    width: 100%;
    max-width: 70%;
    background-color: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
  `;

  // Header and icon
  formContainer.innerHTML = `
    <div class="form-header" style="width: 100%; text-align: center; margin-bottom: 16px;">
      <div class="icon" style="background-color: #4ade80; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 8px;">👤</div>
    </div>
    <p class="form-description" style="font-size: 0.9rem; color: #374151; margin-bottom: 16px; text-align: center;">Welcome to our LiveChat! Please fill the form and submit.</p>
  `;

  // Create the form
  const form = document.createElement("form");
  form.style.cssText = `width: 100%; display: flex; flex-direction: column; gap: 8px;`;

  // Populate form with fields
  fields.forEach((field) => {
    form.innerHTML += `
      <div style="width: 100%; display:flex; flex-direction: column; margin-bottom: 12px;">
        <label for="${
          field.id
        }" style="font-size: 0.85rem; color: #374151; font-weight: 500;">${
      field.label
    }
          <span style="color: #ef4444;">*</span></label>
        <div style="width: 100%; padding-right: 10px">
          <input
            type="${field.type}"
            id="${field.id}"
            name="${field.id}"
            placeholder="${field.placeholder}"
            value="${field.value || ""}"
            required="${field.required ? "true" : ""}"
            style="width: 95%; padding: 5px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;"
            onfocus="this.style.borderColor='#4ade80'; this.style.boxShadow='0 0 0 1px #4ade80'; this.style.outline='none';"
            onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none';"
          />
        </div>
      </div>
    `;
  });

  // Submit Button
  // console.log("form status == ",content.formstatus)
  if(content.formstatus===false){
    form.innerHTML +=`
    <button type="submit" style="background-color: #4ade80; color: white; padding: 10px 15px; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500; cursor: pointer; margin-top: 8px;" 
      onmouseover="this.style.backgroundColor='#22c55e';" onmouseout="this.style.backgroundColor='#4ade80';">Submit</button>
  `
  }else{
    form.innerHTML +=`
    <button type="submit" disabled style="background-color: #4ade80; color: white; padding: 10px 15px; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500; cursor: pointer; margin-top: 8px;">Submited</button>
    `
  }


  // Handle form submission
  form.onsubmit = async function (event) {
    event.preventDefault(); // Prevent default form submission

    // Extract form data
    const formData = {};
    fields.forEach((field) => {
      formData[field.id] = form.elements[field.id].value;
      field.value = form.elements[field.id].value
    });
    console.log(fields)

    try {
      // Call the API
      const payload = {
        conversation: {
          userId: user_id || "",
          conversation_id: conversation_id || "",
          userToken: user_token || "",
        },
          message : {
            type: "formdata",
            data : {
              formfields : fields,
              form_sms_id : msgId, // mongo id(_id)
              formstatus : true
            }
          },
          toggle_status: "Human",
        }

        console.log(payload)
      
      const response = await fetch(
        `${chatApi}/wc-webhook/recieve-webchat-message/${company?.uuid}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      // Check if the response is successful
      if (response.ok) {
        const result = await response.json();
        // alert("Form submitted successfully!");
        const userMessage = document.createElement("p");
        userMessage.style = `
            background-color: #4ade80;
            color: #fff;
            padding: 10px;
            border-radius: 10px;
            width: fit-content;
            max-width: 80%;
            margin-bottom: 10px;
            margin-left: auto;
            align-self: flex-end;
            text-align: right;
          `;
        userMessage.innerText = "Form Submited";
        chatBody.appendChild(userMessage);
        console.log("Response:", result);
      } else {
        alert("Failed to submit the form.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  formContainer.appendChild(form);
  chatBody.appendChild(formContainer);
}

async function createChatWidget() {
  const widgetHTML = `
  <div
    id="chat-icon"
    style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #18813e;
      color: #fff;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 1000;
    "
  >
    💬
  </div>
  <div
    id="chat-container"
    style="
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 350px;
      height: 500px;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      display: none;
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;
    "
  >
    <div style="display:flex; justify-content: space-between; align-items: center; background-color: #18813e; color: #fff; padding: 15px; border-top-left-radius: 10px; border-top-right-radius: 10px;">
      <span style="font-weight: bold;">
      ${company?.companyName}
      </span>
      <span id='close-chat' style="cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 15 15"><path fill="white" d="M3.64 2.27L7.5 6.13l3.84-3.84A.92.92 0 0 1 12 2a1 1 0 0 1 1 1a.9.9 0 0 1-.27.66L8.84 7.5l3.89 3.89A.9.9 0 0 1 13 12a1 1 0 0 1-1 1a.92.92 0 0 1-.69-.27L7.5 8.87l-3.85 3.85A.92.92 0 0 1 3 13a1 1 0 0 1-1-1a.9.9 0 0 1 .27-.66L6.16 7.5L2.27 3.61A.9.9 0 0 1 2 3a1 1 0 0 1 1-1c.24.003.47.1.64.27"/></svg>
      </span>
    </div>
    <div id="chat-body" style="flex: 1; padding: 10px; overflow-y: auto; background-color: #f9f9f9;">
      <p style="background-color: #f1f1f1; padding: 10px; border-radius: 10px; max-width: 80%; margin-bottom: 10px;">Welcome to the chat!</p>
    </div>
    <div style="display: flex; padding: 10px; background-color: #fff; border-top: 1px solid #ddd;">
      <input
        type="text"
        id="chat-input"
        placeholder="Type a message..."
        style="
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        "
      />
      <button
        id="send-button"
        style="
          background-color: #4ade80;
          color: #fff;
          border: none;
          padding: 10px 15px;
          border-radius: 5px;
          margin-left: 10px;
          cursor: pointer;
        "
        onMouseOver="this.style.backgroundColor='#22c55e'"
        onMouseOut="this.style.backgroundColor='#4ade80'"
      >
        Send
      </button>
    </div>
  </div>
`;

  document.body.innerHTML += widgetHTML;

  const chatIcon = document.getElementById("chat-icon");
  const closeChatButton = document.getElementById("close-chat");
  const chatContainer = document.getElementById("chat-container");
  const sendButton = document.getElementById("send-button");
  const chatInput = document.getElementById("chat-input");
  const chatBody = document.getElementById("chat-body");

  // Load previous messages and append them to chat body
  async function loadPreviousMessages() {
    const previousMessages = await fetchPreviousMessages();
    // console.log("previousMessages", previousMessages);
    for (let msg of previousMessages) {
      const serverMessage = document.createElement("p");
      const isUserMessage = msg.senderId === webchat_id;

      if (!isUserMessage) {
        // console.log("inside if = ", msg?.content?.data?.body);
        if (msg?.content?.type === "text") {
          const serverMessage = document.createElement("p");

          serverMessage.style = `
            background-color: ${isUserMessage ? "#4ade80" : "#f1f1f1"};
            color: ${isUserMessage ? "#fff" : "#333"};
            padding: 10px;
            border-radius: 10px;
            max-width: 80%;
            width: fit-content;
            margin-bottom: 10px;
            align-self: ${isUserMessage ? "flex-end" : "flex-start"};
            text-align: ${isUserMessage ? "right" : "left"};
          `;

          serverMessage.innerText =
            msg.content?.data?.body || msg.content?.data?.text;
          chatBody.appendChild(serverMessage);
        } else if (msg?.content?.type === "form") {
          if (msg.content?.data?.formfields) {
            // Call the function to render the form
            // console.log("id == ",msg._id)
            createForm(msg._id, msg.content?.data, chatBody);
          }
        }
        // serverMessage.style = `
        //   background-color: ${isUserMessage ? "#4ade80" : "#f1f1f1"};
        //   color: ${isUserMessage ? "#fff" : "#333"};
        //   padding: 10px;
        //   border-radius: 10px;
        //   max-width: 80%;
        //   width: fit-content;
        //   margin-bottom: 10px;
        //   align-self: ${isUserMessage ? "flex-end" : "flex-start"};
        //   text-align: ${isUserMessage ? "right" : "left"};
        // `;
        // serverMessage.innerText = msg?.content?.data?.body || msg?.content?.data?.body;
        // chatBody.appendChild(serverMessage);
      } else {
        // console.log("inside else = ", msg?.content);
       if(msg?.content?.type === "text"){
        const userMessage = document.createElement("p");
        userMessage.style = `
            background-color: #4ade80;
            color: #fff;
            padding: 10px;
            border-radius: 10px;
            width: fit-content;
            max-width: 80%;
            margin-bottom: 10px;
            margin-left: auto;
            align-self: flex-end;
            text-align: right;
          `;
        userMessage.innerText = msg?.content?.data?.body;
        chatBody.appendChild(userMessage);
       }else if(msg?.content?.type === "formdata"){
        const userMessage = document.createElement("p");
        userMessage.style = `
            background-color: #4ade80;
            color: #fff;
            padding: 10px;
            border-radius: 10px;
            width: fit-content;
            max-width: 80%;
            margin-bottom: 10px;
            margin-left: auto;
            align-self: flex-end;
            text-align: right;
          `;
        userMessage.innerText = "Form Submited";
        chatBody.appendChild(userMessage);
       }
      }
    }
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Load previous messages when chat widget opens for the first time
  loadPreviousMessages();

  // Show or hide chat container
  chatIcon.addEventListener("click", function () {
    chatContainer.style.display =
      chatContainer.style.display === "none" ? "flex" : "none";
    chatBody.scrollTop = chatBody.scrollHeight;
  });

  // Close chat container
  closeChatButton.addEventListener("click", function () {
    chatContainer.style.display = "none";
  });

  // Send text message to backend and display it in chat
  sendButton.addEventListener("click", async function () {
    const message = chatInput.value.trim();
    if (message) {
      const userMessage = document.createElement("p");
      userMessage.style = `
        background-color: #4ade80;
        color: #fff;
        padding: 10px;
        border-radius: 10px;
        max-width: 80%;
        width: fit-content;
        margin-bottom: 10px;
        margin-left: auto;
        align-self: flex-end;
        text-align: right;
      `;
      userMessage.innerText = `${message}`;
      chatBody.appendChild(userMessage);
      chatInput.value = "";
      chatBody.scrollTop = chatBody.scrollHeight;

      try {
        let payload = {};
        if (webchat_id) {
          console.log("inside if");
          payload = {
            conversation: {
              userId: user_id || "",
              conversation_id: conversation_id || "",
              userToken: user_token || "",
            },
            message,
            toggle_status: "Bot",
          };
        } else {
          console.log("inside else");
          payload = {
            conversation: {
              userId: "",
              conversation_id: "",
              userToken: "",
            },
            message,
            toggle_status: "Bot",
          };
        }

        console.log(`The Payload sent is `, payload);

        const response = await fetch(
          `${chatApi}/wc-webhook/recieve-webchat-message/${company?.uuid}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
        console.log(response);
        if (response.status === 200) {
          const result = await response.json();
          console.log("Message sent successfully", result);
          if (!webchat_id) {
            console.log("Inside if", webchat_id);
            user_id = result?.res?.user_id;
            webchat_id = user_id;
            localStorage.setItem("user_id", result?.data?.res?.user_id);
            localStorage.setItem(
              "conversation_id",
              result?.data?.res?.conversation_id
            );
            localStorage.setItem("user_token", result?.data?.res?.user_token);
            socket.emit("subscribe", webchat_id);
          }
        } else {
          console.log("Failed to send message");
        }
      } catch (error) {
        console.log("An error occurred while sending the message:", error);
      }
    }
  });

  // Example of listening to incoming messages from the server
  socket.on("sending message", (msg) => {
    console.log(msg);
    const isUserMessage = msg.senderId === localStorage.getItem("user_id");
    if (msg?.content?.type === "text") {
      const serverMessage = document.createElement("p");

      serverMessage.style = `
        background-color: ${isUserMessage ? "#4ade80" : "#f1f1f1"};
        color: ${isUserMessage ? "#fff" : "#333"};
        padding: 10px;
        border-radius: 10px;
        max-width: 80%;
        width: fit-content;
        margin-bottom: 10px;
        align-self: ${isUserMessage ? "flex-end" : "flex-start"};
        text-align: ${isUserMessage ? "right" : "left"};
      `;

      serverMessage.innerText =
        msg.content?.data?.body || msg.content?.data?.text;
      chatBody.appendChild(serverMessage);
    } else if (msg?.content?.type === "form") {
      if (msg.content?.data?.formfields) {
        // Call the function to render the form
        // console.log(me)
        createForm(msg._id, msg.content?.data, chatBody);
      }
    }
    chatBody.scrollTop = chatBody.scrollHeight;
  });
}

// Initialize the widget on page load
window.onload = createChatWidget;
