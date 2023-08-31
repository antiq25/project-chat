const socket = io.connect(location.origin);

socket.on("connect", () => {
    console.log("Connected to the server");
    socket.emit("join", { user_id: "{{ current_user.id }}" });  // Make sure this ID matches with the server-side room ID
});

const privateMessageForm = document.getElementById("private-chat-form");
const privateMessageInput = document.getElementById("private-message-input");
const privateMessagesList = document.getElementById("private-messages");

privateMessageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = privateMessageInput.value.trim();
    if (message) {
        // Debug log
        console.log("Sending message:", message);
        
        // Emit the message to the server
        socket.emit("send_private_message", { 
            sender_id: "{{ current_user.id }}",
            receiver_id: "{{ receiver.id }}",
            message 
        });
        privateMessageInput.value = "";
    }
});

socket.on('private_message', function(data) {
    // Debug log
    console.log("Received private message:", data);
    
    // Append the received message
    const messageElement = document.createElement("li");
    messageElement.innerHTML = `<strong>${data.display_name || data.from}</strong>: ${data.message}`;
    privateMessagesList.appendChild(messageElement);
});