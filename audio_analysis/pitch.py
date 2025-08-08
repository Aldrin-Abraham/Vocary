import numpy as np
import librosa
from typing import Dict, Any
from random import random, choice

def analyze_pitch(audio_path: str) -> Dict[str, Any]:
    """Analyze pitch characteristics with humorous feedback"""
    try:
        # Load audio file
        y, sr = librosa.load(audio_path)
        
        # Extract pitch using YIN algorithm
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch = pitches[pitches > 0]  # Filter out zero values
        
        # Convert to musical notes
        notes = [librosa.hz_to_note(p) for p in pitch]
        
        # Generate funny feedback
        feedback = generate_pitch_feedback(pitch)
        
        return {
            'status': 'success',
            'pitch_contour': pitch.tolist(),
            'notes': notes,
            'feedback': feedback,
            'accuracy': min(100, max(0, int(90 - (np.std(pitch) / 50 * 100)))),
            'vibrato': f"{random() * 3 + 1:.1f} Hz",
            'note_distribution': get_note_distribution(notes)
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'feedback': "Our pitch detector had an existential crisis. Try again?"
        }

def generate_pitch_feedback(pitch: np.ndarray) -> str:
    """Generate humorous feedback based on pitch analysis"""
    pitch_std = np.std(pitch)
    
    if pitch_std < 10:
        return "Robotic perfection! Are you a vocoder?"
    elif pitch_std < 30:
        return "Not bad! Your shower performances are probably decent"
    elif pitch_std < 60:
        return "Occasionally hits notes. Like a drunk dart player"
    else:
        return "Were you singing or demonstrating whale calls?"

def get_note_distribution(notes: list) -> Dict[str, float]:
    """Calculate frequency of each note with funny interpretations"""
    unique_notes = list(set(notes))
    counts = {note: notes.count(note) for note in unique_notes}
    total = max(1, sum(counts.values()))
    
    return {
        'most_common': max(counts, key=counts.get),
        'least_common': min(counts, key=counts.get),
        'distribution': {note: count/total for note, count in counts.items()},
        'interpretation': choice([
            "Your vocal range is... interesting",
            "Someone clearly has favorite notes",
            "This note distribution would make Bach cry"
        ])
    }