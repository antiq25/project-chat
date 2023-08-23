var socket = io.connect();
socket.on('broadcast_message', function (data) {
    var chatbox = document.getElementById('chatbox');
    var displayName = data.display_name || data.username; 
    var messageHTML = `<div class="d-flex align-items-start mb-2"><a href="/profile/${data.user_id}" class="profile-link me-2" title="View profile" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-content="<img src='${data.profile_pic}' width='50'><br>${displayName}"><img src="${data.profile_pic}" alt="${displayName}" width="40" class="rounded-circle"></a><div><strong><a href="/profile/${data.user_id}" class="profile-link">${displayName}</a></strong>: ${data.message}</div></div>`;

    chatbox.innerHTML += messageHTML;
    chatbox.scrollTop = chatbox.scrollHeight;

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
    var displayName = data.display_name || data.username;
    var messageHTML = `<div class="text-muted">${displayName} has left the chat.</div>`;
    chatbox.innerHTML += messageHTML;
    chatbox.scrollTop = chatbox.scrollHeight;
});

socket.on('update_user_list', function (data) {
    var userList = document.getElementById('online-users');
    userList.innerHTML = '';
    
    data.users.forEach(function (userOrDisplayName) {
        var displayName, profilePicSrc, userId;

        // Check if userOrDisplayName is an object (user object)
        if (typeof userOrDisplayName === 'object') {
            displayName = userOrDisplayName.display_name || userOrDisplayName.username;
            profilePicSrc = userOrDisplayName.profile_pic || '../static/uploads/default_image.webp';
            userId = userOrDisplayName.id;
        } else { // if it's just a display name string
            displayName = userOrDisplayName;
            profilePicSrc = '../static/uploads/default_image.webp'; // Default image
            userId = ""; // Unknown user ID in this case
        }

        userList.innerHTML += `
            <li class="list-group-item">
                <img src="${profilePicSrc}" alt="${displayName}" width="30" class="rounded-circle">
                <a href="/profile/${userId}" class="profile-link">${displayName}</a>
            </li>`;
    });
});


function checkKey(event) {
    if (event.keyCode === 13) { 
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
