from functools import wraps
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from __init__ import db
from models import Player

players = Blueprint('players', __name__)


def admin_required(view):
    @wraps(view)
    @login_required
    def wrapped(*args, **kwargs):
        if not current_user.is_admin:
            flash('Admin access required to manage players.', 'danger')
            return redirect(url_for('players.player_list'))
        return view(*args, **kwargs)

    return wrapped


@players.route('/players')
def player_list():
    country = request.args.get('country', '')
    role    = request.args.get('role', '')
    search  = request.args.get('search', '')
    sort_by = request.args.get('sort', 'player_name')

    query = Player.query

    if country:
        query = query.filter_by(country=country)
    if role:
        query = query.filter_by(player_role=role)
    if search:
        query = query.filter(Player.player_name.ilike(f'%{search}%'))

    sort_map = {
        'average':     Player.average.desc(),
        'strike_rate': Player.strike_rate.desc(),
        'wickets':     Player.wickets.desc(),
        'perf_score':  Player.perf_score.desc(),
        'player_name': Player.player_name.asc()
    }
    query = query.order_by(sort_map.get(sort_by, Player.player_name.asc()))
    all_players = query.all()

    return render_template('players/list.html',
                           players=all_players,
                           countries=['India', 'England', 'Australia', 'Pakistan'],
                           roles=['Batsman', 'Bowler', 'All-Rounder'],
                           selected_country=country,
                           selected_role=role,
                           search=search,
                           sort_by=sort_by)


@players.route('/players/<int:player_id>')
def player_profile(player_id):
    player = Player.query.get_or_404(player_id)
    similar = Player.query.filter_by(
        player_role=player.player_role,
        country=player.country
    ).filter(Player.id != player.id).limit(4).all()
    return render_template('players/profile.html',
                           player=player,
                           similar=similar)


@players.route('/players/compare')
def compare():
    p1_id = request.args.get('p1', type=int)
    p2_id = request.args.get('p2', type=int)

    if p1_id and p2_id and p1_id == p2_id:
        flash('Cannot compare a player with themselves. Please select two different players.', 'warning')
        return redirect(url_for('players.compare'))

    p1 = Player.query.get(p1_id) if p1_id else None
    p2 = Player.query.get(p2_id) if p2_id else None
    all_players = Player.query.order_by(Player.player_name).all()
    return render_template('players/compare.html',
                           p1=p1, p2=p2,
                           all_players=all_players)


@players.route('/players/top')
def top_players():
    country = request.args.get('country', 'India')
    role    = request.args.get('role', 'Batsman')

    top = Player.query.filter_by(country=country, player_role=role)\
                      .order_by(Player.perf_score.desc()).limit(10).all()

    return render_template('players/top.html',
                           top_players=top,
                           countries=['India', 'England', 'Australia', 'Pakistan'],
                           roles=['Batsman', 'Bowler', 'All-Rounder'],
                           selected_country=country,
                           selected_role=role)


@players.route('/players/new', methods=['GET', 'POST'])
@admin_required
def add_player():
    if request.method == 'POST':
        player = Player(
            player_name  = request.form.get('player_name'),
            country      = request.form.get('country'),
            player_role  = request.form.get('player_role'),
            status       = request.form.get('status', 'Active'),
            matches      = int(request.form.get('matches', 0)),
            runs         = float(request.form.get('runs', 0)),
            average      = float(request.form.get('average', 0)),
            strike_rate  = float(request.form.get('strike_rate', 0)),
            wickets      = int(request.form.get('wickets', 0)),
            economy      = float(request.form.get('economy', 0)),
            centuries    = int(request.form.get('centuries', 0)),
            fifties      = int(request.form.get('fifties', 0)),
        )
        db.session.add(player)
        db.session.commit()
        flash('Player added successfully.', 'success')
        return redirect(url_for('players.player_list'))

    return render_template('players/add_player.html',
                           countries=['India', 'England', 'Australia', 'Pakistan'],
                           roles=['Batsman', 'Bowler', 'All-Rounder'])


@players.route('/players/<int:player_id>/delete', methods=['POST'])
@admin_required
def delete_player(player_id):
    player = Player.query.get_or_404(player_id)
    db.session.delete(player)
    db.session.commit()
    flash('Player deleted.', 'info')
    return redirect(url_for('players.player_list'))


@players.route('/players/<int:player_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_player(player_id):
    player = Player.query.get_or_404(player_id)
    
    if request.method == 'POST':
        # Update editable fields
        player.matches      = int(request.form.get('matches', player.matches))
        player.runs         = float(request.form.get('runs', player.runs))
        player.average      = float(request.form.get('average', player.average))
        player.strike_rate  = float(request.form.get('strike_rate', player.strike_rate))
        player.wickets      = int(request.form.get('wickets', player.wickets))
        player.economy      = float(request.form.get('economy', player.economy))
        player.centuries    = int(request.form.get('centuries', player.centuries))
        player.fifties      = int(request.form.get('fifties', player.fifties))
        player.status       = request.form.get('status', player.status)
        player.recent_form  = request.form.get('recent_form', player.recent_form)
        
        db.session.commit()
        flash(f'Player {player.player_name} updated successfully.', 'success')
        return redirect(url_for('players.player_profile', player_id=player.id))
    
    return render_template('players/edit_player.html', player=player)
