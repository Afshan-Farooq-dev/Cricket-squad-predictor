import json
from flask import Blueprint, render_template
from sqlalchemy import func
from models import Player

analytics = Blueprint('analytics', __name__)


def _get_aggregations():
    """Reusable data aggregations across analytics routes."""
    total_players = Player.query.count()
    all_players = Player.query.all()

    # Avg batting average
    batsmen = Player.query.filter(Player.player_role.in_(['Batsman', 'All-Rounder'])).all()
    avg_batting = round(sum(p.average for p in batsmen) / len(batsmen), 2) if batsmen else 0

    # Total wickets
    total_wickets = int(Player.query.with_entities(func.sum(Player.wickets)).scalar() or 0)

    # Good form count
    good_form = Player.query.filter_by(recent_form='Good').count()

    # Players per country
    countries = ['India', 'England', 'Australia', 'Pakistan']
    country_counts = {c: Player.query.filter_by(country=c).count() for c in countries}

    # Avg perf_score by role
    roles = ['Batsman', 'Bowler', 'All-Rounder']
    role_avg_score = {}
    for r in roles:
        ps = Player.query.filter_by(player_role=r).all()
        role_avg_score[r] = round(sum(p.perf_score for p in ps) / len(ps), 1) if ps else 0

    # Form distribution
    form_counts = {
        'Good': Player.query.filter_by(recent_form='Good').count(),
        'Average': Player.query.filter_by(recent_form='Average').count(),
        'Poor': Player.query.filter_by(recent_form='Poor').count()
    }

    # Top 5 batsmen by average
    top_batsmen = Player.query.filter(Player.player_role.in_(['Batsman', 'All-Rounder']))\
                             .order_by(Player.average.desc()).limit(5).all()

    # Top 5 bowlers by wickets
    top_bowlers = Player.query.filter(Player.player_role.in_(['Bowler', 'All-Rounder']))\
                              .order_by(Player.wickets.desc()).limit(5).all()

    # Country breakdown
    country_breakdown = {}
    for c in countries:
        c_players = Player.query.filter_by(country=c).all()
        c_batsmen = [p for p in c_players if p.player_role in ['Batsman', 'All-Rounder']]
        c_bowlers = [p for p in c_players if p.player_role in ['Bowler', 'All-Rounder']]
        best = max(c_players, key=lambda p: p.perf_score) if c_players else None
        country_breakdown[c] = {
            'total': len(c_players),
            'avg_batting': round(sum(p.average for p in c_batsmen) / len(c_batsmen), 1) if c_batsmen else 0,
            'avg_economy': round(sum(p.economy for p in c_bowlers) / len(c_bowlers), 2) if c_bowlers else 0,
            'best_player': best.player_name if best else 'N/A'
        }

    return {
        'total_players': total_players,
        'avg_batting': avg_batting,
        'total_wickets': total_wickets,
        'good_form': good_form,
        'country_counts': country_counts,
        'role_avg_score': role_avg_score,
        'form_counts': form_counts,
        'top_batsmen': top_batsmen,
        'top_bowlers': top_bowlers,
        'country_breakdown': country_breakdown
    }


@analytics.route('/analytics')
def dashboard():
    data = _get_aggregations()
    return render_template('analytics/dashboard.html', **data,
        country_counts_json=json.dumps(data['country_counts']),
        role_avg_json=json.dumps(data['role_avg_score']),
        form_counts_json=json.dumps(data['form_counts']),
        top_batsmen_names=json.dumps([p.player_name for p in data['top_batsmen']]),
        top_batsmen_avgs=json.dumps([round(p.average, 1) for p in data['top_batsmen']]),
        top_bowlers_names=json.dumps([p.player_name for p in data['top_bowlers']]),
        top_bowlers_wickets=json.dumps([p.wickets for p in data['top_bowlers']])
    )


@analytics.route('/analytics/top')
def top():
    data = _get_aggregations()
    countries = ['India', 'England', 'Australia', 'Pakistan']
    roles = ['Batsman', 'Bowler', 'All-Rounder']

    # Top 10 overall by perf score
    top10 = Player.query.order_by(Player.perf_score.desc()).limit(10).all()

    # Country radar comparison: avg stats per country
    country_avgs = {}
    for c in countries:
        cp = Player.query.filter_by(country=c).all()
        country_avgs[c] = {
            'avg': round(sum(p.average for p in cp) / len(cp), 1) if cp else 0,
            'sr': round(sum(p.strike_rate for p in cp) / len(cp), 1) if cp else 0,
            'wkts': round(sum(p.wickets for p in cp) / len(cp), 1) if cp else 0,
            'eco': round(sum(p.economy for p in cp) / len(cp), 2) if cp else 0,
            'score': round(sum(p.perf_score for p in cp) / len(cp), 1) if cp else 0
        }

    return render_template('analytics/top.html',
        top10=top10, country_avgs=json.dumps(country_avgs),
        top10_names=json.dumps([p.player_name for p in top10]),
        top10_scores=json.dumps([round(p.perf_score, 1) for p in top10]),
        countries=countries, roles=roles,
        **data
    )


@analytics.route('/analytics/form')
def form():
    good_players = Player.query.filter_by(recent_form='Good').order_by(Player.perf_score.desc()).all()
    avg_players = Player.query.filter_by(recent_form='Average').order_by(Player.perf_score.desc()).all()
    poor_players = Player.query.filter_by(recent_form='Poor').order_by(Player.perf_score.desc()).all()

    form_counts = {'Good': len(good_players), 'Average': len(avg_players), 'Poor': len(poor_players)}

    return render_template('analytics/form.html',
        good_players=good_players,
        avg_players=avg_players,
        poor_players=poor_players,
        form_counts_json=json.dumps(form_counts),
        **form_counts
    )
