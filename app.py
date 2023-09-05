from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms, close_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_cors import CORS
from flask_wtf import CSRFProtect
import logging
import os

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1) # This a production level server 
CORS(app)
app.config["SECRET_KEY"] = os.urandom(24)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///chat.db"
db = SQLAlchemy(app)
csrf = CSRFProtect(app)

#socketio = SocketIO(app)
socketio = SocketIO(app, async_mode="gevent", cors_allowed_origins="*")
#socketio = SocketIO(app, manage_session=False)

UPLOAD_FOLDER = os.path.join(app.root_path, "static", "uploads")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

online_users = {}

logging.basicConfig(filename='app.log', level=logging.INFO)
app.logger.addHandler(logging.StreamHandler())



class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    display_name = db.Column(db.String(80), nullable=True)
    profile_pic = db.Column(db.String(120), nullable=True)  # Path to the profile picture
    password = db.Column(db.String(120), nullable=False)
    sent_messages = db.relationship("Message", backref="sender", foreign_keys="Message.sender_id")
    received_messages = db.relationship("Message", backref="receiver", foreign_keys="Message.receiver_id")

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    content = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    receiver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    read = db.Column(db.Boolean, default=False)

    
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    message_id = db.Column(db.Integer, db.ForeignKey("message.id"))
    content = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    read = db.Column(db.Boolean, default=False)



def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(e):
    app.logger.error(f"Server error: {e}")
    return render_template('500.html'), 500

@app.route("/test", methods=["GET"])    
def test():
    return render_template("index-2.html")


