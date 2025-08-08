import numpy as np
import librosa
from typing import Tuple, Dict, Any
from random import choice, random
from .utils import load_audio, extract_features

def compare_voices(reference_path: str, user_path: str) -> Tuple[float, str, Dict[str, Any]]:
    """Compare user's voice to reference with savage accuracy"""
    try:
        # Load both audio files
        y_ref, sr_ref = load_audio(reference_path)
        y_user, sr_user = load_audio(user_path)
        
        # Extract features
        features_ref = extract_features(y_ref, sr_ref)
        features_user = extract_features(y_user, sr_user)
        
        # Calculate similarity scores for different aspects
        pitch_sim = compare_pitch(features_ref['pitch'], features_user['pitch'])
        mfcc_sim = compare_mfcc(features_ref['mfcc'], features_user['mfcc'])
        centroid_sim = compare_centroid(features_ref['spectral_centroid'], features_user['spectral_centroid'])
        
        # Combine scores with weights
        similarity_score = 0.4 * pitch_sim + 0.4 * mfcc_sim + 0.2 * centroid_sim
        
        # Add some random variation for demo purposes
        similarity_score *= (0.9 + random() * 0.2)
        similarity_score = max(0, min(100, similarity_score))
        
        # Generate feedback
        feedback = generate_similarity_feedback(similarity_score)
        
        return round(similarity_score, 1), feedback, {
            'pitch_similarity': pitch_sim,
            'timbre_similarity': mfcc_sim,
            'brightness_similarity': centroid_sim
        }
    except Exception as e:
        return 0, f"Our comparison algorithm failed harder than your singing: {str(e)}", {}

def compare_pitch(pitch_ref: np.ndarray, pitch_user: np.ndarray) -> float:
    """Compare pitch characteristics"""
    if len(pitch_ref) == 0 or len(pitch_user) == 0:
        return 0
    
    # Compare mean pitch (normalized to 0-100 scale)
    mean_ref = np.mean(pitch_ref)
    mean_user = np.mean(pitch_user)
    mean_diff = abs(mean_ref - mean_user)
    mean_sim = max(0, 100 - mean_diff / 10)
    
    # Compare pitch variability
    std_ref = np.std(pitch_ref)
    std_user = np.std(pitch_user)
    std_sim = max(0, 100 - abs(std_ref - std_user) / 5)
    
    return (mean_sim * 0.6 + std_sim * 0.4)

def compare_mfcc(mfcc_ref: np.ndarray, mfcc_user: np.ndarray) -> float:
    """Compare MFCC features (timbre)"""
    # Calculate mean MFCC difference (simplified)
    diff = np.mean(np.abs(mfcc_ref[:,:100] - mfcc_user[:,:100]))
    return max(0, 100 - diff * 10)

def compare_centroid(centroid_ref: np.ndarray, centroid_user: np.ndarray) -> float:
    """Compare spectral centroid (brightness)"""
    mean_ref = np.mean(centroid_ref)
    mean_user = np.mean(centroid_user)
    diff = abs(mean_ref - mean_user)
    return max(0, 100 - diff / 100)

def generate_similarity_feedback(score: float) -> str:
    """Generate brutally honest feedback based on similarity score"""
    if score > 90:
        return choice([
            "Are you the original artist using a fake account? Suspiciously good!",
            "This is either amazing or you're cheating. We're not sure which.",
            "The algorithm thinks you might be the real deal (but we have doubts)"
        ])
    elif score > 75:
        return choice([
            "Close enough that your mom would be proud",
            "Not terrible! By which we mean it's recognizable as the same song",
            "Somewhere between 'inspired by' and 'butchered'"
        ])
    elif score > 50:
        return choice([
            "The musical equivalent of a bad photocopy",
            "We can tell what song you were going for... mostly",
            "Your version is... unique"
        ])
    else:
        return choice([
            "Were you even trying to sing the same song?",
            "This comparison is an insult to the original artist",
            "Please stop. For everyone's sake."
        ])