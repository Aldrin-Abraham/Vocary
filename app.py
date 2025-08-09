from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
from audio_analysis import analyze_pitch, analyze_timbre, compare_voices
import uuid

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyzer')
def analyzer():
    return render_template('celebrity-delusion.html')

@app.route('/pitch')
def pitch():
    return render_template('pitch-police.html')

@app.route('/timbre')
def timbre():
    return render_template('timbre-tattletale.html')

@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/analyze/pitch', methods=['POST'])
def analyze_pitch_route():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}_{secure_filename(file.filename)}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        result = analyze_pitch(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/analyze/timbre', methods=['POST'])
def analyze_timbre_route():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}_{secure_filename(file.filename)}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        result = analyze_timbre(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/analyze/similarity', methods=['POST'])
def analyze_similarity_route():
    if 'song' not in request.files or 'user' not in request.files:
        return jsonify({'error': 'Both reference and user audio required'}), 400
    
    song_file = request.files['song']
    user_file = request.files['user']
    
    unique_id = str(uuid.uuid4())
    song_filename = f"song_{unique_id}_{secure_filename(song_file.filename)}"
    user_filename = f"user_{unique_id}_{secure_filename(user_file.filename)}"
    
    song_path = os.path.join(app.config['UPLOAD_FOLDER'], song_filename)
    user_path = os.path.join(app.config['UPLOAD_FOLDER'], user_filename)
    
    song_file.save(song_path)
    user_file.save(user_path)
    
    try:
        score, feedback = compare_voices(song_path, user_path)
        return jsonify({
            'status': 'success',
            'score': score,
            'title': "Your Delusion Results Are In!",
            'feedback': feedback,
            'details': generate_similarity_details(score)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(song_path):
            os.remove(song_path)
        if os.path.exists(user_path):
            os.remove(user_path)

def generate_similarity_details(score):
    if score > 85:
        return [
            "Pitch accuracy: Surprisingly not terrible",
            "Timbre similarity: Suspiciously close",
            "Rhythm matching: Were you lip-syncing?"
        ]
    elif score > 70:
        return [
            "Pitch accuracy: Occasionally hits notes",
            "Timbre similarity: In the same ballpark",
            "Rhythm matching: Mostly follows the song"
        ]
    elif score > 50:
        return [
            "Pitch accuracy: Like a drunk dart player",
            "Timbre similarity: Same species maybe?",
            "Rhythm matching: Were you even counting?"
        ]
    else:
        return [
            "Pitch accuracy: Please stop",
            "Timbre similarity: Not even close",
            "Rhythm matching: Were you singing the same song?"
        ]

if __name__ == '__main__':
    app.run(debug=True)