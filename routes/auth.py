from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, current_user, logout_user, login_required
from __init__ import db, bcrypt
from models import User, SavedSquad

auth = Blueprint('auth', __name__)

@auth.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

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
        email = request.form.get('email')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False

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
        form_type = request.form.get('form_type')
        
        if form_type == 'username':
            new_username = request.form.get('new_username')
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

        elif form_type == 'password':
            current_password = request.form.get('current_password')
            new_password = request.form.get('new_password')
            confirm_new_password = request.form.get('confirm_new_password')

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
