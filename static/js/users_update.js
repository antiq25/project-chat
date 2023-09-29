// START NOTIFICATIONS //////////////////////////////////////////////

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
            if (data.notifications.length > 0) {
                localStorage.setItem('hasNewNotification', 'true');  // Setting a flag
                showDot();
                data.notifications.forEach(notification => {
                    displayNotificationInUI(notification);
                });
            }
        } else {
            console.error('No notifications array in the response or the response structure is unexpected:', data);
        }
    })
    .catch(error => console.error('Error fetching unread notifications:', error));
}

function showDot() {
  const dot = document.getElementById('notificationDot');
  const menuIcon = document.querySelector('.bi-bell');
  if (localStorage.getItem('hasNewNotification') === 'true') {
    dot.style.display = 'inline-block';
    menuIcon.classList.add('new-notification');
  } else {
    dot.style.display = 'none';
    menuIcon.classList.remove('new-notification');
  }
}

function hideDot() {
    localStorage.removeItem('hasNewNotification');
    const dot = document.getElementById('notificationDot');
    dot.style.display = 'none';
}


function displayNotificationInUI(notification) {
    const existingNotification = document.querySelector(`[data-id="${notification.id}"]`);
    if (existingNotification) {
        return;
    }

    const notificationList = document.getElementById('notificationList');
    if (!notificationList) {
        console.error("Notification list element not found!");
        return;
    }

    const notificationElement = document.createElement('div');
    notificationElement.innerHTML = `
        <div class="alert alert-primary">Notification:</div> ${notification.content}
        <span>${new Date(notification.timestamp).toLocaleTimeString()}</span>
        <button class="btn btn-sm btn-outline-danger mt-2" onclick="markNotificationAsRead(this)">Close</button>
        </div>
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
  .then(response => response.json())
  .then(data => {
    if (data.status === "success") {
      element.parentElement.remove();
      hideDot();
    }
  })
  .catch(error => {});
}


socket.on('notification', function(data) {
    displayNotificationInUI(data);
});
// END NOTIFICATIONS ///////////////

document.addEventListener("DOMContentLoaded", function() {
    fetchAndDisplayUnreadNotifications();
    checkForNewPrivateMessages();
    setInterval(fetchAndDisplayUnreadNotifications, 5000);
    setInterval(checkForNewPrivateMessages, 5000);
    showDot();  // Call this here
});

// Assuming you've already established a connection to the socket
socket.on('notification_read', function(data) {
    console.log("Notification read event received for ID:", data.notification_id);
    
    // Remove the specific notification from the UI
    const readNotification = document.querySelector(`[data-id="${data.notification_id}"]`);
    if (readNotification) {
        readNotification.remove();
    }
    
    // Check if there are any more notifications left
    const remainingNotifications = document.querySelectorAll('[data-id]');
    if (remainingNotifications.length === 0) {
        // If no notifications are left, hide the red dot
        document.getElementById('redDot').style.display = 'none';
    }
});
