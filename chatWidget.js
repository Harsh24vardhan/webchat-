(function () {
  console.log("Enhanced Chat Widget Initializing...");

  // Retrieve existing user data from local storage

  const company = window?.vcxWebChat;

  // let user_id = localStorage.getItem("user_id");
  // let webchat_id = user_id;
  // let conversation_id = localStorage.getItem("conversation_id");
  // let user_token = localStorage.getItem("user_token");
  // let chatStatus = "Bot"
  const storedUserDetails = JSON.parse(localStorage.getItem("webchat")) || {};
  console.log(storedUserDetails)
  let userToken = storedUserDetails.userToken || "";
  let conversationId = storedUserDetails.conversationId || "";
  let userId = storedUserDetails.userId || "";
  let webchatId = userId
  let chatStatus = "Bot";
  const chatApi = "https://chatbackenddev.versal.one";
  // const company = window?.vcxWebChat;

  console.log("details =  ",
    webchatId,
    "       ",
    userId,
    "       ",
    conversationId,
    "       ",
    userToken
  );


  // Socket.io connection
  const socket = io(chatApi);
  if (userId) {
    socket.on("connect", () => {
      console.log("Connected to the server via Socket.IO");
      socket.emit("subscribe", userId);
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from the server");
    });
  }

  // Create chat bubble
  const chatBubble = document.createElement("img");
  chatBubble.src =
    "https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/two-way-chat-bubble-icon.png";
  chatBubble.style.position = "fixed";
  chatBubble.style.bottom = "20px";
  chatBubble.style.right = "20px";
  chatBubble.style.width = "60px";
  chatBubble.style.cursor = "pointer";
  chatBubble.style.zIndex = "9999";
  document.body.appendChild(chatBubble);

  // Create chat widget container
  const chatWidget = document.createElement("div");
  chatWidget.id = "chat-widget";
  chatWidget.style = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    width: 350px;
    height: 70vh;
    max-height: 100%;
    border: 1px solid #ccc;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    display: none;
    background-color: #fff;
    z-index: 9999;
  `;
  document.body.appendChild(chatWidget);

  // Chat header
  chatWidget.innerHTML = `
    <div style="height: 50px; display:flex; justify-content: space-between; align-items: center; background-color: #2DA8FA; color: #fff; padding-left: 15px; padding-right: 15px; border-top-left-radius: 10px; border-top-right-radius: 10px;">
   
      <div style="height: 70%; display: flex;  align-items: center; gap: 10px">
        <img src="${company?.logo}" style="height: 100%; aspect-ratio: 1/1; border-radius: 50%;"/>
        <span style="font-weight: bold;">
        ${company?.companyName}
        </span>
      </div>
      <button id="close-button" style="background: none; border: none; color: white; font-size: 30px; cursor: pointer;">&times;</button>
    </div>
    <div id="chat-messages" style="height: 80%; overflow-y: auto; padding: 10px;"></div>
    <div style="display: flex; padding: 10px; background-color: #fff; border-top: 1px solid #ddd;">
      <input id="chat-input" type="text" placeholder="Type a message..." style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
      <button id="send-button" style="background-color: #2DA8FA; color: #fff; border: none; padding: 10px; margin-left: 10px; border-radius: 5px; cursor: pointer;">Send</button>
    </div>
  `;

  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");
  const closeButton = document.getElementById("close-button");

  chatBubble.addEventListener("click", () => {
    chatWidget.style.display =
      chatWidget.style.display === "none" ? "block" : "none";
    chatMessages.scrollTop = chatMessages.scrollHeight
  });

  closeButton.addEventListener("click", () => {
    chatWidget.style.display = "none";
  });


  function createForm(msgId, content, chatBody) {
    // Create form container
    const fields = content?.formfields;
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
        <div class="icon" style="background-color: #2DA8FA; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 8px;">👤</div>
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
          <label for="${field.id
        }" style="font-size: 0.85rem; color: #374151; font-weight: 500;">${field.label
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
              onfocus="this.style.borderColor='#2DA8FA'; this.style.boxShadow='0 0 0 1px #2DA8FA'; this.style.outline='none';"
              onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none';"
            />
          </div>
        </div>
      `;
    });

    // Submit Button
    // console.log("form status == ",content.formstatus)
    if (content.formstatus === false) {
      form.innerHTML += `
      <button type="submit" style="background-color: #2DA8FA; color: white; padding: 10px 15px; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500; cursor: pointer; margin-top: 8px;"
        onmouseover="this.style.backgroundColor='#22c55e';" onmouseout="this.style.backgroundColor='#2DA8FA';">Submit</button>
    `;
    } else {
      form.innerHTML += `
      <button type="submit" disabled style="background-color: #2DA8FA; color: white; padding: 10px 15px; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500; cursor: pointer; margin-top: 8px;">Submited</button>
      `;
    }

    // Handle form submission
    form.onsubmit = async function (event) {
      event.preventDefault(); // Prevent default form submission

      // Extract form data
      const formData = {};
      fields.forEach((field) => {
        formData[field.id] = form.elements[field.id].value;
        field.value = form.elements[field.id].value;
      });
      // console.log(fields);

      try {
        // Call the API
        const payload = {
          conversation: {
            userId: userId || "",
            conversation_id: conversationId || "",
            userToken: userToken || "",
          },
          message: {
            type: "formdata",
            data: {
              formfields: fields,
              form_sms_id: msgId, // mongo id(_id)
              formstatus: true,
            },
          },
          toggle_status: "Human",
          clientId: company?.uuid,
          webhookId: company?.clientId,
        };

        // console.log(payload);

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
          chatMessages.appendChild(userMessage);
          // console.log("Response:", result);
        } else {
          alert("Failed to submit the form.");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      } finally {
        chatMessages.scrollTop = chatMessages.scrollHeight
      }
    };

    formContainer.appendChild(form);
    chatMessages.appendChild(formContainer);
  }

  // Load previous messages
  async function loadPreviousMessages() {
    try {
      console.log("user id = ", userId)
      // const res = await fetch(`${chatApi}/webhook/gettoggle/${company?.uuid}?id=675ae547d106846c5a4cf32e&displayPhoneNumber=918310245932&waId=user_01JEXGZ5C5ZM69VTGYSZS9Z3CJ&epochToken=1734010589&source=webchat`)

      const response = await fetch(
        `${chatApi}/chat/get-botpress-messages/${userId}/${company?.uuid}`
      );
      console.log("response previous message == ", response)
      if (response.ok) {
        const data = await response.json();
        console.log(data)
        data.message?.forEach((msg) => {
          // const serverMessage = document.createElement("p");
          const isUserMessage = msg.senderId === webchatId;

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
              chatMessages.appendChild(serverMessage);
              // chatBody.appendChild(serverMessage);
            } else if (msg?.content?.type === "form") {
              if (msg.content?.data?.formfields) {
                // Call the function to render the form
                console.log("id == ", msg._id, msg.content?.data, chatMessages)
                createForm(msg._id, msg.content?.data, chatMessages);
              }
            }
          } else {
            // console.log("inside else = ", msg?.content);
            if (msg?.content?.type === "text") {
              const userMessage = document.createElement("p");
              userMessage.style = `
                background-color: #2DA8FA;
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
              chatMessages.appendChild(userMessage);
              // chatBody.appendChild(userMessage);
            } else if (msg?.content?.type === "formdata") {
              const userMessage = document.createElement("p");
              userMessage.style = `
                background-color: #2DA8FA;
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
              chatMessages.appendChild(userMessage);
              // chatBody.appendChild(userMessage);
            }
          }
        })
        // data.message?.forEach((msg) => {
        //   const messageElement = document.createElement("p");
        //   messageElement.style.padding = "10px";
        //   messageElement.style.borderRadius = "5px";
        //   if (msg.senderId === userId) {
        //     console.log("inside if")
        //     messageElement.style.marginLeft = '50px'
        //   } else {
        //     console.log("inside else")
        //     messageElement.style.marginRight = '50px'
        //   }
        //   messageElement.style.backgroundColor =
        //     msg.senderId === userId ? "#2DA8FA" : "#f0f0f0";
        //   messageElement.style.color =
        //     msg.senderId === userId ? "#fff" : "#000";
        //   messageElement.textContent =
        //     msg.content?.data?.body || msg.content?.data?.text;
        //   chatMessages.appendChild(messageElement);
        // });
        chatMessages.scrollTop = chatMessages.scrollHeight
      }
    } catch (error) {
      console.error("Error loading previous messages: ", error);
    }
  }

  // async function loadPreviousMessages() {
  //   const previousMessages = await fetchPreviousMessages();
  //   // console.log("previousMessages", previousMessages);
  //   for (let msg of previousMessages) {
  //     const serverMessage = document.createElement("p");
  //     const isUserMessage = msg.senderId === webchatId;

  //     if (!isUserMessage) {
  //       // console.log("inside if = ", msg?.content?.data?.body);
  //       if (msg?.content?.type === "text") {
  //         const serverMessage = document.createElement("p");

  //         serverMessage.style = `
  //             background-color: ${isUserMessage ? "#4ade80" : "#f1f1f1"};
  //             color: ${isUserMessage ? "#fff" : "#333"};
  //             padding: 10px;
  //             border-radius: 10px;
  //             max-width: 80%;
  //             width: fit-content;
  //             margin-bottom: 10px;
  //             align-self: ${isUserMessage ? "flex-end" : "flex-start"};
  //             text-align: ${isUserMessage ? "right" : "left"};
  //           `;

  //         serverMessage.innerText =
  //           msg.content?.data?.body || msg.content?.data?.text;
  //         chatMessages.appendChild(serverMessage);
  //       } else if (msg?.content?.type === "form") {
  //         if (msg.content?.data?.formfields) {
  //           // Call the function to render the form
  //           // console.log("id == ",msg._id)
  //           createForm(msg._id, msg.content?.data, chatMessages);
  //         }
  //       }
  //     } else {
  //       // console.log("inside else = ", msg?.content);
  //       if (msg?.content?.type === "text") {
  //         const userMessage = document.createElement("p");
  //         userMessage.style = `
  //             background-color: #4ade80;
  //             color: #fff;
  //             padding: 10px;
  //             border-radius: 10px;
  //             width: fit-content;
  //             max-width: 80%;
  //             margin-bottom: 10px;
  //             margin-left: auto;
  //             align-self: flex-end;
  //             text-align: right;
  //           `;
  //         userMessage.innerText = msg?.content?.data?.body;
  //         chatMessages.appendChild(userMessage);
  //       } else if (msg?.content?.type === "formdata") {
  //         const userMessage = document.createElement("p");
  //         userMessage.style = `
  //             background-color: #4ade80;
  //             color: #fff;
  //             padding: 10px;
  //             border-radius: 10px;
  //             width: fit-content;
  //             max-width: 80%;
  //             margin-bottom: 10px;
  //             margin-left: auto;
  //             align-self: flex-end;
  //             text-align: right;
  //           `;
  //         userMessage.innerText = "Form Submited";
  //         chatMessages.appendChild(userMessage);
  //       }
  //     }
  //   }
  //   chatMessages.scrollTop = chatMessages.scrollHeight;
  // }


  loadPreviousMessages();

  // Send message function
  sendButton.addEventListener("click", async () => {
    const message = chatInput.value.trim();
    if (!message) return;

    const userMessage = document.createElement("p");
    userMessage.style.padding = "10px";
    userMessage.style.backgroundColor = "#2DA8FA";
    userMessage.style.color = "#fff";
    userMessage.style.borderRadius = "5px";
    userMessage.style.margin = "5px 0 5px auto";
    userMessage.textContent = message;
    chatMessages.appendChild(userMessage);
    chatInput.value = "";

    try {
      let payload = {};
      if (webchatId && webchatId !== '') {
        // console.log("inside if");
        payload = {
          conversation: {
            userId: userId || "",
            conversation_id: conversationId || "",
            userToken: userToken || "",
          },
          message,
          toggle_status: chatStatus,
          clientId: company?.uuid,
          webhookId: company?.clientId,
        };
      } else {
        // console.log("inside else");
        payload = {
          conversation: {
            userId: "",
            conversation_id: "",
            userToken: "",
          },
          message,
          toggle_status: chatStatus,
          clientId: company?.uuid,
          webhookId: company?.clientId,
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
      // console.log(response);
      if (response.status === 200) {
        const result = await response.json();
        console.log("Message sent successfully ==== ", result);
        // console.log("Inside if === ", webchat_id);
        if (!userId) {
          // console.log("*******************")

          userId = result?.data?.res?.user_id;
          webchatId = userId;
          conversationId = result?.data?.res?.conversation_id;
          userToken = result?.data?.res?.user_token;
          localStorage.setItem("webchat", JSON.stringify({
            userId, webchatId, conversationId, userToken
          }))
          console.log(
            webchatId,
            " @@ ",
            userId,
            " @@ ",
            conversationId,
            " @@ ",
            userToken
          );
          socket.emit("subscribe", userId);
        }
      } else {
        console.log("Failed to send message");
      }
    } catch (error) {
      console.log("An error occurred while sending the message:", error);
    }
  });

  socket.on("sending message", (msg) => {
    const messageElement = document.createElement("p");
    messageElement.style.padding = "10px";
    messageElement.style.backgroundColor = "#f0f0f0";
    messageElement.style.borderRadius = "5px";
    messageElement.style.margin = "5px 0";
    messageElement.textContent =
      msg.content?.data?.body || msg.content?.data?.text;
    chatMessages.appendChild(messageElement);
  });

  socket.on('toggle update', (data) => {
    console.log(data)
    chatStatus = data === 'Human' ? 'Human' : "Bot"
  })

})();



