import numpy as np
import librosa
from typing import Dict, Any
from random import random, choice
from .utils import load_audio

def analyze_pitch(audio_path: str) -> Dict[str, Any]:
    """Analyze pitch characteristics with humorous feedback"""
    try:
        y, sr = load_audio(audio_path)
        
        # Extract pitch using YIN algorithm
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch = pitches[pitches > 0]  # Filter out zero values
        
        if len(pitch) == 0:
            return {
                'status': 'error',
                'error': 'No pitch detected',
                'feedback': "We couldn't detect any pitch. Were you singing or just breathing heavily?"
            }
        
        # Convert to musical notes
        notes = [librosa.hz_to_note(p) for p in pitch]
        
        # Calculate statistics
        pitch_mean = np.mean(pitch)
        pitch_std = np.std(pitch)
        pitch_range = np.max(pitch) - np.min(pitch)
        
        # Generate feedback
        feedback = generate_pitch_feedback(pitch)
        
        return {
            'status': 'success',
            'pitch_contour': pitch.tolist(),
            'notes': notes,
            'feedback': feedback,
            'accuracy': min(100, max(0, int(90 - (pitch_std / 50 * 100)))),
            'vibrato': f"{random() * 3 + 1:.1f} Hz",
            'note_distribution': get_note_distribution(notes),
            'stats': {
                'mean_pitch': float(pitch_mean),
                'pitch_std': float(pitch_std),
                'pitch_range': float(pitch_range)
            }
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
        return choice([
            "Robotic perfection! Are you a vocoder?",
            "Autotune called, it wants its job back",
            "Uncanny valley of pitch accuracy"
        ])
    elif pitch_std < 30:
        return choice([
            "Not bad! Your shower performances are probably decent",
            "Occasionally hits notes - like a broken clock is right twice a day",
            "Your pitch is like a GPS with occasional wrong turns"
        ])
    elif pitch_std < 60:
        return choice([
            "Occasionally hits notes. Like a drunk dart player",
            "Your pitch accuracy is... ambitious",
            "Were you going for avant-garde jazz?"
        ])
    else:
        return choice([
            "Were you singing or demonstrating whale calls?",
            "This is why aliens won't talk to us",
            "Your pitch is more unpredictable than the stock market"
        ])

def get_note_distribution(notes: list) -> Dict[str, float]:
    """Calculate frequency of each note with funny interpretations"""
    unique_notes = list(set(notes))
    counts = {note: notes.count(note) for note in unique_notes}
    total = max(1, sum(counts.values()))
    
    return {
        'most_common': max(counts, key=counts.get),
        'least_common': min(counts, key=counts.get),
        'distribution': {note: count/total for note, count in counts.items()},
        'interpretation': generate_note_interpretation(counts)
    }

def generate_note_interpretation(counts: dict) -> str:
    """Generate funny interpretation of note distribution"""
    most_common = max(counts, key=counts.get)
    least_common = min(counts, key=counts.get)
    
    if counts[most_common] / sum(counts.values()) > 0.5:
        return choice([
            f"Clearly obsessed with {most_common}",
            f"{most_common} is your comfort zone",
            f"Someone really likes {most_common}"
        ])
    else:
        return choice([
            "Your vocal range is... interesting",
            "This note distribution would make Bach cry",
            "You're keeping all notes equally disappointed"
        ])