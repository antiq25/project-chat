
const currentUserId = "{{ current_user }}";

const user = "{{ receiver.id }}"; 

socket.on('update_user_list', function(data) {
    const users = data.users;
    const userList = document.getElementById('update_user_list');
    userList.innerHTML = '';  // Clear the current list

    users.forEach(user => {
      const div = document.createElement('div');
      div.classList.add('messenger-item');

      const userLink = document.createElement('a');
      userLink.href = '#';
      userLink.dataset.toggle = 'messenger-content';
      userLink.classList.add('messenger-link');

      // Create user image
      const userImage = document.createElement('div');
      userImage.classList.add('messenger-media', 'bg-theme', 'text-theme-color', 'rounded-pill', 'fs-24px', 'fw-bold');

      const img = document.createElement('img');
      img.src = user.profile_pic || '/static/uploads/default_image.webp';
      img.alt = user.display_name || 'Default User';
      img.width = 50;
      img.classList.add('rounded-circle');

      // Add click event to the image to show modal
      img.addEventListener('click', function() {
          showModal(user);
      });

      userImage.appendChild(img);

      // User Info
      const userInfo = document.createElement('div');
      userInfo.classList.add('messenger-info');

      const userName = document.createElement('div');
      userName.classList.add('messenger-name');
      userName.innerText = user.display_name || user.username;

      const userText = document.createElement('div');
      userText.classList.add('messenger-text');
      userText.innerText = 'Click to chat';  // Placeholder text, change as needed

      userInfo.appendChild(userName);
      userInfo.appendChild(userText);

      // Appending elements to the main link
      userLink.appendChild(userImage);
      userLink.appendChild(userInfo);
      div.appendChild(userLink);

      userList.appendChild(div);
    });
});




   function showModal(user) {
    const modalImage = document.getElementById("userModalImage");
    const modalName = document.getElementById("userModalName");
    const iframeElement = document.getElementById('privateMessageIframe');

    modalImage.src = user.profile_pic || '/static/uploads/default_image.webp';
    modalName.textContent = user.display_name || user.username;
    
    // Set the source of the iframe to the correct URL
    iframeElement.src = `/private/${user.id}`;

    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    userModal.show();
}


// MODALS ///



const clearInboxBtn = document.getElementById("clearInboxBtn");

if (clearInboxBtn) {  // Ensure the button exists
    clearInboxBtn.addEventListener("click", () => {
        // Retrieve the CSRF token from the meta tag (assuming you're using Flask-WTF or similar)
        const csrfMetaTag = document.querySelector('meta[name="csrf-token"]');
        const csrfToken = csrfMetaTag ? csrfMetaTag.getAttribute('content') : null;

        if (!csrfToken) {
            console.error("CSRF token not found.");
            return;
        }

        fetch("/clear_inbox", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error("Response text:", text);
                    throw new Error(`Server responded with status ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                console.log("Successfully cleared inbox.");
                window.location.href = "/"; // Redirect to the inbox route
            } else {
                console.error("Server responded without success. Full response:", data);
            }
        })
        .catch(error => {
            console.error("Error clearing inbox:", error);
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    if (sessionStorage.getItem("openModalAfterReload") === "true") {
        const inboxModal = new bootstrap.Modal(document.getElementById('inboxModal'));
        inboxModal.show();
        sessionStorage.removeItem("openModalAfterReload");
    }
});

function fetchPrivateMessages(userId) {
    fetch(`/private_messages/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {

        const messagesList = document.getElementById("privateMessagesList");
        messagesList.innerHTML = '';  // Clear current messages

        data.messages.forEach(message => {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            messageDiv.innerText = message.content;
            messagesList.appendChild(messageDiv);
        });
    })
    .catch(error => {
        console.error("Error fetching private messages:", error);
    });
}


// START NOTIFICATIONS //////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function() {
    fetchAndDisplayUnreadNotifications();
    checkForNewPrivateMessages();
    setInterval(fetchAndDisplayUnreadNotifications, 5000);
    setInterval(checkForNewPrivateMessages, 5000);
});

function fetchAndDisplayUnreadNotifications() {
    fetch("/fetch_notifications", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.notifications && Array.isArray(data.notifications)) {
            data.notifications.forEach(notification => {
                displayNotificationInUI(notification);
            });
        } else {
            console.error('No notifications array in the response or the response structure is unexpected:', data);
        }
    })
    .catch(error => console.error('Error fetching unread notifications:', error));
}

function displayNotificationInUI(notification) {
    console.log("Displaying notification with data:", notification);
    const existingNotification = document.querySelector(`[data-id="${notification.id}"]`);
    if (existingNotification) {
        console.log(`Notification with ID ${notification.id} already displayed.`);
        return;
    }

    const notificationList = document.getElementById('notificationList');
    if (!notificationList) {
        console.error("Notification list element not found!");
        return;
    }

    const notificationElement = document.createElement('div');
    notificationElement.innerHTML = `
        <strong>Notification:</strong> ${notification.content}
        <small>${new Date(notification.timestamp).toLocaleTimeString()}</small>
        <button class="btn btn-sm btn-outline-danger mt-2" onclick="markNotificationAsRead(this)">Close</button>
    `;
    notificationElement.setAttribute('data-id', notification.id);
    notificationList.appendChild(notificationElement);
}

function checkForNewPrivateMessages() {

    const notificationsData = JSON.parse(localStorage.getItem('privateMessages') || '[]');
    let newNotificationsCount = 0;

    notificationsData.forEach(notification => {
        if (notification.senderId !== currentUserId) {
            displayNotificationInUI(notification);
            newNotificationsCount++;
        }
    });

    const countElement = document.getElementById('notificationCount');
    let currentCount = parseInt(countElement.textContent) || 0;
    currentCount += newNotificationsCount;
    countElement.textContent = currentCount;
    if (currentCount > 0) {
        countElement.style.display = 'block';
    } else {
        countElement.style.display = 'none';
    }

    localStorage.removeItem('privateMessages');
}

function markNotificationAsRead(element) {
    const notificationElement = element.parentElement;
    const notificationId = notificationElement.getAttribute('data-id');

    console.log("Trying to mark notification with ID:", notificationId, "as read.");

    const url = '/mark_notification_read/' + notificationId;

    // Fetch the CSRF token from the meta tag
    const csrfMetaTag = document.querySelector('meta[name="csrf-token"]');
    if (!csrfMetaTag) {
        console.error("CSRF token meta tag not found!");
        return;
    }
    const csrfToken = csrfMetaTag.getAttribute('content');

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken
        }
    })

    .then(response => {
        // If the response is not OK, log the response text for more details
        if (!response.ok) {
            return response.text().then(text => {
                console.error("Server responded with details:", text);
                throw new Error(`Server responded with status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === "success") {
            console.log("Successfully marked notification as read.");
            element.parentElement.remove();
        } else {
            console.error("Error marking notification as read:", data.message);
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });
}

socket.on('notification', function(data) {
    console.log("Notification data received:", data);
    displayNotificationInUI(data);
});
// END NOTIFICATIONS ///////////////
