socket.on('update_user_list', data => {
    const userListContainer = document.getElementById('onlineUsers');
    userListContainer.innerHTML = ''; // Clear the current list

    data.users.forEach(user => {
        const userPic = user.profile_pic || 'uploads/default_image.png';
        const displayName = user.display_name || user.username;

        const userItem = document.createElement('div');
        userItem.className = 'messenger-item messenger-user show';

        userItem.innerHTML = `
            <div class="card-body">
                <div class="d-flex">
                    <div class="messenger-media">
                        <img class="img-portrait-xs rounded-3" src="${userPic}" alt="${displayName}" width="50">
                        <span>${displayName}</span>
                        <button class="btn-icon chatBtn" data-user-id="${user.id}" title="Chat with ${displayName}"><i class="bi bi-chat-text"></i></button>
                        <button class="btn-icon profileBtn" title="View ${displayName}'s profile"><i class="bi bi-person"></i></button>
                    </div>
                </div>
            </div>`;

userItem.querySelector('.chatBtn').addEventListener('click', function(event) {
    event.stopPropagation();
    const userId = event.currentTarget.getAttribute('data-user-id');
    openPrivateChat(userId, displayName);
    const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
    chatModal.show();
});

        userItem.querySelector('.profileBtn').addEventListener('click', function(event) {
            event.stopPropagation();
            document.getElementById('userProfilePic').src = userPic;
            document.getElementById('userProfileName').textContent = displayName;
            const userProfileModal = new bootstrap.Modal(document.getElementById('userProfileModal'));
            userProfileModal.show();
        });

        userListContainer.appendChild(userItem);
    });
});
