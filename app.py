import os
import numpy as np
from flask import Flask, request, render_template, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from audio_analysis.pitch import analyze_pitch
from audio_analysis.timbre import analyze_timbre
from audio_analysis.similarity import compare_voices

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.getenv('UPLOAD_FOLDER', '/tmp'), 'vocary_uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Fix for Render's proxy
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/analyzer')
def analyzer():
    return render_template('index.html')

@app.route('/pitch')
def pitch_analyzer():
    return render_template('pitch.html')

@app.route('/timbre')
def timbre_analyzer():
    return render_template('timbre.html')

@app.route('/api/analyze/pitch', methods=['POST'])
def api_analyze_pitch():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
        
    audio_file = request.files['audio']
    filename = secure_filename(audio_file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    audio_file.save(filepath)
    
    try:
        result = analyze_pitch(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/analyze/timbre', methods=['POST'])
def api_analyze_timbre():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
        
    audio_file = request.files['audio']
    filename = secure_filename(audio_file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    audio_file.save(filepath)
    
    try:
        result = analyze_timbre(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/analyze/similarity', methods=['POST'])
def api_analyze_similarity():
    if 'song' not in request.files or 'user' not in request.files:
        return jsonify({'error': 'Both files required'}), 400
        
    song_file = request.files['song']
    user_file = request.files['user']
    
    song_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(song_file.filename))
    user_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(user_file.filename))
    
    song_file.save(song_path)
    user_file.save(user_path)
    
    try:
        score, feedback = compare_voices(song_path, user_path)
        return jsonify({
            'score': score,
            'feedback': feedback,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        for path in [song_path, user_path]:
            if os.path.exists(path):
                os.remove(path)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)