socket.on('update_user_list', function(data) {
    const users = data.users;
    const userList = document.getElementById('update_user_list');
    userList.innerHTML = '';  // Clear the current list

    users.forEach(user => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'align-items-center', 'gap-3');

        // Create user image
        const userImage = document.createElement('img');
        userImage.src = user.profile_pic || '/static/uploads/default_image.webp';
        userImage.alt = user.display_name || 'Default User';
        userImage.width = 50;
        userImage.classList.add('rounded-circle');
        li.appendChild(userImage);

        // Create dropdown div
        const dropdownDiv = document.createElement('div');
        dropdownDiv.classList.add('dropdown');

        // Create dropdown toggle
        const dropdownToggle = document.createElement('a');
        dropdownToggle.href = '#';
        dropdownToggle.classList.add('profile-link', 'fs-5', 'dropdown-toggle');
        dropdownToggle.dataset.bsToggle = 'dropdown';
        dropdownToggle.innerText = user.display_name || user.username;
        dropdownDiv.appendChild(dropdownToggle);

        // Create dropdown menu
        const dropdownMenu = document.createElement('ul');
        dropdownMenu.classList.add('dropdown-menu');

        // Create profile link
        const profileItem = document.createElement('li');
        const profileLink = document.createElement('a');
        profileLink.href = `/profile/${user.id}`;
        profileLink.classList.add('dropdown-item');
        profileLink.innerText = 'View Profile';
        profileItem.appendChild(profileLink);
        dropdownMenu.appendChild(profileItem);

        // Create chat link
        const chatItem = document.createElement('li');
        const chatLink = document.createElement('a');
        chatLink.href = `/private/${user.id}`;
        chatLink.classList.add('dropdown-item');
        chatLink.innerText = `Chat with ${user.username || user.display_name}`;
        chatItem.appendChild(chatLink);
        dropdownMenu.appendChild(chatItem);

        dropdownDiv.appendChild(dropdownMenu);
        li.appendChild(dropdownDiv);
        userList.appendChild(li);
    });
});