/***************************************************************************/
/********************************* Old Code ********************************/
/***************************************************************************/

// const chatApi = "https://chatbackenddev.versal.one";

// const company = window?.vcxWebChat;

// let user_id = localStorage.getItem("user_id");
// let webchat_id = user_id;
// let conversation_id = localStorage.getItem("conversation_id");
// let user_token = localStorage.getItem("user_token");
// let chatStatus = "Bot"

// // console.log(
// //   webchat_id,
// //   "       ",
// //   user_id,
// //   "       ",
// //   conversation_id,
// //   "       ",
// //   user_token
// // );

// const socket = io(`${chatApi}`);

// // Connect to the Socket.IO server
// if (user_id) {
//   socket.on("connect", () => {
//     console.log("Connected to the server");
//     socket.emit("subscribe", user_id); // Joining the 'plugin' room
//   });
// }

// socket.on("disconnect", () => {
//   console.log("Disconnected from socket server");
// });

// async function fetchPreviousMessages() {
//   try {
//     // const res = await fetch(`${chatApi}/webhook/gettoggle/${company?.uuid}?id=675ae547d106846c5a4cf32e&displayPhoneNumber=918310245932&waId=user_01JEXGZ5C5ZM69VTGYSZS9Z3CJ&epochToken=1734010589&source=webchat`)
//     // /8082f57c-1d2c-4b0e-aa18-86dc95222137
//     const response = await fetch(
//       `${chatApi}/chat/get-botpress-messages/${webchat_id}/${company?.uuid}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // console.log(response);

