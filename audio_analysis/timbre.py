import numpy as np
import librosa
from typing import Dict, Any
from random import choice, random

def analyze_timbre(audio_path: str) -> Dict[str, Any]:
    """Analyze timbre characteristics with savage honesty"""
    try:
        y, sr = librosa.load(audio_path)
        
        # Extract features
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
        mfcc = librosa.feature.mfcc(y=y, sr=sr)
        
        # Generate funny classifications
        voice_type, feedback = classify_voice(
            np.mean(spectral_centroid),
            np.mean(spectral_bandwidth),
            np.mean(mfcc)
        )
        
        return {
            'status': 'success',
            'voice_type': voice_type,
            'feedback': feedback,
            'brightness': float(np.mean(spectral_centroid)),
            'warmth': float(np.mean(spectral_bandwidth)),
            'richness': float(np.std(mfcc)) * 10,
            'hnr': f"{random() * 15 + 5:.1f} dB",  # Harmonic-to-noise ratio
            'traits': {
                'sultry': min(100, int(random() * 40 + 60)),
                'nasal': min(100, int(random() * 70 + 10)),
                'breathy': min(100, int(random() * 80)),
                'authoritative': min(100, int(random() * 50))
            }
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'feedback': "Our timbre analyzer got stage fright. Try again?"
        }

def classify_voice(centroid: float, bandwidth: float, mfcc: float) -> tuple:
    """Classify voice type with humorous labels"""
    voice_types = [
        ("Sultry Jazz Singer", "You could narrate romance novels"),
        ("Teenager Hitting Puberty", "Voice cracks included at no extra charge"),
        ("ASMR Whisperer", "10/10 would listen to you crinkle paper"),
        ("Morning Radio DJ", "Do you say 'wubba lubba dub dub' unironically?"),
        ("Tired College Professor", "Your voice could cure insomnia"),
        ("Excited Puppy", "Is your tail wagging while you speak?")
    ]
    
    # Simple classification based on features
    index = min(
        int((centroid / 2000 + bandwidth / 1000 + mfcc / 1000) * len(voice_types)),
        len(voice_types) - 1
    )
    return voice_types[index]