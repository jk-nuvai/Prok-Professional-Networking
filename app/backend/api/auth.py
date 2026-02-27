from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models.user import User, db

auth_bp = Blueprint('auth', __name__)


def _bad(msg: str, code: int = 400):
    return jsonify({'message': msg}), code


# ── POST /api/signup ────────────────────────────────────────────────────────
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(force=True, silent=True) or {}

    username = (data.get('username') or '').strip()
    email    = (data.get('email')    or '').strip().lower()
    password = data.get('password')  or ''

    # Basic validation
    if not username:
        return _bad('Username is required.')
    if len(username) < 3:
        return _bad('Username must be at least 3 characters.')
    if not email or '@' not in email:
        return _bad('A valid email is required.')
    if not password:
        return _bad('Password is required.')
    if len(password) < 8:
        return _bad('Password must be at least 8 characters.')

    # Uniqueness checks
    if User.query.filter_by(username=username).first():
        return _bad('Username already taken.', 409)
    if User.query.filter_by(email=email).first():
        return _bad('Email already registered.', 409)

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Account created successfully.',
        'token':   token,
        'user':    user.to_dict(),
    }), 201


# ── POST /api/login ─────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or {}

    identifier = (data.get('username') or data.get('email') or '').strip()
    password   = data.get('password') or ''

    if not identifier:
        return _bad('Username or email is required.')
    if not password:
        return _bad('Password is required.')

    # Look up by username first, then email
    user = (User.query.filter_by(username=identifier).first()
            or User.query.filter_by(email=identifier.lower()).first())

    if not user or not user.check_password(password):
        return _bad('Invalid credentials.', 401)

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Logged in successfully.',
        'token':   token,
        'user':    user.to_dict(),
    }), 200
