import numpy as np
import librosa
import soundfile as sf
from typing import Dict, Any

def load_audio(audio_path: str, sr: int = 22050) -> tuple:
    """Load audio file with consistent sample rate and handling"""
    try:
        y, sr = librosa.load(audio_path, sr=sr)
        return y, sr
    except Exception as e:
        # Try soundfile as fallback
        try:
            y, sr = sf.read(audio_path)
            if y.ndim > 1:  # Convert stereo to mono if needed
                y = np.mean(y, axis=1)
            return librosa.resample(y, orig_sr=sr, target_sr=22050), 22050
        except Exception as e2:
            raise Exception(f"Failed to load audio: {str(e)}; {str(e2)}")

def extract_features(y: np.ndarray, sr: int) -> Dict[str, Any]:
    """Extract common audio features"""
    features = {}
    
    # Spectral features
    features['spectral_centroid'] = librosa.feature.spectral_centroid(y=y, sr=sr)
    features['spectral_bandwidth'] = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    features['spectral_contrast'] = librosa.feature.spectral_contrast(y=y, sr=sr)
    
    # MFCCs
    features['mfcc'] = librosa.feature.mfcc(y=y, sr=sr)
    
    # Pitch
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    features['pitch'] = pitches[pitches > 0]
    
    # Rhythm
    features['tempo'], features['beat_frames'] = librosa.beat.beat_track(y=y, sr=sr)
    
    return features

def normalize_features(features: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize feature vectors for comparison"""
    normalized = {}
    for key, value in features.items():
        if isinstance(value, np.ndarray):
            mean = np.mean(value)
            std = np.std(value)
            normalized[key] = (value - mean) / std if std > 0 else value
        else:
            normalized[key] = value
    return normalized