//     if (response.status === 200) {
//       const messages = await response.json();
//       console.log(messages);
//       return messages?.message || []; // Return fetched messages
//     } else {
//       // console.log("Failed to fetch previous messages");
//       return [];
//     }
//   } catch (error) {
//     console.log("An error occurred while fetching previous messages:", error);
//     return [];
//   }
// }

// /************************/
// // Define the function to render the form
// /************************/

// function createForm(msgId, content, chatBody) {
//   // Create form container
//   const fields = content?.formfields;
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

//   // Populate form with fields
//   fields.forEach((field) => {
//     form.innerHTML += `
//       <div style="width: 100%; display:flex; flex-direction: column; margin-bottom: 12px;">
//         <label for="${field.id
//       }" style="font-size: 0.85rem; color: #374151; font-weight: 500;">${field.label
//       }
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
//   // console.log("form status == ",content.formstatus)
//   if (content.formstatus === false) {
//     form.innerHTML += `
//     <button type="submit" style="background-color: #4ade80; color: white; padding: 10px 15px; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500; cursor: pointer; margin-top: 8px;"
//       onmouseover="this.style.backgroundColor='#22c55e';" onmouseout="this.style.backgroundColor='#4ade80';">Submit</button>
//   `;
//   } else {
//     form.innerHTML += `
//     <button type="submit" disabled style="background-color: #4ade80; color: white; padding: 10px 15px; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500; cursor: pointer; margin-top: 8px;">Submited</button>
//     `;
//   }

