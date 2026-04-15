"""
seed_db.py — Populate the Player table with real cricket data.
Run with:  .\venv\Scripts\python seed_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from __init__ import create_app, db
from models import Player

app = create_app()

PLAYERS = [
    # ---- INDIA ----
    # Batsmen
    dict(player_name="Virat Kohli",       country="India", player_role="Batsman",     matches=274, runs=13848, average=57.69, strike_rate=93.17, wickets=4,   economy=6.30, centuries=50, fifties=72, recent_form="Good",    perf_score=95.2),
    dict(player_name="Rohit Sharma",      country="India", player_role="Batsman",     matches=243, runs=10709, average=49.58, strike_rate=90.61, wickets=8,   economy=7.10, centuries=31, fifties=57, recent_form="Good",    perf_score=92.1),
    dict(player_name="Shikhar Dhawan",    country="India", player_role="Batsman",     matches=167, runs=6793,  average=44.11, strike_rate=91.22, wickets=0,   economy=0.00, centuries=17, fifties=39, recent_form="Average", perf_score=78.4),
    dict(player_name="KL Rahul",          country="India", player_role="Batsman",     matches=66,  runs=2633,  average=45.40, strike_rate=88.95, wickets=0,   economy=0.00, centuries=5,  fifties=21, recent_form="Good",    perf_score=82.3),
    dict(player_name="Suryakumar Yadav",  country="India", player_role="Batsman",     matches=64,  runs=2399,  average=46.13, strike_rate=170.07,wickets=0,   economy=0.00, centuries=4,  fifties=19, recent_form="Good",    perf_score=88.7),
    # Bowlers
    dict(player_name="Jasprit Bumrah",    country="India", player_role="Bowler",      matches=72,  runs=38,    average=24.53, strike_rate=18.40, wickets=149, economy=4.63, centuries=0,  fifties=0,  recent_form="Good",    perf_score=94.5),
    dict(player_name="Mohammed Shami",    country="India", player_role="Bowler",      matches=101, runs=120,   average=17.47, strike_rate=22.10, wickets=195, economy=5.27, centuries=0,  fifties=0,  recent_form="Good",    perf_score=89.6),
    dict(player_name="Bhuvneshwar Kumar", country="India", player_role="Bowler",      matches=135, runs=210,   average=25.38, strike_rate=25.10, wickets=187, economy=4.80, centuries=0,  fifties=0,  recent_form="Average", perf_score=80.1),
    dict(player_name="Ravindra Jadeja",   country="India", player_role="All-Rounder", matches=168, runs=2531,  average=32.57, strike_rate=89.38, wickets=220, economy=4.92, centuries=2,  fifties=15, recent_form="Good",    perf_score=91.4),
    dict(player_name="Hardik Pandya",     country="India", player_role="All-Rounder", matches=70,  runs=1426,  average=28.52, strike_rate=124.21,wickets=77,  economy=8.77, centuries=0,  fifties=9,  recent_form="Average", perf_score=84.0),
    dict(player_name="Ravichandran Ashwin",country="India",player_role="All-Rounder", matches=113, runs=707,   average=18.60, strike_rate=70.12, wickets=156, economy=4.81, centuries=0,  fifties=0,  recent_form="Good",    perf_score=86.2),
    dict(player_name="Rishabh Pant",      country="India", player_role="Batsman",     matches=30,  runs=865,   average=41.19, strike_rate=121.49,wickets=0,   economy=0.00, centuries=0,  fifties=6,  recent_form="Average", perf_score=79.8),
    dict(player_name="Shreyas Iyer",      country="India", player_role="Batsman",     matches=67,  runs=1940,  average=39.59, strike_rate=103.94,wickets=0,   economy=0.00, centuries=5,  fifties=12, recent_form="Average", perf_score=77.5),
    dict(player_name="Yuzvendra Chahal",  country="India", player_role="Bowler",      matches=72,  runs=28,    average=9.33,  strike_rate=14.23, wickets=121, economy=4.55, centuries=0,  fifties=0,  recent_form="Good",    perf_score=85.3),
    dict(player_name="Axar Patel",        country="India", player_role="All-Rounder", matches=52,  runs=522,   average=28.33, strike_rate=98.67, wickets=64,  economy=5.12, centuries=0,  fifties=2,  recent_form="Good",    perf_score=81.9),

    # ---- ENGLAND ----
    # Batsmen
    dict(player_name="Joe Root",          country="England", player_role="Batsman",     matches=176, runs=7786,  average=49.59, strike_rate=86.15, wickets=35,  economy=5.62, centuries=17, fifties=57, recent_form="Good",    perf_score=93.4),
    dict(player_name="Ben Stokes",        country="England", player_role="All-Rounder", matches=105, runs=3040,  average=39.48, strike_rate=96.29, wickets=74,  economy=5.68, centuries=3,  fifties=21, recent_form="Good",    perf_score=91.7),
    dict(player_name="Jonny Bairstow",    country="England", player_role="Batsman",     matches=109, runs=4143,  average=43.39, strike_rate=100.52,wickets=0,   economy=0.00, centuries=11, fifties=26, recent_form="Average", perf_score=82.6),
    dict(player_name="Jos Buttler",       country="England", player_role="Batsman",     matches=167, runs=4454,  average=41.24, strike_rate=118.93,wickets=0,   economy=0.00, centuries=10, fifties=22, recent_form="Good",    perf_score=87.2),
    dict(player_name="Jason Roy",         country="England", player_role="Batsman",     matches=100, runs=3452,  average=37.96, strike_rate=108.80,wickets=0,   economy=0.00, centuries=7,  fifties=22, recent_form="Poor",    perf_score=71.3),
    # Bowlers
    dict(player_name="James Anderson",   country="England", player_role="Bowler",      matches=194, runs=430,   average=28.73, strike_rate=39.76, wickets=269, economy=4.57, centuries=0,  fifties=0,  recent_form="Average", perf_score=83.8),
    dict(player_name="Stuart Broad",     country="England", player_role="Bowler",      matches=121, runs=530,   average=22.73, strike_rate=34.98, wickets=169, economy=5.14, centuries=0,  fifties=0,  recent_form="Good",    perf_score=85.1),
    dict(player_name="Jofra Archer",     country="England", player_role="Bowler",      matches=18,  runs=60,    average=18.50, strike_rate=19.62, wickets=30,  economy=5.37, centuries=0,  fifties=0,  recent_form="Average", perf_score=75.4),
    dict(player_name="Mark Wood",        country="England", player_role="Bowler",      matches=67,  runs=165,   average=12.50, strike_rate=22.31, wickets=102, economy=5.70, centuries=0,  fifties=0,  recent_form="Good",    perf_score=81.5),
    dict(player_name="Moeen Ali",        country="England", player_role="All-Rounder", matches=205, runs=3222,  average=27.12, strike_rate=95.94, wickets=195, economy=5.67, centuries=1,  fifties=19, recent_form="Average", perf_score=80.9),
    dict(player_name="Sam Curran",       country="England", player_role="All-Rounder", matches=54,  runs=842,   average=22.16, strike_rate=103.06,wickets=69,  economy=5.43, centuries=0,  fifties=2,  recent_form="Good",    perf_score=79.3),
    dict(player_name="Harry Brook",      country="England", player_role="Batsman",     matches=25,  runs=1068,  average=53.40, strike_rate=149.16,wickets=0,   economy=0.00, centuries=4,  fifties=5,  recent_form="Good",    perf_score=84.6),
    dict(player_name="Zak Crawley",      country="England", player_role="Batsman",     matches=60,  runs=1890,  average=34.36, strike_rate=87.42, wickets=0,   economy=0.00, centuries=4,  fifties=10, recent_form="Average", perf_score=73.2),
    dict(player_name="Ollie Pope",       country="England", player_role="Batsman",     matches=35,  runs=940,   average=31.33, strike_rate=89.31, wickets=0,   economy=0.00, centuries=2,  fifties=5,  recent_form="Average", perf_score=71.8),
    dict(player_name="Adil Rashid",      country="England", player_role="Bowler",      matches=116, runs=438,   average=14.25, strike_rate=68.44, wickets=165, economy=5.38, centuries=0,  fifties=0,  recent_form="Good",    perf_score=82.7),

    # ---- AUSTRALIA ----
    # Batsmen
    dict(player_name="David Warner",     country="Australia", player_role="Batsman",     matches=161, runs=6932,  average=45.30, strike_rate=96.04, wickets=1,   economy=6.50, centuries=18, fifties=33, recent_form="Good",    perf_score=88.9),
    dict(player_name="Steve Smith",      country="Australia", player_role="Batsman",     matches=131, runs=4736,  average=41.56, strike_rate=87.07, wickets=30,  economy=5.21, centuries=11, fifties=27, recent_form="Good",    perf_score=90.3),
    dict(player_name="Travis Head",      country="Australia", player_role="Batsman",     matches=51,  runs=1908,  average=43.36, strike_rate=111.40,wickets=9,   economy=5.75, centuries=4,  fifties=12, recent_form="Good",    perf_score=85.8),
    dict(player_name="Marnus Labuschagne",country="Australia",player_role="Batsman",     matches=59,  runs=2237,  average=42.21, strike_rate=81.07, wickets=8,   economy=5.96, centuries=3,  fifties=18, recent_form="Average", perf_score=80.6),
    dict(player_name="Glenn Maxwell",    country="Australia", player_role="All-Rounder", matches=136, runs=3713,  average=33.15, strike_rate=122.08,wickets=74,  economy=5.95, centuries=4,  fifties=23, recent_form="Good",    perf_score=87.1),
    # Bowlers
    dict(player_name="Mitchell Starc",   country="Australia", player_role="Bowler",      matches=100, runs=347,   average=22.68, strike_rate=25.62, wickets=195, economy=5.18, centuries=0,  fifties=0,  recent_form="Good",    perf_score=89.4),
    dict(player_name="Josh Hazlewood",   country="Australia", player_role="Bowler",      matches=98,  runs=95,    average=14.52, strike_rate=22.15, wickets=197, economy=4.64, centuries=0,  fifties=0,  recent_form="Good",    perf_score=88.2),
    dict(player_name="Pat Cummins",      country="Australia", player_role="All-Rounder", matches=102, runs=756,   average=26.96, strike_rate=95.24, wickets=210, economy=5.18, centuries=0,  fifties=1,  recent_form="Good",    perf_score=92.8),
    dict(player_name="Adam Zampa",       country="Australia", player_role="Bowler",      matches=91,  runs=72,    average=10.28, strike_rate=48.65, wickets=156, economy=5.35, centuries=0,  fifties=0,  recent_form="Average", perf_score=82.3),
    dict(player_name="Mitchell Marsh",   country="Australia", player_role="All-Rounder", matches=104, runs=2591,  average=31.58, strike_rate=107.01,wickets=66,  economy=5.81, centuries=3,  fifties=15, recent_form="Average", perf_score=80.7),
    dict(player_name="Aaron Finch",      country="Australia", player_role="Batsman",     matches=145, runs=5401,  average=38.58, strike_rate=88.77, wickets=1,   economy=7.00, centuries=17, fifties=30, recent_form="Poor",    perf_score=74.2),
    dict(player_name="Matthew Wade",     country="Australia", player_role="Batsman",     matches=97,  runs=1765,  average=26.34, strike_rate=105.80,wickets=0,   economy=0.00, centuries=1,  fifties=10, recent_form="Average", perf_score=69.5),
    dict(player_name="Cameron Green",    country="Australia", player_role="All-Rounder", matches=42,  runs=1096,  average=35.35, strike_rate=108.09,wickets=44,  economy=5.64, centuries=2,  fifties=6,  recent_form="Good",    perf_score=81.4),
    dict(player_name="Nathan Lyon",      country="Australia", player_role="Bowler",      matches=175, runs=527,   average=11.42, strike_rate=36.48, wickets=237, economy=4.80, centuries=0,  fifties=0,  recent_form="Good",    perf_score=85.9),
    dict(player_name="Alex Carey",       country="Australia", player_role="Batsman",     matches=44,  runs=799,   average=23.50, strike_rate=89.99, wickets=0,   economy=0.00, centuries=0,  fifties=5,  recent_form="Average", perf_score=66.8),

    # ---- PAKISTAN ----
    dict(player_name="Babar Azam",        country="Pakistan", player_role="Batsman",     matches=117, runs=5729,  average=56.72, strike_rate=88.75,  wickets=0,   economy=0.00, centuries=19, fifties=32, recent_form="Good",    perf_score=96.5),
    dict(player_name="Shaheen Afridi",    country="Pakistan", player_role="Bowler",      matches=53,  runs=196,   average=14.00, strike_rate=75.00,  wickets=104, economy=5.54, centuries=0,  fifties=0,  recent_form="Good",    perf_score=94.1),
    dict(player_name="Mohammad Rizwan",   country="Pakistan", player_role="Batsman",     matches=74,  runs=2088,  average=34.22, strike_rate=89.15,  wickets=0,   economy=0.00, centuries=3,  fifties=13, recent_form="Good",    perf_score=88.3),
    dict(player_name="Fakhar Zaman",      country="Pakistan", player_role="Batsman",     matches=82,  runs=3492,  average=45.35, strike_rate=93.46,  wickets=0,   economy=0.00, centuries=11, fifties=16, recent_form="Good",    perf_score=87.5),
    dict(player_name="Shadab Khan",       country="Pakistan", player_role="All-Rounder", matches=70,  runs=782,   average=26.06, strike_rate=104.26, wickets=85,  economy=5.29, centuries=0,  fifties=4,  recent_form="Average", perf_score=85.2),
    dict(player_name="Haris Rauf",        country="Pakistan", player_role="Bowler",      matches=37,  runs=33,    average=11.00, strike_rate=73.33,  wickets=69,  economy=6.00, centuries=0,  fifties=0,  recent_form="Good",    perf_score=86.8),
    dict(player_name="Naseem Shah",       country="Pakistan", player_role="Bowler",      matches=14,  runs=35,    average=17.50, strike_rate=55.55,  wickets=32,  economy=4.68, centuries=0,  fifties=0,  recent_form="Good",    perf_score=84.5),
    dict(player_name="Imam-ul-Haq",       country="Pakistan", player_role="Batsman",     matches=72,  runs=3138,  average=50.61, strike_rate=82.75,  wickets=0,   economy=0.00, centuries=9,  fifties=20, recent_form="Good",    perf_score=86.9),
    dict(player_name="Imad Wasim",        country="Pakistan", player_role="All-Rounder", matches=55,  runs=986,   average=42.86, strike_rate=110.29, wickets=44,  economy=4.88, centuries=0,  fifties=5,  recent_form="Average", perf_score=82.4),
    dict(player_name="Iftikhar Ahmed",    country="Pakistan", player_role="All-Rounder", matches=28,  runs=520,   average=37.14, strike_rate=106.33, wickets=16,  economy=5.32, centuries=0,  fifties=2,  recent_form="Average", perf_score=80.1),
    dict(player_name="Mohammad Nawaz",    country="Pakistan", player_role="All-Rounder", matches=37,  runs=364,   average=15.82, strike_rate=90.32,  wickets=45,  economy=4.91, centuries=0,  fifties=0,  recent_form="Average", perf_score=78.5),
    dict(player_name="Hasan Ali",         country="Pakistan", player_role="Bowler",      matches=66,  runs=383,   average=14.18, strike_rate=97.20,  wickets=100, economy=5.80, centuries=0,  fifties=0,  recent_form="Poor",    perf_score=77.2),
    dict(player_name="Agha Salman",       country="Pakistan", player_role="All-Rounder", matches=21,  runs=487,   average=37.46, strike_rate=101.45, wickets=4,   economy=5.43, centuries=0,  fifties=3,  recent_form="Average", perf_score=75.8),
    dict(player_name="Usama Mir",         country="Pakistan", player_role="Bowler",      matches=12,  runs=32,    average=10.66, strike_rate=96.96,  wickets=15,  economy=5.85, centuries=0,  fifties=0,  recent_form="Poor",    perf_score=71.1),
    dict(player_name="Abdullah Shafique", country="Pakistan", player_role="Batsman",     matches=12,  runs=416,   average=34.66, strike_rate=95.19,  wickets=0,   economy=0.00, centuries=1,  fifties=3,  recent_form="Average", perf_score=76.4),
]


def seed():
    with app.app_context():
        existing = Player.query.count()
        if existing > 0:
            print(f"Database already has {existing} players. Clearing and re-seeding...")
            Player.query.delete()
            db.session.commit()

        for data in PLAYERS:
            player = Player(**data)
            db.session.add(player)

        db.session.commit()
        total = Player.query.count()
        print(f"\n[DONE] Seeded {total} players successfully!")
        print(f"   India:    {Player.query.filter_by(country='India').count()}")
        print(f"   England:  {Player.query.filter_by(country='England').count()}")
        print(f"   Australia:{Player.query.filter_by(country='Australia').count()}")
        print(f"   Pakistan: {Player.query.filter_by(country='Pakistan').count()}")


if __name__ == '__main__':
    seed()
