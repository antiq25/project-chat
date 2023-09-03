function loadConversations() {
    fetch('/conversations')
        .then(response => response.json())
        .then(data => {
            const conversationsList = document.getElementById('conversations');
            conversationsList.innerHTML = ''; // Clear previous conversations
            data.forEach(conversation => {
                const convoElement = document.createElement('div');
                convoElement.innerHTML = `<strong>${conversation.username}</strong>: ${conversation.latest_message}`;
                conversationsList.appendChild(convoElement);
            });
        });
}
