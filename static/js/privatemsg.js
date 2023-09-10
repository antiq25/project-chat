var socket = io.connect();

socket.on('broadcast_message', function(data) {
    appendMessage(data, 'private-chatbox');
});

socket.on("private_message", function(data) {
    appendMessage(data, 'private-chatbox');
});

socket.on('user_joined', function(data) {
    var chatElement = getChatElement('private-chatbox');
    appendNotification(chatElement, `${data.display_name || data.username} has joined the chat.`);
});

socket.on('user_left', function(data) {
    var chatElement = getChatElement('private-chatbox');
    appendNotification(chatElement, `${data.display_name || data.username} has left the chat.`);
});

function getChatElement(id) {
    return document.getElementById(id);
}

function appendMessage(data, chatboxId) {
    var chatElement = getChatElement(chatboxId);
    var displayName = data.display_name || data.username;

    var messageHTML = `
        <div class="d-flex align-items-start mb-2">
            <a href="/profile/${data.user_id}" class="profile-link me-2" title="View profile" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-content="<img src='${data.profile_pic}' width='50'><br>${displayName}">
                <img src="${data.profile_pic}" alt="${displayName}" width="40" class="rounded-circle">
            </a>
            <div><strong><a href="/profile/${data.user_id}" class="profile-link">${displayName}</a></strong>: ${data.message}</div>
        </div>`;
    
    chatElement.insertAdjacentHTML('beforeend', messageHTML);
    scrollBottom(chatElement);

    var tooltipTriggerList = [].slice.call(chatElement.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function appendNotification(chatElement, notification) {
    var notificationHTML = document.createElement('div');
    notificationHTML.className = "text-muted";
    notificationHTML.textContent = notification;
    chatElement.appendChild(notificationHTML);
    scrollBottom(chatElement);
}

function scrollBottom(chatElement) {
    chatElement.scrollTop = chatElement.scrollHeight;
}

// Handling sending messages
const privateMessageInput = document.getElementById("private-message-input");
const sendButton = document.getElementById("send-button");

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

sendButton.addEventListener("click", function(e) {
    e.preventDefault();
    sendMessage();
});

privateMessageInput.addEventListener("keyup", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

window.onload = function() {
    privateMessageInput.focus();
    scrollBottom(getChatElement('private-chatbox'));
};
