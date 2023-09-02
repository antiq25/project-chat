const currentUserId = "{{ current_user }}";

document.addEventListener("DOMContentLoaded", function() {
    fetchAndDisplayUnreadNotifications();
    checkForNewPrivateMessages();
    setInterval(fetchAndDisplayUnreadNotifications, 5000);
    setInterval(checkForNewPrivateMessages, 5000);
});

function fetchAndDisplayUnreadNotifications() {
    fetch("/fetch_notifications")
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

