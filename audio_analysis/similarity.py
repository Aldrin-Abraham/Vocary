import numpy as np
import librosa
from typing import Tuple
from random import choice, random

def compare_voices(reference_path: str, user_path: str) -> Tuple[float, str]:
    """Compare user's voice to reference with savage accuracy"""
    try:
        # Load both audio files
        y_ref, sr_ref = librosa.load(reference_path)
        y_user, sr_user = librosa.load(user_path)
        
        # Extract features (simplified for example)
        mfcc_ref = librosa.feature.mfcc(y=y_ref, sr=sr_ref)
        mfcc_user = librosa.feature.mfcc(y=y_user, sr=sr_user)
        
        # Calculate similarity (placeholder)
        similarity_score = calculate_similarity_score(mfcc_ref, mfcc_user)
        
        # Generate funny feedback
        feedback = generate_similarity_feedback(similarity_score)
        
        return similarity_score, feedback
    except Exception as e:
        return 0, f"Our comparison algorithm failed harder than your singing: {str(e)}"

def calculate_similarity_score(mfcc_ref: np.ndarray, mfcc_user: np.ndarray) -> float:
    """Calculate similarity score between two audio samples"""
    # In a real app, this would use proper voice embeddings
    # This is a simplified placeholder implementation
    
    # Calculate mean MFCC difference
    diff = np.mean(np.abs(mfcc_ref[:,:100] - mfcc_user[:,:100]))
    
    # Convert to similarity score (0-100)
    score = max(0, min(100, 100 - diff * 10))
    
    # Add some random variation for demo purposes
    score *= (0.9 + random() * 0.2)
    
    return round(score, 1)

def generate_similarity_feedback(score: float) -> str:
    """Generate brutally honest feedback based on similarity score"""
    if score > 90:
        return "Are you the original artist using a fake account? Suspiciously good!"
    elif score > 75:
        return "Close enough that your mom would be proud"
    elif score > 50:
        return "Somewhere between 'inspired by' and 'butchered'"
    elif score > 25:
        return "The musical equivalent of a bad photocopy"
    else:
        return choice([
            "Were you even trying to sing the same song?",
            "This comparison is an insult to the original artist",
            "Please stop. For everyone's sake."
        ])