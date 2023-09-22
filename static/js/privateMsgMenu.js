let isChatOpen = false;
let receiverId = null;
let isSidebarOpen = true;



function toggleChat() {
    const chatContent = document.getElementById('chatContent');
    if (isChatOpen) {
        chatContent.style.display = 'none';
        isChatOpen = false;
    } else {
        chatContent.style.display = 'block';
        isChatOpen = true;  // Fixed typo here
    }
}


function toggleSidebar() {
    const appElement = document.querySelector('.app');

    // Toggle the classes for desktop
    if (appElement.classList.contains('app-sidebar-collapsed')) {
        appElement.classList.remove('app-sidebar-collapsed');
    } else {
        appElement.classList.add('app-sidebar-collapsed');
    }

    // Toggle the classes for mobile
    if (appElement.classList.contains('app-sidebar-mobile-toggled')) {
        appElement.classList.remove('app-sidebar-mobile-toggled');
    } else {
        appElement.classList.add('app-sidebar-mobile-toggled');
    }

    // Dismiss the sidebar if it's toggled
    if (appElement.classList.contains('app-sidebar-toggled')) {
        appElement.classList.remove('app-sidebar-toggled');
    }
}




// HANDLING PRIVATE MESSAGES


function handlePrivateMessageSubmission(event) {
    event.preventDefault();
    const message = privateMessageInput.value.trim();
    if (message) {
        socket.emit('send_private_message', {
            sender_id: "{{ current_user.id }}",
            receiver_id: receiverId,
            message,
        });
        privateMessageInput.value = '';
    }
}

const privateMessageForm = document.getElementById('private-chat-form');
const privateMessageInput = document.getElementById('private-message-input');
const privateMessagesList = document.getElementById('private-messages');
if (!privateMessagesList) {
    console.error('privateMessagesList element not found!');
}


function appendMessageToChatbox(data) {
  const messageDiv = document.createElement('div');
messageDiv.className = 'd-flex align-items-center';

const strongElement = document.createElement('strong');
strongElement.textContent = data.display_name || data.from;

messageDiv.appendChild(strongElement);

const messageText = document.createTextNode(`: ${data.message}`);
messageDiv.appendChild(messageText);

privateMessagesList.appendChild(messageDiv);

}


socket.on('private_message', function (data) {
    console.log("Processing received private message:", data);
    if (!privateMessagesList) {
        console.error('privateMessagesList element not found!');
        return;
    }
    appendMessageToChatbox(data);
    scrollBottom();
});




function scrollBottom() {
    const privateMessages = document.getElementById('private-messages');
    privateMessages.scrollTop = privateMessages.scrollHeight;
}

window.onload = function () {
    privateMessageInput.focus();
    scrollBottom();
};

privateMessageForm.removeEventListener('submit', handlePrivateMessageSubmission);
privateMessageForm.addEventListener('submit', handlePrivateMessageSubmission);

function openPrivateChat(userId, username) {
    receiverId = userId;
    const receiverUsername = document.getElementById('receiverUsername');
    if (receiverUsername) { // Check if the element exists
        receiverUsername.textContent = username;
    }

    // Fetch chat history
    fetch(`/chat_history/${userId}`)
    .then(response => response.json())
    .then(data => {
        // Clear existing messages
        privateMessagesList.innerHTML = '';

        // Populate chat with history
        data.forEach(message => {
            const privateMessageElement = document.createElement('div');
            privateMessageElement.classList.add('d-flex', 'align-items-center', 'mb-2');
            privateMessageElement.innerHTML = `<strong>${message.username}</strong>: ${message.content}`;
            privateMessagesList.appendChild(privateMessageElement);
        });
        scrollBottom();
    });

    document.getElementById('privateChatContent').style.display = 'block';
}



const userElements = document.querySelectorAll('.messenger-user');
userElements.forEach(function (element) {
    const userId = element.getAttribute('data-user-id');
    const username = element.textContent;
    element.addEventListener('click', function () {
        openPrivateChat(userId, username);
    });
});


socket.on('user_menu_opened', function () {
    if (isChatOpen) {
        document.getElementById('chatContent').style.display = 'none';
        isChatOpen = false;
    }
});

function showPrivateChat() {
    const privateChatContent = document.getElementById('privateChatContent');
    privateChatContent.style.display = 'block';
}

privateMessagesList.scrollTop = privateMessagesList.scrollHeight;