//   // Handle form submission
//   form.onsubmit = async function (event) {
//     event.preventDefault(); // Prevent default form submission

//     // Extract form data
//     const formData = {};
//     fields.forEach((field) => {
//       formData[field.id] = form.elements[field.id].value;
//       field.value = form.elements[field.id].value;
//     });
//     // console.log(fields);

//     try {
//       // Call the API
//       const payload = {
//         conversation: {
//           userId: user_id || "",
//           conversation_id: conversation_id || "",
//           userToken: user_token || "",
//         },
//         message: {
//           type: "formdata",
//           data: {
//             formfields: fields,
//             form_sms_id: msgId, // mongo id(_id)
//             formstatus: true,
//           },
//         },
//         toggle_status: "Human",
//       };

//       // console.log(payload);

//       const response = await fetch(
//         `${chatApi}/wc-webhook/recieve-webchat-message/${company?.uuid}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       // Check if the response is successful
//       if (response.ok) {
//         const result = await response.json();
//         // alert("Form submitted successfully!");
//         const userMessage = document.createElement("p");
//         userMessage.style = `
//             background-color: #4ade80;
//             color: #fff;
//             padding: 10px;
//             border-radius: 10px;
//             width: fit-content;
//             max-width: 80%;
//             margin-bottom: 10px;
//             margin-left: auto;
//             align-self: flex-end;
//             text-align: right;
//           `;
//         userMessage.innerText = "Form Submited";
//         chatMessages.appendChild(userMessage);
//         // console.log("Response:", result);
//       } else {
//         alert("Failed to submit the form.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       alert("An error occurred. Please try again.");
//     }
//   };

