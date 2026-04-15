from flask import Blueprint, render_template
from models import Player

main = Blueprint('main', __name__)


@main.route('/')
def home():
    total_players = Player.query.count()
    return render_template('main/home.html', total_players=total_players)


@main.route('/help')
def help():
    return render_template('main/help.html')
