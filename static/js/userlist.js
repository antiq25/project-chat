
    // Listen for the 'update_user_list' event from the server
    socket.on('update_user_list', data => {
        const userListContainer = document.getElementById('update_user_list').querySelector('.ps');
        
        // Clear the current list
        userListContainer.innerHTML = '';
        
        // Populate the list with the updated users
        data.users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.classList.add('messenger-item', 'messenger-user', 'show'); 

            const userPic = user.profile_pic ? user.profile_pic : 'uploads/default_image.webp';
            const displayName = user.display_name ? user.display_name : user.username;
            const profileLink = `/profile/${user.id}`;
            const chatLink = `/private/${user.id}`;

            userItem.innerHTML = `
                <a href="${chatLink}" data-toggle="messenger-content" class="messenger-link">
                    <div class="messenger-media">
                        <img src="${userPic}" alt="${displayName}" width="50" class="card-img rounded-circle">
                    </div>
                    <div class="messenger-info">
                        <div class="messenger-name">${displayName}</div>
                        <div class="dropdown-backdrop">
                            <a href="#" class="dropdown-toggle" data-bs-toggle="dropdown">Options</a>
                            <div class="dropdown-menu">
                                <a class="dropdown-item btn-primary" href="${profileLink}">View Profile</a>
                                <a class="dropdown-item" href="${chatLink}">Chat with ${displayName}</a>
                            </div>
                        </div>
                    </div>
                </a>
            `;

            userListContainer.appendChild(userItem);
            setTimeout(() => userItem.classList.add('show'), 100); // Add a slight delay for animation
        });
    });

