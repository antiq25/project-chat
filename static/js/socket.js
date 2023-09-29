let isMenuOpen = false;

socket.on('broadcast_message', function (data) {
    var chatbox = document.getElementById('chatbox');
    var displayName = data.display_name || data.username;

    var messageHTML = document.createElement('div');
    messageHTML.className = "widget-chat-item fade-in";
    messageHTML.innerHTML = `
        <div class="d-flex align-items-start mb-2">
            <a href="/profile/${data.user_id}" class="profile-link me-2 d-flex align-items-center" title="View profile" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-content="<img src='${data.profile_pic}' width='40'><br>${displayName}">
                <img src="${data.profile_pic}" alt="${displayName}" width="40" class="widget-chat-img">
            </a>
            <div class="widget-chat-message">
                <strong><a href="/profile/${data.user_id}" class="profile-link">${displayName}</a></strong>
                <span class="ms-2">${data.message}</span>
            </div>
        </div>
    `;
    
    chatbox.appendChild(messageHTML);
    chatbox.scrollTop = chatbox.scrollHeight;

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

socket.on('user_joined', function (data) {
    appendSystemMessage(`${data.display_name || data.username} has joined the chat.`);
});

socket.on('user_left', function (data) {
    appendSystemMessage(`${data.display_name || data.username} has left the chat.`);
});

function appendSystemMessage(message) {
    var chatbox = document.getElementById('chatbox');
    var messageHTML = document.createElement('div');
    messageHTML.className = "text-muted fade-in";
    messageHTML.textContent = message;
    chatbox.appendChild(messageHTML);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function checkKey(event) {
    if (event.keyCode === 13 && !isMenuOpen) {
        sendMessage();
    }
}

function scrollBottom() {
    var chatBox = document.getElementById("chatbox");
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
    console.log("Sending message...");
    var message = document.getElementById('message').value;
    socket.emit('send_message', { message: message });
    document.getElementById('message').value = '';
    scrollBottom();
}

document.getElementById('message').focus();