//   formContainer.appendChild(form);
//   chatMessages.appendChild(formContainer);
// }

// async function createChatWidget() {
//   const widgetHTML = `
//   <div
//     id="chat-icon"
//     style="
//       position: fixed;
//       bottom: 20px;
//       right: 20px;
//       background-color: #18813e;
//       color: #fff;
//       width: 50px;
//       height: 50px;
//       border-radius: 50%;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       cursor: pointer;
//       box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
//       z-index: 2000;
//     "
//   >
//     💬
//   </div>
//   <div
//     id="chat-container"
//     style="
//       position: fixed;
//       bottom: 80px;
//       right: 20px;
//       width: 350px;
//       height: 80%;
//       background-color: #fff;
//       border: 1px solid #ddd;
//       border-radius: 10px;
//       box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
//       display: none;
//       flex-direction: column;
//       z-index: 2000;
//       overflow: hidden;
//     "
//   >
//     <div style="height: 50px; display:flex; justify-content: space-between; align-items: center; background-color: #18813e; color: #fff; padding-left: 15px; padding-right: 15px; border-top-left-radius: 10px; border-top-right-radius: 10px;">
//       <div style="height: 70%; display: flex;  align-items: center; gap: 10px">
//         <img src="${company?.logo}" style="height: 100%; aspect-ratio: 1/1; border-radius: 50%;"/>
//         <span style="font-weight: bold;">
//         ${company?.companyName}
//         </span>
//       </div>
//       <span id='close-chat' style="cursor: pointer;">
//         <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 15 15"><path fill="white" d="M3.64 2.27L7.5 6.13l3.84-3.84A.92.92 0 0 1 12 2a1 1 0 0 1 1 1a.9.9 0 0 1-.27.66L8.84 7.5l3.89 3.89A.9.9 0 0 1 13 12a1 1 0 0 1-1 1a.92.92 0 0 1-.69-.27L7.5 8.87l-3.85 3.85A.92.92 0 0 1 3 13a1 1 0 0 1-1-1a.9.9 0 0 1 .27-.66L6.16 7.5L2.27 3.61A.9.9 0 0 1 2 3a1 1 0 0 1 1-1c.24.003.47.1.64.27"/></svg>
//       </span>
//     </div>
//     <div id="chat-body" style="flex: 1; padding: 10px; overflow-y: auto; background-color: #f9f9f9;">
//       <p style="background-color: #f1f1f1; padding: 10px; border-radius: 10px; max-width: 80%; margin-bottom: 10px;">Welcome to the chat!</p>
//     </div>
//     <div style="display: flex; padding: 10px; background-color: #fff; border-top: 1px solid #ddd;">
//       <input
//         type="text"
//         id="chat-input"
//         placeholder="Type a message..."
//         style="
//           flex: 1;
//           padding: 10px;
//           border: 1px solid #ddd;
//           border-radius: 5px;
//           font-size: 14px;
//         "
//       />
//       <button
//         id="send-button"
//         style="
//           background-color: #4ade80;
//           color: #fff;
//           border: none;
//           padding: 3px 10px;
//           border-radius: 5px;
//           margin-left: 10px;
//           cursor: pointer;
//           display : flex;
//           justify-content: center;
//           align-items: center;
//         "
//         onMouseOver="this.style.backgroundColor='#22c55e'"
//         onMouseOut="this.style.backgroundColor='#4ade80'"
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12L2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91"/></svg>
//       </button>
//     </div>
//   </div>
// `;

