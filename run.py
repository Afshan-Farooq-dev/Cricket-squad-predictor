from __init__ import create_app  # type: ignore
from flask import render_template

app = create_app()

@app.errorhandler(404)
def page_not_found(e):
    return render_template('errors/404.html'), 404

if __name__ == '__main__':
    app.run(debug=True)