@app.route("/profile", methods=["GET", "POST"])
def profile():
    user = User.query.filter_by(id=session["user_id"]).first()
    if request.method == "POST":
        display_name = request.form.get("display_name")
        profile_pic = request.files.get("profile_pic")
        filename = None
        if profile_pic and allowed_file(profile_pic.filename):
            filename = secure_filename(profile_pic.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            profile_pic.save(filepath)
            relative_path = os.path.join("uploads", filename)
            user.profile_pic = relative_path
        if display_name:
            user.display_name = display_name
        db.session.commit()
        return redirect(url_for("profile"))
    return render_template("profile.html", user=user)

@app.route("/profile/<int:user_id>", methods=["GET"])
def user_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return "User not found", 404
    return render_template("profile.html", user=user)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session["user_id"] = user.id
            session["username"] = user.username
            return redirect(url_for("index"))
        else:
            return "Invalid credentials", 401
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        hashed_password = generate_password_hash(password)
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return "User already exists!", 400
        user = User(username=username, password=hashed_password)
        db.session.add(user)
        db.session.commit()
        session["user_id"] = user.id
        session["username"] = user.username
        return redirect(url_for("index"))
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.pop("user_id", None)
    session.pop("username", None)
    return redirect(url_for("login"))

@app.route("/")
def index():
    user = get_current_user()

    if "user_id" not in session:
        return redirect(url_for("login"))
    
    current_user = User.query.get(session["user_id"])
    users_online_list = [User.query.get(user["id"]) for user in online_users.values()]
    messages = Message.query.filter(Message.receiver_id == None).all()
    received_messages = Message.query.filter_by(receiver_id=user.id).all()
    senders = set([msg.sender for msg in received_messages])


    return render_template("index.html", messages=messages, username=session["username"], current_user=current_user, users_online=users_online_list, senders=senders, received_messages=received_messages)




@socketio.on("send_private_message")
def handle_private_message(data):
    sender = get_current_user()
    if not sender:
        return  # or handle the error appropriately

    receiver_id = data["receiver_id"]
    content = data["message"]

    # Prevent sending messages to oneself
    if sender.id == receiver_id:
        print("A user tried to send a message to themselves.")
        return

    private_message = Message(sender_id=sender.id, receiver_id=receiver_id, content=content, read=False)
    db.session.add(private_message)
    db.session.commit()

    # Define the notification_message variable
    notification_message = f"You have a new message from {sender.username}"

    # Add a notification to the database
    notification = Notification(user_id=receiver_id, message_id=private_message.id, content=notification_message)
    db.session.add(notification)
    db.session.commit()

    # Emit a simple notification to update the count on the client side
    emit("update_notification_count", {}, room=str(receiver_id))
    
    # Send detailed real-time notification to receiver
    emit("display_notification", {"message": notification_message}, room=str(receiver_id))
    print(f"Notification emitted to {receiver_id} with message: {notification_message}")

    # Emit to receiver
    emit("private_message", {
        "from": sender.id,
        "display_name": sender.username,
        "message": content
    }, room=str(receiver_id))

    # Emit to sender (the current user)
    emit("private_message", {
        "from": sender.id,                                                            
        "display_name": sender.username,
        "message": content
    }, room=request.sid)

    # Emit to receiver to update their conversations list
    emit("update_conversations", {}, room=str(receiver_id))

# Emit to sender (the current user) to update their conversations list
    emit("update_conversations", {}, room=request.sid)

    emit("update_inbox", {}, room=str(receiver_id))






@app.route("/unread_messages_count")
def unread_messages_count():
    user = get_current_user()
    if not user:
        return jsonify({"count": 0})
    
    count = Message.query.filter_by(receiver_id=user.id, read=False).count()
    return jsonify({"count": count})

@app.route("/mark_notification_read/<int:notification_id>", methods=["POST"])
def mark_notification_read(notification_id):
    print(f"Attempting to mark notification {notification_id} as read.") 

    notification = Notification.query.get(notification_id)
    
    
    if not notification:
        print(f"Notification {notification_id} not found.")  # Debugging statement
        return jsonify({"status": "error", "message": "Notification not found"}), 404

    try:
        notification.read = True
        db.session.commit()
        print(f"Notification {notification_id} marked as read.")  # Debugging statement
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error while marking notification {notification_id} as read: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/fetch_notifications")
def fetch_notifications():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not authenticated"}), 401

    notifications = Notification.query.filter_by(user_id=user.id, read=False).all()
    
    # If there are no notifications
    if not notifications:
        return jsonify({"message": "No unread notifications", "notifications": []})
    
    

    # Transform the ORM objects to a list of dictionaries
    notification_dicts = [{
        "id": n.id,
        "content": n.content,
        "timestamp": n.timestamp.isoformat()
    } for n in notifications]

    return jsonify({"message": "Unread notifications fetched successfully", "notifications": notification_dicts})





@socketio.on("join")
def on_join(data):
    user_id = data["user_id"]
    join_room(str(user_id))



@app.route("/private/<int:receiver_id>")
def private_chat(receiver_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
    
    receiver = User.query.get(receiver_id)
    if not receiver:
        return "User not found", 404

    private_messages = Message.query.filter(
        (Message.sender_id == user.id) & (Message.receiver_id == receiver_id) |
        (Message.sender_id == receiver_id) & (Message.receiver_id == user.id)
    ).all()

    unread_messages = Message.query.filter_by(sender_id=receiver_id, receiver_id=user.id, read=False).all()
    for msg in unread_messages:
        msg.read = True
    db.session.commit()

    return render_template("private_chat.html", private_messages=private_messages, current_user=user, receiver=receiver)


def get_current_user():
    if "user_id" in session:
        return User.query.get(session["user_id"])
    return None


@socketio.on("connect")
def user_connected():
    user = get_current_user()
    if user:
        online_users[request.sid] = {
            "display_name": user.display_name or user.username,
            "id": user.id,
            "profile_pic": url_for("static", filename=user.profile_pic) if user.profile_pic else url_for("static", filename="uploads/default_image.webp")
        }
        emit("user_joined", {"display_name": user.display_name or user.username}, broadcast=True)
        emit(
            "update_user_list",
            {"users": list(online_users.values())},
            broadcast=True,
        )


@socketio.on("disconnect")
def user_disconnected():
    if request.sid in online_users:
        display_name_or_username = online_users[request.sid]["display_name"] or online_users[request.sid]["username"]
        del online_users[request.sid]

        # Emit user_left event to notify other users that someone has left the chat
        emit("user_left", {"display_name": display_name_or_username}, broadcast=True)

        emit(
            "update_user_list",
            {"users": [user["display_name"] for user in online_users.values()]},
            broadcast=True,
        )

@socketio.on("send_message")
def handle_message(data):
    if "user_id" in session and "username" in session:
        message = Message(sender_id=session["user_id"], content=data["message"])
        db.session.add(message)
        db.session.commit()
        user = User.query.get(session["user_id"])
        if user is None:
            print(f"No user found with ID: {session['user_id']}")
            return
        if not message.receiver_id:  # Ensure it's a global message
            message_payload = {
                "username": session["username"],
                "display_name": user.display_name or user.username,
                "message": data["message"],
                "profile_pic": url_for("static", filename=user.profile_pic)
                if user.profile_pic
                else url_for("static", filename="uploads/default_image.webp"),
                "user_id": user.id,
            }
            emit("broadcast_message", message_payload, broadcast=True)

@app.route("/conversations", methods=["GET"])
def get_conversations():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not authenticated"}), 401

    # Get all the unique users who have messaged the current user
    senders = db.session.query(Message.sender_id).filter_by(receiver_id=user.id).distinct().all()

    conversations = []
    for sender_id in senders:
        sender = User.query.get(sender_id)
        latest_message = Message.query.filter_by(sender_id=sender_id, receiver_id=user.id).order_by(Message.timestamp.desc()).first()
        conversations.append({
            "id": sender.id,
            "username": sender.username,
            "latest_message": latest_message.content,
            "timestamp": latest_message.timestamp.isoformat()
        })

    return jsonify(conversations)

@app.route("/chat_history/<int:partner_id>", methods=["GET"])
def chat_history(partner_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not authenticated"}), 401

    messages = Message.query.filter(
        (Message.sender_id == user.id) & (Message.receiver_id == partner_id) |
        (Message.sender_id == partner_id) & (Message.receiver_id == user.id)
    ).all()

    chat_history = [{
        "id": m.id,
        "username": User.query.get(m.sender_id).username,
        "content": m.content,
        "timestamp": m.timestamp.isoformat()
    } for m in messages]

    return jsonify(chat_history)

@app.route("/inbox_data")
def inbox_data():
    user = get_current_user()
    received_messages = Message.query.filter_by(receiver_id=user.id).all()
    senders = set([msg.sender for msg in received_messages])

    # Convert the data to a JSON-friendly format
    inbox_data = {
        "received_messages": [{"content": msg.content, "timestamp": msg.timestamp.isoformat(), "sender": msg.sender.username} for msg in received_messages],
        "senders": [{"id": sender.id, "username": sender.username} for sender in senders]
    }

    return jsonify(inbox_data)



@app.route("/clear_inbox", methods=["POST"])
def clear_inbox():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "User not authenticated"}), 401

    # Deleting messages where the user is the receiver
    Message.query.filter_by(receiver_id=user.id).delete()
    # Deleting notifications for the user
    Notification.query.filter_by(user_id=user.id).delete()
    db.session.commit()

    return jsonify({"status": "success", "message": "Inbox cleared successfully"})


@app.cli.command()
def init_db():
    with app.app_context():
        db.create_all()

        users_data = [
            {'username': 'alice', 'password': 'password123'},
            {'username': 'bob', 'password': 'password123'}
        ]

        for user_data in users_data:
            user = User.query.filter_by(username=user_data['username']).first()
            if not user:
                hashed_pwd = generate_password_hash(user_data['password'])
                user = User(username=user_data['username'], password=hashed_pwd)
                db.session.add(user)
        db.session.commit()


if __name__ == '__main__':
    socketio.run(app, debug=True)
