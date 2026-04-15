import joblib
import pandas as pd
import numpy as np
import os

# Paths to model files
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Load models once at startup
try:
    xgb_model    = joblib.load(os.path.join(MODELS_DIR, 'xgboost_squad_selector.pkl'))
    rf_model     = joblib.load(os.path.join(MODELS_DIR, 'random_forest_performance.pkl'))
    encoders     = joblib.load(os.path.join(MODELS_DIR, 'label_encoders.pkl'))
    feature_cols = joblib.load(os.path.join(MODELS_DIR, 'feature_columns.pkl'))
    print('ML models loaded successfully.')
except Exception as e:
    print(f'Warning: Could not load ML models: {e}')
    xgb_model = rf_model = encoders = feature_cols = None


OPPOSITION_STRENGTH = {
    'Australia': 90, 'England': 85, 'India': 88,
    'South Africa': 80, 'New Zealand': 78, 'Pakistan': 82,
    'West Indies': 70, 'Sri Lanka': 68, 'Bangladesh': 60, 'Afghanistan': 55
}

CATEGORICAL_COLS = ['country', 'player_role', 'match_format',
                    'venue_type', 'opposition', 'pitch_type', 'weather']


def get_recent_form_label(score):
    if score >= 60:
        return 'Good'
    elif score >= 35:
        return 'Average'
    return 'Poor'


def generate_squad(country, match_format, opposition, venue_type,
                   pitch_type='Balanced', weather='Clear'):

    if xgb_model is None:
        return _fallback_squad(country)

    try:
        from models import Player
        from __init__ import create_app
        
        # Load players from DB
        # If outside request context, we might need app context
        try:
            from flask import current_app
            if current_app:
                db_players = Player.query.filter_by(country=country).all()
            else:
                raise Exception("No current app")
        except Exception:
            # Fallback to local app creation
            app = create_app()
            with app.app_context():
                db_players = Player.query.filter_by(country=country).all()

        if not db_players:
            return _fallback_squad(country)

        # Convert DB players to DataFrame and map to expected ML features
        rows = []
        for p in db_players:
            rf_score = 80 if p.recent_form == 'Good' else (50 if p.recent_form == 'Average' else 20)
            sr = p.strike_rate if p.strike_rate > 0 else 100
            tbf = p.runs / (sr / 100.0) if sr > 0 else 0
            
            rows.append({
                'player_name': p.player_name,
                'country': p.country,
                'player_role': p.player_role,
                'opposition': opposition,
                'venue_type': venue_type,
                'pitch_type': pitch_type,
                'weather': weather,
                'match_format': match_format,
                'opposition_strength': OPPOSITION_STRENGTH.get(opposition, 65),
                'recent_form_score': rf_score,
                'consistency_score': p.perf_score,
                'avg.run': p.average,
                'avg.sr': p.strike_rate,
                'wickets': p.wickets,
                't.wic': p.wickets,
                'truns': p.runs,
                'tbf': tbf,
                'ecn': p.economy
            })
            
        team_df = pd.DataFrame(rows)

        # Encode categorical columns
        pred_df = team_df.copy()
        for col in CATEGORICAL_COLS:
            if col in pred_df.columns and col in encoders:
                try:
                    pred_df[col] = encoders[col].transform(pred_df[col].astype(str))
                except Exception:
                    pred_df[col] = 0

        X_pred = pred_df[feature_cols].fillna(0)

        # Predict scores
        team_df['xgb_score']    = xgb_model.predict(X_pred)
        team_df['rf_score']     = rf_model.predict(X_pred)
        team_df['final_score']  = (team_df['xgb_score'] * 0.6 + team_df['rf_score'] * 0.4)

        # Remove duplicate player names, keep highest score
        team_df = team_df.sort_values('final_score', ascending=False)\
                         .drop_duplicates(subset='player_name')

        # Select best 11: 5 batsmen, 4 bowlers, 2 all-rounders
        batsmen     = team_df[team_df['player_role'] == 'Batsman'].head(5)
        bowlers     = team_df[team_df['player_role'] == 'Bowler'].head(4)
        allrounders = team_df[team_df['player_role'] == 'All-Rounder'].head(2)

        squad_df = pd.concat([batsmen, bowlers, allrounders])

        # Fill to 11 if needed
        if len(squad_df) < 11:
            remaining = team_df[~team_df.index.isin(squad_df.index)].head(11 - len(squad_df))
            squad_df  = pd.concat([squad_df, remaining])

        squad_df  = squad_df.head(11)
        reserves  = team_df[~team_df.index.isin(squad_df.index)].head(4)

        # Build player dicts
        def build_player(row):
            return {
                'name':         str(row.get('player_name', 'Unknown')),
                'role':         str(row.get('player_role', 'Batsman')),
                'country':      country,
                'perf_score':   round(float(row.get('final_score', 0)), 1),
                'recent_form':  get_recent_form_label(float(row.get('recent_form_score', 40))),
                'average':      round(float(row.get('avg.run', row.get('average', 0)) or 0), 1),
                'strike_rate':  round(float(row.get('avg.sr', row.get('strike_rate', 0)) or 0), 1),
                'wickets':      int(row.get('wickets', row.get('t.wic', 0)) or 0),
                'economy':      round(float(row.get('economy', row.get('eco', 0)) or 0), 2),
            }

        players_list  = [build_player(row) for _, row in squad_df.iterrows()]
        reserves_list = [build_player(row) for _, row in reserves.iterrows()]

        # Assign captain (highest score) and wicketkeeper (best batsman)
        captain_idx     = squad_df['final_score'].idxmax()
        captain_name    = str(squad_df.loc[captain_idx, 'player_name'])
        wk_name         = str(batsmen.iloc[0]['player_name']) if not batsmen.empty else players_list[0]['name']

        # Batting order: batsmen first, then all-rounders, then bowlers
        batting_order = (
            [p['name'] for p in players_list if p['role'] == 'Batsman'] +
            [p['name'] for p in players_list if p['role'] == 'All-Rounder'] +
            [p['name'] for p in players_list if p['role'] == 'Bowler']
        )

        bowling_combo = (
            [p['name'] for p in players_list if p['role'] == 'Bowler'] +
            [p['name'] for p in players_list if p['role'] == 'All-Rounder']
        )

        team_score = round(float(squad_df['final_score'].mean()), 1)

        return {
            'players':       players_list,
            'reserves':      reserves_list,
            'captain':       captain_name,
            'wicketkeeper':  wk_name,
            'team_score':    team_score,
            'batting_order': batting_order,
            'bowling_combo': bowling_combo,
        }

    except Exception as e:
        print(f'Squad generation error: {e}')
        return None


def _fallback_squad(country):
    """Return empty result if models not loaded."""
    return None
