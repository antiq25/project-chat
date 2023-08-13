from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_cors import CORS
import os

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)
CORS(app)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
db = SQLAlchemy(app)
socketio = SocketIO(app, async_mode='gevent', cors_allowed_origins="*")

UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

online_users = {}
  # Required for tracking online users


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    display_name = db.Column(db.String(80), nullable=True)
    profile_pic = db.Column(db.String(120), nullable=True)  # Path to the profile picture
    password = db.Column(db.String(120), nullable=False)
    messages = db.relationship('Message', back_populates='sender')


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    content = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    sender = db.relationship('User', back_populates='messages')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    # Ensure user is logged in
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.filter_by(id=session['user_id']).first()

    if request.method == 'POST':
        display_name = request.form.get('display_name')
        profile_pic = request.files.get('profile_pic')
        filename = None
        if profile_pic and allowed_file(profile_pic.filename):
            filename = secure_filename(profile_pic.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            profile_pic.save(filepath)
            relative_path = os.path.join('uploads', filename)
            user.profile_pic = relative_path  # Store the relative path
        if display_name:
            user.display_name = display_name
        db.session.commit()
        return redirect(url_for('profile'))

    return render_template('profile.html', user=user)



@app.route('/profile/<int:user_id>', methods=['GET'])
def user_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return "User not found", 404
    return render_template('profile.html', user=user)



@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            return redirect(url_for('index'))
        else:
            return 'Invalid credentials', 401

    return render_template('login.html')


@socketio.on('connect')
def user_connected():
    user = get_current_user()
    if user:
        online_users[request.sid] = {'display_name': user.display_name or user.username, 'id': user.id}
        emit('update_user_list', {'users': [user['display_name'] for user in online_users.values()]}, broadcast=True)

@socketio.on('disconnect')
def user_disconnected():
    if request.sid in online_users:
        del online_users[request.sid]
        emit('update_user_list', {'users': [user['display_name'] for user in online_users.values()]}, broadcast=True)

@socketio.on('send_message')
def handle_message(data):
    if 'user_id' in session and 'username' in session:
        message = Message(sender_id=session['user_id'], content=data['message'])

        db.session.add(message)
        db.session.commit()
        user = User.query.get(session['user_id'])

        # Check if user exists
        if user is None:
            print(f"No user found with ID: {session['user_id']}")
            return

        # Construct the message once
        message_payload = {
            'username': session['username'],
            'display_name': user.display_name or user.username,
            'message': data['message'],
            'profile_pic': url_for('static', filename=user.profile_pic) if user.profile_pic else url_for('static', filename='uploads/default_image.png'),
            'user_id': user.id
        }

        # Broadcast message
        emit('broadcast_message', message_payload, broadcast=True)


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

# [ ... ] your routes and socket events

if __name__ == '__main__':
    socketio.run(app, debug=True)