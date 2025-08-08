import numpy as np
import librosa
from typing import Dict, Any
from random import choice, random
from .utils import load_audio

def analyze_timbre(audio_path: str) -> Dict[str, Any]:
    """Analyze timbre characteristics with savage honesty"""
    try:
        y, sr = load_audio(audio_path)
        
        # Extract features
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        mfcc = librosa.feature.mfcc(y=y, sr=sr)
        
        # Calculate statistics
        brightness = float(np.mean(spectral_centroid))
        warmth = float(np.mean(spectral_bandwidth))
        richness = float(np.std(mfcc)) * 10
        hnr = float(5 + random() * 15)  # Placeholder for harmonic-to-noise ratio
        
        # Generate classifications
        voice_type, type_description = classify_voice(brightness, warmth, richness)
        feedback = generate_timbre_feedback(voice_type, brightness, warmth)
        
        return {
            'status': 'success',
            'voice_type': voice_type,
            'type_description': type_description,
            'feedback': feedback,
            'stats': {
                'brightness': brightness,
                'warmth': warmth,
                'richness': richness,
                'hnr': hnr
            },
            'traits': {
                'sultry': min(100, int(30 + warmth / 3 + random() * 20)),
                'nasal': min(100, int(20 + (100 - warmth) / 2 + random() * 20)),
                'breathy': min(100, int(10 + (100 - richness) / 3 + random() * 30)),
                'authoritative': min(100, int(richness / 2 + random() * 20))
            }
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'feedback': "Our timbre analyzer got stage fright. Try again?"
        }

def classify_voice(brightness: float, warmth: float, richness: float) -> tuple:
    """Classify voice type with humorous labels"""
    # Normalize values to 0-100 range
    brightness_norm = min(100, brightness / 50 * 100)
    warmth_norm = min(100, warmth / 2000 * 100)
    richness_norm = min(100, richness)
    
    # Calculate a combined score
    combined = (brightness_norm * 0.4 + warmth_norm * 0.3 + richness_norm * 0.3)
    
    if combined > 80:
        return ("Sultry Jazz Singer", "You could narrate romance novels")
    elif combined > 60:
        return ("Morning Radio DJ", "Do you say 'wubba lubba dub dub' unironically?")
    elif combined > 40:
        return ("Tired College Professor", "Your voice could cure insomnia")
    elif combined > 20:
        return ("Teenager Hitting Puberty", "Voice cracks included at no extra charge")
    else:
        return ("Excited Puppy", "Is your tail wagging while you speak?")

def generate_timbre_feedback(voice_type: str, brightness: float, warmth: float) -> str:
    """Generate funny feedback based on timbre characteristics"""
    if "Jazz Singer" in voice_type:
        return choice([
            "Your voice could melt butter... or maybe just cheese at room temperature",
            "10/10 would listen to your voicemail greeting on repeat",
            "Are you single? Asking for a friend who likes smooth talkers"
        ])
    elif "Radio DJ" in voice_type:
        return choice([
            "You sound like you should be selling used cars",
            "Do you practice your 'in a world...' movie trailer voice?",
            "Your voice has 'morning zoo crew' energy"
        ])
    elif "Professor" in voice_type:
        return choice([
            "Your voice could read the phone book and make it sound boring",
            "Do you put people to sleep at parties?",
            "Your vocal fry makes you sound either smart or sleep-deprived"
        ])
    elif "Puberty" in voice_type:
        return choice([
            "Your voice cracks give you character!",
            "Are you sure you're not a goat?",
            "Your voice is going through its awkward phase"
        ])
    else:  # Puppy
        return choice([
            "Who's a good vocalist? Not you, but you're enthusiastic!",
            "Your energy is contagious, your pitch less so",
            "Do you get excited when the mailman comes too?"
        ])