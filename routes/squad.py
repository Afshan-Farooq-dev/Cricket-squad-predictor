import json
from flask import Blueprint, render_template, request, redirect, flash, url_for
from flask_login import current_user, login_required
from __init__ import db
from models import SavedSquad
from ml.predictor import generate_squad

squad = Blueprint('squad', __name__)

COUNTRIES = ['India', 'England', 'Australia', 'Pakistan']
OPPOSITIONS = ['India', 'England', 'Australia', 'Pakistan', 'South Africa', 'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan']
FORMATS = ['ODI', 'T20', 'Test']
VENUES = ['Home', 'Away', 'Neutral']
PITCHES = ['Batting', 'Bowling', 'Balanced']
WEATHERS = ['Clear', 'Overcast', 'Humid']

@squad.route('/squad', methods=['GET', 'POST'])
def generate():
    if request.method == 'GET':
        recent_squads = []
        if current_user.is_authenticated:
            recent_squads = SavedSquad.query.filter_by(user_id=current_user.id).order_by(SavedSquad.created_at.desc()).limit(3).all()
        return render_template('squad/form.html', 
                               countries=COUNTRIES, 
                               oppositions=OPPOSITIONS, 
                               formats=FORMATS, 
                               venues=VENUES, 
                               pitches=PITCHES, 
                               weathers=WEATHERS,
                               recent_squads=recent_squads)

    if request.method == 'POST':
        country = request.form.get('country')
        match_format = request.form.get('match_format')
        opposition = request.form.get('opposition')
        venue_type = request.form.get('venue_type')
        pitch_type = request.form.get('pitch_type')
        weather = request.form.get('weather')

        result = generate_squad(
            country=country,
            match_format=match_format,
            opposition=opposition,
            venue_type=venue_type,
            pitch_type=pitch_type,
            weather=weather
        )

        if not result:
            flash('Error generating squad. Please try again with different parameters.', 'danger')
            return redirect(url_for('squad.generate'))

        context = {
            'country': country,
            'match_format': match_format,
            'opposition': opposition,
            'venue_type': venue_type,
            'pitch_type': pitch_type,
            'weather': weather
        }
        
        # Serialize 11 players for the DB
        players_json = json.dumps(result['players'])

        return render_template('squad/result.html', result=result, context=context, players_json=players_json)


@squad.route('/squad/save', methods=['POST'])
@login_required
def save_squad():
    country = request.form.get('country')
    match_format = request.form.get('match_format')
    opposition = request.form.get('opposition')
    venue_type = request.form.get('venue_type')
    pitch_type = request.form.get('pitch_type')
    weather = request.form.get('weather')
    players_json = request.form.get('players_json')

    if not players_json:
        flash('Cannot save an empty squad.', 'danger')
        return redirect(url_for('squad.generate'))

    new_squad = SavedSquad(
        user_id=current_user.id,
        country=country,
        opposition=opposition,
        match_format=match_format,
        venue_type=venue_type,
        pitch_type=pitch_type,
        weather=weather,
        players_json=players_json
    )
    db.session.add(new_squad)
    db.session.commit()

    flash('Squad saved successfully!', 'success')
    return redirect(url_for('auth.dashboard'))


@squad.route('/squad/saved/<int:squad_id>')
@login_required
def view_saved(squad_id):
    squad_record = SavedSquad.query.get_or_404(squad_id)
    if squad_record.user_id != current_user.id:
        flash('Unauthorized access to saved squad.', 'danger')
        return redirect(url_for('auth.dashboard'))

    players = json.loads(squad_record.players_json) if squad_record.players_json else []
    
    return render_template('squad/saved.html', squad=squad_record, players=players)
