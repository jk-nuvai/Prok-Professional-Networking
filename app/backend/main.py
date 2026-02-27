from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from config import Config
from models.user import db

# Optional models that may not be implemented yet
try:
    from models.profile import Profile  # noqa: F401
except ImportError:
    Profile = None

migrate = Migrate()
jwt     = JWTManager()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r'/api/*': {'origins': '*'}})

    # Blueprints
    from api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api')

    return app


app = create_app()


if __name__ == '__main__':
    app.run(debug=True)
