import numpy as np
import librosa

def load_audio(audio_path: str, sr: int = 22050) -> np.ndarray:
    """Load audio file with consistent sample rate"""
    y, _ = librosa.load(audio_path, sr=sr)
    return y

def extract_features(y: np.ndarray, sr: int) -> dict:
    """Extract common audio features"""
    features = {}
    
    # Spectral features
    features['spectral_centroid'] = librosa.feature.spectral_centroid(y=y, sr=sr)
    features['spectral_bandwidth'] = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    
    # MFCCs
    features['mfcc'] = librosa.feature.mfcc(y=y, sr=sr)
    
    # Pitch
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    features['pitch'] = pitches[pitches > 0]
    
    return features

def normalize_features(features: dict) -> dict:
    """Normalize feature vectors"""
    normalized = {}
    for key, value in features.items():
        if isinstance(value, np.ndarray):
            mean = np.mean(value)
            std = np.std(value)
            normalized[key] = (value - mean) / std if std > 0 else value
        else:
            normalized[key] = value
    return normalized