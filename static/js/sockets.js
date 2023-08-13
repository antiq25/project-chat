// 1. Initialize the socket first
// Adjusting for potential HTTPS
var protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
var socket = io.connect(protocol + document.domain + ':' + location.port);

// 2. Then, listen to events using the socket
socket.on('broadcast_message', function(data) {
    var chatbox = document.getElementById('chatbox');
    
    // Create message structure safely to avoid potential XSS
    var messageDiv = document.createElement("div");
    messageDiv.className = "d-flex align-items-start mb-2";
    
    var profileLink = document.createElement("a");
    profileLink.href = "/profile/" + data.user_id;
    profileLink.className = "profile-link me-2";
    profileLink.title = "View profile";
    
    var profileImage = document.createElement("img");
    profileImage.src = data.profile_pic || '/path_to_default_image.jpg';
    profileImage.alt = data.username;
    profileImage.width = 40;
    profileImage.className = "rounded-circle";
    
    profileLink.appendChild(profileImage);
    messageDiv.appendChild(profileLink);
    
    var messageContentDiv = document.createElement("div");
    var usernameLink = document.createElement("a");
    usernameLink.href = "/profile/" + data.user_id;
    usernameLink.className = "profile-link";
    usernameLink.textContent = data.username;
    
    messageContentDiv.appendChild(usernameLink);
    messageContentDiv.appendChild(document.createTextNode(": " + data.message));
    
    messageDiv.appendChild(messageContentDiv);
    
    chatbox.appendChild(messageDiv);
    
    chatbox.scrollTop = chatbox.scrollHeight;
    // Re-initialize tooltips for new messages
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// 3. Finally, define other functions that use the socket
function sendMessage() {
    console.log("Sending message...");
    var message = document.getElementById('message').value;
    socket.emit('send_message', { message: message });
    document.getElementById('message').value = '';
}