//   document.body.innerHTML += widgetHTML;

//   const chatIcon = document.getElementById("chat-icon");
//   const closeChatButton = document.getElementById("close-chat");
//   const chatContainer = document.getElementById("chat-container");
//   const sendButton = document.getElementById("send-button");
//   const chatInput = document.getElementById("chat-input");
//   const chatBody = document.getElementById("chat-body");

//   // Load previous messages and append them to chat body
//   async function loadPreviousMessages() {
//     const previousMessages = await fetchPreviousMessages();
//     // console.log("previousMessages", previousMessages);
//     for (let msg of previousMessages) {
//       const serverMessage = document.createElement("p");
//       const isUserMessage = msg.senderId === webchat_id;

//       if (!isUserMessage) {
//         // console.log("inside if = ", msg?.content?.data?.body);
//         if (msg?.content?.type === "text") {
//           const serverMessage = document.createElement("p");

//           serverMessage.style = `
//             background-color: ${isUserMessage ? "#4ade80" : "#f1f1f1"};
//             color: ${isUserMessage ? "#fff" : "#333"};
//             padding: 10px;
//             border-radius: 10px;
//             max-width: 80%;
//             width: fit-content;
//             margin-bottom: 10px;
//             align-self: ${isUserMessage ? "flex-end" : "flex-start"};
//             text-align: ${isUserMessage ? "right" : "left"};
//           `;

//           serverMessage.innerText =
//             msg.content?.data?.body || msg.content?.data?.text;
//           chatBody.appendChild(serverMessage);
//         } else if (msg?.content?.type === "form") {
//           if (msg.content?.data?.formfields) {
//             // Call the function to render the form
//             // console.log("id == ",msg._id)
//             createForm(msg._id, msg.content?.data, chatBody);
//           }
//         }
//       } else {
//         // console.log("inside else = ", msg?.content);
//         if (msg?.content?.type === "text") {
//           const userMessage = document.createElement("p");
//           userMessage.style = `
//             background-color: #4ade80;
//             color: #fff;
//             padding: 10px;
//             border-radius: 10px;
//             width: fit-content;
//             max-width: 80%;
//             margin-bottom: 10px;
//             margin-left: auto;
//             align-self: flex-end;
//             text-align: right;
//           `;
//           userMessage.innerText = msg?.content?.data?.body;
//           chatBody.appendChild(userMessage);
//         } else if (msg?.content?.type === "formdata") {
//           const userMessage = document.createElement("p");
//           userMessage.style = `
//             background-color: #4ade80;
//             color: #fff;
//             padding: 10px;
//             border-radius: 10px;
//             width: fit-content;
//             max-width: 80%;
//             margin-bottom: 10px;
//             margin-left: auto;
//             align-self: flex-end;
//             text-align: right;
//           `;
//           userMessage.innerText = "Form Submited";
//           chatBody.appendChild(userMessage);
//         }
//       }
//     }
//     chatBody.scrollTop = chatBody.scrollHeight;
//   }

//   // Load previous messages when chat widget opens for the first time
//   loadPreviousMessages();

//   // Show or hide chat container
//   chatIcon.addEventListener("click", function () {
//     chatContainer.style.display =
//       chatContainer.style.display === "none" ? "flex" : "none";
//     chatBody.scrollTop = chatBody.scrollHeight;
//   });

