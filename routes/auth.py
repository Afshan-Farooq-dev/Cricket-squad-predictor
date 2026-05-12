from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, current_user, logout_user, login_required
from __init__ import db, bcrypt
from models import User, SavedSquad
import re

auth = Blueprint('auth', __name__)


def _clean(value):
    return (value or '').strip()


def _is_valid_email(email):
    return re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email) is not None

@auth.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    
    if request.method == 'POST':
        username = _clean(request.form.get('username'))
        email = _clean(request.form.get('email')).lower()
        password = request.form.get('password') or ''
        confirm_password = request.form.get('confirm_password') or ''

        if not username or not email or not password or not confirm_password:
            flash('All fields are required.', 'danger')
            return redirect(url_for('auth.register'))

        if len(username) < 3:
            flash('Username must be at least 3 characters.', 'danger')
            return redirect(url_for('auth.register'))

        if len(username) > 80:
            flash('Username is too long.', 'danger')
            return redirect(url_for('auth.register'))

        if len(email) > 120 or not _is_valid_email(email):
            flash('Please enter a valid email address.', 'danger')
            return redirect(url_for('auth.register'))

        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'danger')
            return redirect(url_for('auth.register'))

        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return redirect(url_for('auth.register'))

        user_by_username = User.query.filter_by(username=username).first()
        if user_by_username:
            flash('Username is already taken. Please choose another one.', 'danger')
            return redirect(url_for('auth.register'))

        user_by_email = User.query.filter_by(email=email).first()
        if user_by_email:
            flash('Email is already in use. Please log in instead.', 'danger')
            return redirect(url_for('auth.register'))

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        flash('Your account has been created! You are now able to log in.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('auth/register.html')

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
        
    if request.method == 'POST':
        email = _clean(request.form.get('email')).lower()
        password = request.form.get('password') or ''
        remember = True if request.form.get('remember') else False

        if not email or not password:
            flash('Please enter both email and password.', 'danger')
            return redirect(url_for('auth.login'))

        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('auth.dashboard'))
        else:
            flash('Login unsuccessful. Please check email and password.', 'danger')

    return render_template('auth/login.html')

@auth.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.home'))

@auth.route('/dashboard')
@login_required
def dashboard():
    squads = SavedSquad.query.filter_by(user_id=current_user.id).order_by(SavedSquad.created_at.desc()).all()
    count = len(squads)
    return render_template('auth/dashboard.html', squads=squads, count=count)

@auth.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        # Accept both names for compatibility with existing templates/forms
        form_type = request.form.get('form_type') or request.form.get('action')
        
        if form_type in ('username', 'update_username'):
            new_username = _clean(request.form.get('new_username') or request.form.get('username'))

            if not new_username:
                flash('Username cannot be empty.', 'danger')
                return redirect(url_for('auth.settings'))

            if len(new_username) < 3:
                flash('Username must be at least 3 characters.', 'danger')
                return redirect(url_for('auth.settings'))

            if len(new_username) > 80:
                flash('Username is too long.', 'danger')
                return redirect(url_for('auth.settings'))

            if new_username == current_user.username:
                flash('You are already using this username.', 'info')
            else:
                existing_user = User.query.filter_by(username=new_username).first()
                if existing_user:
                    flash('That username is already taken. Please choose a different one.', 'danger')
                else:
                    current_user.username = new_username
                    db.session.commit()
                    flash('Your username has been updated successfully.', 'success')
            return redirect(url_for('auth.settings'))

        elif form_type in ('password', 'update_password'):
            current_password = request.form.get('current_password') or ''
            new_password = request.form.get('new_password') or ''
            confirm_new_password = request.form.get('confirm_new_password') or request.form.get('confirm_password') or ''

            if not current_password or not new_password or not confirm_new_password:
                flash('All password fields are required.', 'danger')
                return redirect(url_for('auth.settings'))

            if len(new_password) < 6:
                flash('New password must be at least 6 characters long.', 'danger')
                return redirect(url_for('auth.settings'))

            if not bcrypt.check_password_hash(current_user.password, current_password):
                flash('Incorrect current password.', 'danger')
            elif new_password != confirm_new_password:
                flash('New passwords do not match.', 'danger')
            else:
                hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
                current_user.password = hashed_password
                db.session.commit()
                flash('Your password has been updated successfully.', 'success')
            return redirect(url_for('auth.settings'))
            
    return render_template('auth/settings.html')
