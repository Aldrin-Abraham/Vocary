# Initialize audio analysis package
from .pitch import analyze_pitch
from .timbre import analyze_timbre
from .similarity import compare_voices

__all__ = ['analyze_pitch', 'analyze_timbre', 'compare_voices']