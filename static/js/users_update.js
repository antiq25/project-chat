
socket.on('update_user_list', function(data) {
    const users = data.users;
    const userList = document.getElementById('update_user_list');
    userList.innerHTML = '';  // Clear the current list

    users.forEach(user => {
        const li = document.createElement('li');

        // Create chat link
        const chatLink = document.createElement('a');
        chatLink.href = `/private/${user.id}`;
        chatLink.innerText = `Chat with ${user.display_name}`;
        li.appendChild(chatLink);

        // Create user image
        const userImage = document.createElement('img');
        userImage.src = user.profile_pic;
        userImage.alt = user.display_name;
        userImage.width = 30;
        userImage.classList.add('rounded-circle');
        li.appendChild(userImage);

        // Create profile link
        const profileLink = document.createElement('a');
        profileLink.href = `profile/${user.id}`;
        profileLink.classList.add('profile-link');
        profileLink.innerText = user.display_name;
        li.appendChild(profileLink);

        userList.appendChild(li);
    });
});
