from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()
bcrypt = Bcrypt()
mail = Mail()

login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)

    from routes.auth import auth
    from routes.players import players
    from routes.squad import squad
    from routes.main import main
    from routes.analytics import analytics

    app.register_blueprint(auth)
    app.register_blueprint(players)
    app.register_blueprint(squad)
    app.register_blueprint(main)
    app.register_blueprint(analytics)

    with app.app_context():
        db.create_all()

    return app