//   // Close chat container
//   closeChatButton.addEventListener("click", function () {
//     chatContainer.style.display = "none";
//   });

//   // Send text message to backend and display it in chat
//   sendButton.addEventListener("click", async function () {
//     const message = chatInput.value.trim();
//     if (message) {
//       const userMessage = document.createElement("p");
//       userMessage.style = `
//         background-color: #4ade80;
//         color: #fff;
//         padding: 10px;
//         border-radius: 10px;
//         max-width: 80%;
//         width: fit-content;
//         margin-bottom: 10px;
//         margin-left: auto;
//         align-self: flex-end;
//         text-align: right;
//       `;
//       userMessage.innerText = `${message}`;
//       chatBody.appendChild(userMessage);
//       chatInput.value = "";
//       chatBody.scrollTop = chatBody.scrollHeight;

//       try {
//         let payload = {};
//         if (webchat_id) {
//           // console.log("inside if");
//           payload = {
//             conversation: {
//               userId: user_id || "",
//               conversation_id: conversation_id || "",
//               userToken: user_token || "",
//             },
//             message,
//             toggle_status: chatStatus,
//           };
//         } else {
//           // console.log("inside else");
//           payload = {
//             conversation: {
//               userId: "",
//               conversation_id: "",
//               userToken: "",
//             },
//             message,
//             toggle_status: chatStatus,
//           };
//         }

//         // console.log(`The Payload sent is `, payload);

//         const response = await fetch(
//           `${chatApi}/wc-webhook/recieve-webchat-message/${company?.uuid}`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify(payload),
//           }
//         );
//         // console.log(response);
//         if (response.status === 200) {
//           const result = await response.json();
//           console.log("Message sent successfully ==== ", result);
//           // console.log("Inside if === ", webchat_id);
//           if (!user_id) {
//             // console.log("*******************")
//             user_id = result?.data?.res?.user_id;
//             webchat_id = user_id;
//             conversation_id = result?.data?.res?.conversation_id;
//             user_token = result?.data?.res?.user_token;
//             localStorage.setItem("user_id", result?.data?.res?.user_id);
//             localStorage.setItem(
//               "conversation_id",
//               result?.data?.res?.conversation_id
//             );
//             localStorage.setItem("user_token", result?.data?.res?.user_token);
//             console.log(
//               webchat_id,
//               " @@ ",
//               user_id,
//               " @@ ",
//               conversation_id,
//               " @@ ",
//               user_token
//             );
//             socket.emit("subscribe", user_id);
//           }
//         } else {
//           console.log("Failed to send message");
//         }
//       } catch (error) {
//         console.log("An error occurred while sending the message:", error);
//       }
//     }
//   });

//   // Example of listening to incoming messages from the server
//   socket.on("sending message", (msg) => {
//     console.log("Hello world")
//     console.log(msg);
//     const isUserMessage = msg.senderId === user_id
//     if (msg?.content?.type === "text") {
//       const serverMessage = document.createElement("p");

//       serverMessage.style = `
//         background-color: ${isUserMessage ? "#4ade80" : "#f1f1f1"};
//         color: ${isUserMessage ? "#fff" : "#333"};
//         padding: 10px;
//         border-radius: 10px;
//         max-width: 80%;
//         width: fit-content;
//         margin-bottom: 10px;
//         align-self: ${isUserMessage ? "flex-end" : "flex-start"};
//         text-align: ${isUserMessage ? "right" : "left"};
//       `;

//       serverMessage.innerText =
//         msg.content?.data?.body || msg.content?.data?.text;
//       chatBody.appendChild(serverMessage);
//     } else if (msg?.content?.type === "form") {
//       if (msg.content?.data?.formfields) {
//         // Call the function to render the form
//         // console.log(me)
//         createForm(msg._id, msg.content?.data, chatBody);
//       }
//     }
//     chatBody.scrollTop = chatBody.scrollHeight;
//   });
//   socket.on('toggle update', (data) => {
//     console.log(data)
//     chatStatus = data === 'Human' ? 'Human' : "Bot"
//   })
// }

// // Initialize the widget on page load
// window.onload = createChatWidget;
