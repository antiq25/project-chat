let isMenuOpen = false;


socket.on('broadcast_message', function (data) {
    var chatbox = document.getElementById('chatbox');
    var displayName = data.display_name || data.username; 
    var messageHTML = document.createElement('div');
    messageHTML.innerHTML = `
    <div class="d-flex align-items-start mb-2">
        <a href="/profile/${data.user_id}" class="profile-link me-2" title="View profile" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-content="<img src='${data.profile_pic}' width='50'><br>${displayName}">
            <img src="${data.profile_pic}" alt="${displayName}" width="40" class="rounded-circle">
        </a>
        <div><strong><a href="/profile/${data.user_id}" class="profile-link">${displayName}</a></strong>: ${data.message}</div>
    </div>`;
    chatbox.appendChild(messageHTML);

    chatbox.scrollTop = chatbox.scrollHeight;

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});



socket.on('user_joined', function (data) {
    var chatbox = document.getElementById('chatbox');
    var messageHTML = document.createElement('div');
    messageHTML.className = "text-muted";
    messageHTML.textContent = `${data.display_name || data.username} has joined the chat.`;
    chatbox.appendChild(messageHTML);

    chatbox.scrollTop = chatbox.scrollHeight;
});

socket.on('user_left', function (data) {
    var chatbox = document.getElementById('chatbox');
    var displayName = data.display_name || data.username;
    var messageHTML = document.createElement('div');
    messageHTML.className = "text-muted";
    messageHTML.textContent = `${displayName} has left the chat.`;
    chatbox.appendChild(messageHTML);

    chatbox.scrollTop = chatbox.scrollHeight;
});


// Listen for the display_notification event to show the detailed notification
function checkKey(event) {
    if (event.keyCode === 13) {
        if (isMenuOpen) {
            return; // Do nothing if the menu is open
        } else {
            sendMessage(); // Execute the `sendMessage` function if the menu is not open
        }
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

