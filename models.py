from __init__ import db, login_manager
from flask_login import UserMixin
from datetime import datetime


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password      = db.Column(db.String(200), nullable=False)
    date_joined   = db.Column(db.DateTime, default=datetime.utcnow)
    saved_squads  = db.relationship('SavedSquad', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'


class Player(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    player_name    = db.Column(db.String(100), nullable=False)
    country        = db.Column(db.String(50), nullable=False)
    player_role    = db.Column(db.String(50), nullable=False)   # Batsman / Bowler / All-Rounder
    status         = db.Column(db.String(20), default='Active') # Active / Retired
    matches        = db.Column(db.Integer, default=0)
    runs           = db.Column(db.Float, default=0)
    average        = db.Column(db.Float, default=0)
    strike_rate    = db.Column(db.Float, default=0)
    wickets        = db.Column(db.Integer, default=0)
    economy        = db.Column(db.Float, default=0)
    centuries      = db.Column(db.Integer, default=0)
    fifties        = db.Column(db.Integer, default=0)
    recent_form    = db.Column(db.String(20), default='Average')  # Good / Average / Poor
    perf_score     = db.Column(db.Float, default=0)

    def __repr__(self):
        return f'<Player {self.player_name}>'


class SavedSquad(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    country        = db.Column(db.String(50))
    opposition     = db.Column(db.String(50))
    match_format   = db.Column(db.String(20))
    venue_type     = db.Column(db.String(20))
    pitch_type     = db.Column(db.String(20))
    weather        = db.Column(db.String(20))
    players_json   = db.Column(db.Text)             # JSON string of 11 players
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<SavedSquad {self.country} vs {self.opposition}>'
