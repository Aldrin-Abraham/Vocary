import numpy as np
assert np.__version__ >= '1.22.0', f"Need NumPy 1.22+, got {np.__version__}"

import werkzeug
werkzeug.__version__ = '2.0.3' 

from flask import Flask, request, render_template, jsonify, send_from_directory
from resemblyzer import VoiceEncoder, preprocess_wav
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from pydub import AudioSegment
import soundfile as sf
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.getenv('UPLOAD_FOLDER', '/tmp'), 'vocary_uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Fix for Render's proxy
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

def convert_to_wav(file_path):
    """Convert audio files to WAV format"""
    base, ext = os.path.splitext(file_path)
    wav_path = base + ".wav"
    if ext.lower() == '.mp3':
        audio = AudioSegment.from_mp3(file_path)
        audio.export(wav_path, format='wav')
        return wav_path
    return file_path

def get_embedding(file_path):
    """Generate voice embedding using Resemblyzer"""
    encoder = VoiceEncoder()
    wav = preprocess_wav(file_path)
    return encoder.embed_utterance(wav)

def compare_embeddings(song_path, user_path):
    """Compare voice embeddings and return similarity score"""
    song_embed = get_embedding(song_path)
    user_embed = get_embedding(user_path)
    similarity = np.inner(song_embed, user_embed)
    return similarity * 100

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'song' not in request.files or 'user' not in request.files:
        return jsonify({'error': 'Both files required'}), 400
        
    song_file = request.files['song']
    user_file = request.files['user']

    if song_file.filename == '' or user_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Save files
        song_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(song_file.filename))
        user_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(user_file.filename))
        song_file.save(song_path)
        user_file.save(user_path)

        # Process files
        song_path = convert_to_wav(song_path)
        user_path = convert_to_wav(user_path)
        score = compare_embeddings(song_path, user_path)

        # Generate feedback
        if score > 85:
            feedback = "✅ Excellent match! Your voice closely resembles the singer."
        elif score > 70:
            feedback = "👍 Good match. Similar tone and timbre."
        elif score > 50:
            feedback = "😐 Partial match. Some vocal traits are similar."
        else:
            feedback = "❌ Low match. Your voice is likely different from the singer's."

        return jsonify({
            'score': f"{score:.2f}", 
            'feedback': feedback,
            'status': 'success'
        })

    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)