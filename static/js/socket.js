var socket = io.connect();
// 2. Then, listen to eventsusing the socket
socket.on('broadcast_message', function (data) {
    var chatbox = document.getElementById('chatbox');
    var displayName = data.display_name || data.username; // Use display_name or fallback to username
    var messageHTML = `
<div class="d-flex align-items-start mb-2">
    <a href="/profile/${data.user_id}" class="profile-link me-2" title="View profile" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-content="<img src='${data.profile_pic}' width='50'><br>${displayName}">
        <img src="${data.profile_pic}" alt="${displayName}" width="40" class="rounded-circle">
    </a>
    <div>
        <strong><a href="/profile/${data.user_id}" class="profile-link">${displayName}</a></strong>: ${data.message}
    </div>
</div>
`;
    chatbox.innerHTML += messageHTML;
    chatbox.scrollTop = chatbox.scrollHeight;
    // Re-initialize tooltips for new messages
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

socket.on('user_joined', function (data) {
    var chatbox = document.getElementById('chatbox');
    var messageHTML = `<div class="text-muted">${data.display_name || data.username} has joined the chat.</div>`;
    chatbox.innerHTML += messageHTML;
    chatbox.scrollTop = chatbox.scrollHeight;
});

socket.on('user_left', function (data) {
    var chatbox = document.getElementById('chatbox');
    var messageHTML = `<div class="text-muted">${data.display_name} has left the chat.</div>`;
    chatbox.innerHTML += messageHTML;
    chatbox.scrollTop = chatbox.scrollHeight;
});



socket.on('update_user_list', function (data) {
    var userList = document.getElementById('online-users');
    userList.innerHTML = '';
    data.users.forEach(function (display_name) {
        userList.innerHTML += `<li class="list-group-item">${display_name}</li>`;
    });
});

function checkKey(event) {
    if (event.keyCode === 13) { // Enter key code
        sendMessage();
    }
}

    function scrollBottom() {
      var chatBox = document.getElementById("chatbox");
      chatBox.scrollTop = chatBox.scrollHeight;
    }


// 3. Finally, define other functions that use the socket
function sendMessage() {
    console.log("Sending message...");
    var message = document.getElementById('message').value;
    socket.emit('send_message', { message: message });
    document.getElementById('message').value = '';
    scrollBottom();
 }
        
