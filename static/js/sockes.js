
    const privateMessageForm = document.getElementById("private-chat-form");
    const privateMessageInput = document.getElementById("private-message-input");
    const privateMessagesList = document.getElementById("private-messages");

    privateMessageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const message = privateMessageInput.value.trim();
        if (message) {
            socket.emit("send_private_message", { 
                sender_id: "{{ current_user.id }}",
                receiver_id: "{{ receiver.id }}",
                message 
            });
            privateMessageInput.value = "";
        }
    });

    socket.on('private_message', function(data) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("d-flex", "align-items-center", "mb-2");
        messageElement.innerHTML = `<strong>${data.display_name || data.from}</strong>: ${data.message}`;
        privateMessagesList.appendChild(messageElement);
        scrollBottom();
    });

   function scrollBottom() {
    const privateMessages = document.getElementById("private-messages");    
    privateMessages.scrollTop = privateMessages.scrollHeight;
   }


 
    window.onload = function() {
    privateMessageInput.focus();
    scrollBottom();
}