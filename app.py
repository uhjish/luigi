from flask import Flask, request, send_from_directory
from flask_mako import render_template, MakoTemplates
import os
from mako.template import Template

app = Flask(__name__)
app.template_folder
mako = MakoTemplates(app)

luigiTmpl = Template(filename='luigi/luigi.tmpl')

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)

@app.route('/luigi/<path:path>')
def send_luigi(path):
    return send_from_directory('luigi', path)

@app.route('/')
def fetch():
    data = request.args.get('data', '/luigi/test.json')
    return luigiTmpl.render(dataUrl=data)

if __name__=='__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT',3001)), debug=False)
