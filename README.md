# Cricket Squad Predictor

Cricket Squad Predictor is a Flask-based web application for player analysis and smart squad selection. It combines player statistics with ML models to support better team decisions.

## Features
- User authentication: register, login, logout, and dashboard
- Player module: list, filter, search, compare, and top players
- Squad module: squad endpoint with model-backed prediction pipeline
- Database models for users, players, and saved squads

## Project Structure
- `run.py` - application entry point
- `__init__.py` - Flask app factory and blueprint registration
- `models.py` - SQLAlchemy models
- `routes/` - route blueprints (`auth`, `main`, `players`, `squad`)
- `ml/` - ML predictor logic and serialized model files
- `static/datasets/` - cricket dataset used for analysis
- `templates/` - HTML templates for pages

## Tech Stack
Python, Flask, SQLAlchemy, Flask-Login, Flask-Bcrypt, Flask-Mail, Pandas, Joblib.

## Quick Start
1. Create and activate a virtual environment.
2. Install dependencies:
   `pip install flask flask-sqlalchemy flask-login flask-bcrypt flask-mail pandas joblib`
3. Run the app:
   `python run.py`
4. Open in browser:
   `http://127.0.0.1:5000`

## Main Routes
- `/` - home page
- `/help` - help page
- `/players` - players list and filters
- `/register` and `/login` - authentication pages
- `/squad` - squad module endpoint
