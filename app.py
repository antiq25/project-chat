from flask import Flask, render_template, request, redirect, url_for, session, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms, close_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_cors import CORS
import os

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)
CORS(app)
app.config["SECRET_KEY"] = os.urandom(24)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///chat.db"
db = SQLAlchemy(app)
socketio = SocketIO(app)
socketio = SocketIO(app, async_mode="gevent", cors_allowed_origins="*")

UPLOAD_FOLDER = os.path.join(app.root_path, "static", "uploads")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

online_users = {}

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

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

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
    if "user_id" not in session:
        return redirect(url_for("login"))
    current_user = User.query.get(session["user_id"])
    users_online_list = [User.query.get(user["id"]) for user in online_users.values()]
    messages = Message.query.filter(Message.receiver_id == None).all()

    return render_template("index.html", messages=messages, username=session["username"], current_user=current_user, users_online=users_online_list)

@socketio.on("send_private_message")
def handle_private_message(data):
    sender = User.query.get(session["user_id"])
    receiver_id = data["receiver_id"]
    content = data["message"]

    private_message = Message(sender_id=sender.id, receiver_id=receiver_id, content=content)
    db.session.add(private_message)
    db.session.commit()

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
    }, room=request.sid)  # request.sid is the current user's socket session id



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

