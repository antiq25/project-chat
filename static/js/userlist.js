socket.on('update_user_list', data => {
    const userListContainer = document.getElementById('onlineUsers');

    // Clear the current list
    userListContainer.innerHTML = '';

    // Populate the list with the updated users
    data.users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.classList.add('messenger-item', 'messenger-user', 'show');

        const userPic = user.profile_pic ? user.profile_pic : 'uploads/default_image.webp';
        const displayName = user.display_name ? user.display_name : user.username;
        const chatLink = `/private/${user.id}`;

        userItem.innerHTML = `
            <div class="card-body">
                <div class="d-flex">
                    <div class="messenger-media">
                        <img class="img-portrait-xs rounded-3" src="${userPic}" alt="${displayName}" width="50" class="card-img rounded-circle">
                        <span href="${chatLink}">chat with ${displayName}</span>
                    </div>
                </div>
            </div>`;

        userItem.addEventListener('click', function() {
            openPrivateChat(user.id, displayName);
        });

        userListContainer.appendChild(userItem);
    });
  });