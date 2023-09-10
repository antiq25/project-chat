

const privateMessageInput = document.getElementById("private-message-input");
const sendButton = document.getElementById("send-button");
const privateMessagesList = document.getElementById("private-messages");

socket.on('private_messages', function(data) {
    const privateChatbox = document.getElementById("chatbox");
    const displayName = data.display_name || data.username;
    
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `
        <div class="d-flex align-items-start mb-2">
            <a href="/profile/${data.user_id}" class="profile-link me-2" title="View profile" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-content="<img src='${data.profile_pic}' width='50'><br>${displayName}">
                <img src="${data.profile_pic}" alt="${displayName}" width="40" class="rounded-circle">
            </a>
            <div><strong><a href="/profile/${data.user_id}" class="profile-link">${displayName}</a></strong>: ${data.message}</div>
        </div>`;
    
    privateChatbox.appendChild(messageElement);
    privateChatbox.scrollTop = privateChatbox.scrollHeight;

    // Reinitialize tooltips for newly added content
    var tooltipTriggerList = [].slice.call(privateChatbox.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});


function sendMessage() {
    const message = privateMessageInput.value.trim();
    if (message) {
        socket.emit("send_private_message", {
            sender_id: "{{ current_user.id }}",
            receiver_id: "{{ receiver.id }}",
            message,
        });
        socket.emit('send_message', { message: message });
        privateMessageInput.value = "";
    }
}

sendButton.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage();
});

privateMessageInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});