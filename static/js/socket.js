// 1. Initialize the socket first
var socket = io.connect('http://' + document.domain + ':' + location.port);

// 2. Then, listen to events using the socket

socket.on('broadcast_message', function(data) {
    var chatbox = document.getElementById('chatbox');
    var messageHTML = `
    <div class="d-flex align-items-start mb-2">
        <a href="/profile/${data.user_id}" class="profile-link me-2" title="View profile" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-content="<img src='${data.profile_pic}' width='50'><br>${data.username}">
            <img src="${data.profile_pic}" alt="${data.username}" width="40" class="rounded-circle">
        </a>
        <div>
            <strong><a href="/profile/${data.user_id}" class="profile-link">${data.username}</a></strong>: ${data.message}
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

socket.on('user_joined', function(data) {
    var chatbox = document.getElementById('chatbox');
    var messageHTML = `<div class="text-muted">${data.username} has joined the chat.</div>`;
    chatbox.innerHTML += messageHTML;
    chatbox.scrollTop = chatbox.scrollHeight;
});

socket.on('update_user_list', function(data) {
    var userList = document.getElementById('online-users');
    userList.innerHTML = '';  // Clear the current list
    data.users.forEach(function(user) {
        userList.innerHTML += `<li class="list-group-item">${user}</li>`;
    });
});

// 3. Finally, define other functions that use the socket
function sendMessage() {
    console.log("Sending message...");
    var message = document.getElementById('message').value;
    socket.emit('send_message', { message: message });
    document.getElementById('message').value = '';
}
