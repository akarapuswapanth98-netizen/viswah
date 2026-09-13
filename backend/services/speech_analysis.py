# Speech Analysis Service - Voice Feedback Engine

import logging
import math

logger = logging.getLogger(__name__)

# Try to import numpy (optional)
NUMPY_AVAILABLE = False
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    logger.info("numpy not installed - using basic analysis")


# Note frequencies (A4 = 440Hz)
NOTE_FREQUENCIES = {
    "C2": 65.41, "C#2": 69.30, "D2": 73.42, "D#2": 77.78, "E2": 82.41, "F2": 87.31,
    "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
    "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61,
    "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
    "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23,
    "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
    "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46,
    "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
    "C6": 1046.50
}

# Target notes for exercises
EXERCISES = {
    "scale_c_major": {
        "name": "C Major Scale",
        "description": "Sing the C major scale up and down",
        "target_notes": ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"],
        "difficulty": "beginner"
    },
    "scale_g_major": {
        "name": "G Major Scale",
        "description": "Sing the G major scale up and down",
        "target_notes": ["G4", "A4", "B4", "C5", "D5", "E5", "F#5", "G5", "F#5", "E5", "D5", "C5", "B4", "A4", "G4"],
        "difficulty": "beginner"
    },
    "interval_thirds": {
        "name": "Interval Training - Thirds",
        "description": "Sing intervals of a third",
        "target_notes": ["C4", "E4", "D4", "F4", "E4", "G4", "F4", "A4", "G4", "B4", "A4", "C5"],
        "difficulty": "intermediate"
    },
    "vocal_warmup": {
        "name": "Vocal Warm-up",
        "description": "Five-note pattern warm-up",
        "target_notes": ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4", "C4",
                         "D4", "E4", "F#4", "G4", "A4", "G4", "F#4", "E4", "D4"],
        "difficulty": "beginner"
    },
    "pitch_stability": {
        "name": "Pitch Stability Test",
        "description": "Hold each note steady for 3 seconds",
        "target_notes": ["C4", "E4", "G4", "C5", "G4", "E4", "C4"],
        "difficulty": "intermediate"
    }
}


def frequency_to_note(freq: float) -> str:
    """Convert frequency to nearest note name"""
    if freq <= 0:
        return "Unknown"

    min_distance = float('inf')
    best_note = "Unknown"

    for note, note_freq in NOTE_FREQUENCIES.items():
        distance = abs(freq - note_freq)
        if distance < min_distance:
            min_distance = distance
            best_note = note

    return best_note


def frequency_to_cents(freq: float, target_freq: float) -> float:
    """Calculate cents deviation from target frequency"""
    if freq <= 0 or target_freq <= 0:
        return 0
    return 1200 * math.log2(freq / target_freq)


def analyze_pitch_from_data(audio_data: list[float], sample_rate: int = 44100) -> dict:
    """
    Analyze pitch from raw audio data using autocorrelation.
    Returns pitch analysis results.
    """
    if not audio_data or len(audio_data) < 100:
        return {"error": "Insufficient audio data", "pitch": 0, "note": "Unknown", "stability": 0}

    if NUMPY_AVAILABLE:
        return _analyze_pitch_numpy(audio_data, sample_rate)
    else:
        return _analyze_pitch_basic(audio_data, sample_rate)


def _analyze_pitch_numpy(audio_data: list[float], sample_rate: int) -> dict:
    """Pitch analysis using numpy autocorrelation"""
    try:
        audio = np.array(audio_data, dtype=np.float64)

        # Remove DC offset
        audio = audio - np.mean(audio)

        # Autocorrelation
        correlation = np.correlate(audio, audio, mode='full')
        correlation = correlation[len(correlation) // 2:]

        # Find first peak after zero crossing
        min_lag = int(sample_rate / 1000)  # 1000 Hz max
        max_lag = int(sample_rate / 50)    # 50 Hz min

        if max_lag > len(correlation):
            max_lag = len(correlation) - 1

        # Find the lag with highest correlation in valid range
        search_range = correlation[min_lag:max_lag]
        if len(search_range) == 0:
            return {"pitch": 0, "note": "Unknown", "stability": 0, "cents": 0}

        peak_lag = min_lag + np.argmax(search_range)
        peak_value = correlation[peak_lag]

        if peak_value < 0.3:  # Low confidence
            return {"pitch": 0, "note": "Unknown", "stability": 0, "cents": 0}

        pitch = sample_rate / peak_lag
        note = frequency_to_note(pitch)

        # Calculate stability (coefficient of variation)
        window_size = int(sample_rate * 0.1)  # 100ms windows
        pitches = []
        for i in range(0, len(audio) - window_size, window_size // 2):
            window = audio[i:i + window_size]
            win_corr = np.correlate(window, window, mode='full')
            win_corr = win_corr[len(win_corr) // 2:]
            win_range = win_corr[min_lag:max_lag]
            if len(win_range) > 0:
                win_peak = min_lag + np.argmax(win_range)
                if win_peak > 0:
                    pitches.append(sample_rate / win_peak)

        stability = 0
        if len(pitches) > 1:
            mean_pitch = np.mean(pitches)
            std_pitch = np.std(pitches)
            stability = max(0, 100 - (std_pitch / mean_pitch * 100))

        target_freq = NOTE_FREQUENCIES.get(note, pitch)
        cents = frequency_to_cents(pitch, target_freq)

        return {
            "pitch": round(pitch, 2),
            "note": note,
            "stability": round(stability, 1),
            "cents": round(cents, 1),
            "confidence": round(peak_value * 100, 1)
        }
    except Exception as e:
        logger.error(f"Pitch analysis error: {e}")
        return {"pitch": 0, "note": "Unknown", "stability": 0, "cents": 0, "confidence": 0}


def _analyze_pitch_basic(audio_data: list[float], sample_rate: int) -> dict:
    """Basic pitch analysis without numpy"""
    try:
        # Simple zero-crossing rate for pitch estimation
        crossings = 0
        for i in range(1, len(audio_data)):
            if (audio_data[i] >= 0 and audio_data[i - 1] < 0) or \
               (audio_data[i] < 0 and audio_data[i - 1] >= 0):
                crossings += 1

        duration = len(audio_data) / sample_rate
        if duration <= 0:
            return {"pitch": 0, "note": "Unknown", "stability": 0, "cents": 0, "confidence": 0}

        freq = crossings / (2 * duration)
        note = frequency_to_note(freq)
        target_freq = NOTE_FREQUENCIES.get(note, freq)
        cents = frequency_to_cents(freq, target_freq)

        return {
            "pitch": round(freq, 2),
            "note": note,
            "stability": 50.0,
            "cents": round(cents, 1),
            "confidence": 60.0
        }
    except Exception as e:
        logger.error(f"Basic pitch analysis error: {e}")
        return {"pitch": 0, "note": "Unknown", "stability": 0, "cents": 0, "confidence": 0}


def analyze_volume(audio_data: list[float]) -> dict:
    """Analyze volume/loudness of audio"""
    if not audio_data:
        return {"rms": 0, "peak": 0, "db": -60}

    if NUMPY_AVAILABLE:
        audio = np.array(audio_data)
        rms = float(np.sqrt(np.mean(audio ** 2)))
        peak = float(np.max(np.abs(audio)))
    else:
        rms = math.sqrt(sum(x ** 2 for x in audio_data) / len(audio_data))
        peak = max(abs(x) for x in audio_data)

    db = 20 * math.log10(rms) if rms > 0 else -60

    return {
        "rms": round(rms, 4),
        "peak": round(peak, 4),
        "db": round(db, 1),
        "level": "loud" if db > -10 else "normal" if db > -30 else "quiet"
    }


def score_performance(analysis: dict, target_note: str) -> dict:
    """Score the user's performance for a single note"""
    score = 0
    feedback = []

    # Pitch accuracy (40 points)
    if analysis.get("note") == target_note:
        score += 40
        feedback.append("Perfect pitch!")
    elif analysis.get("cents") is not None:
        cents = abs(analysis["cents"])
        if cents < 25:
            score += 35
            feedback.append("Very close to target pitch")
        elif cents < 50:
            score += 25
            feedback.append("Slightly off pitch")
        elif cents < 100:
            score += 15
            feedback.append("Noticeably off pitch - try adjusting")
        else:
            score += 5
            feedback.append("Significantly off pitch")

    # Stability (30 points)
    stability = analysis.get("stability", 0)
    score += int(stability * 0.3)
    if stability > 80:
        feedback.append("Excellent voice stability")
    elif stability > 60:
        feedback.append("Good stability - keep it steady")
    else:
        feedback.append("Try to hold the note more steadily")

    # Volume (15 points)
    db = analysis.get("db", -60)
    if -20 < db < -5:
        score += 15
        feedback.append("Good volume level")
    elif -30 < db < -20:
        score += 10
        feedback.append("A bit quiet - project more")
    elif db > -5:
        score += 8
        feedback.append("A bit loud - try softer")
    else:
        score += 3
        feedback.append("Too quiet - sing louder")

    # Confidence (15 points)
    confidence = analysis.get("confidence", 0)
    score += int(confidence * 0.15)

    return {
        "score": min(100, score),
        "target_note": target_note,
        "actual_note": analysis.get("note", "Unknown"),
        "cents_off": analysis.get("cents", 0),
        "feedback": feedback
    }


def get_exercise(exercise_id: str) -> dict | None:
    """Get exercise details"""
    return EXERCISES.get(exercise_id)


def get_all_exercises() -> list[dict]:
    """Get all available exercises"""
    return [{"id": eid, **ex} for eid, ex in EXERCISES.items()]


def analyze_full_session(audio_segments: list[dict], exercise_id: str) -> dict:
    """Analyze a complete singing session"""
    exercise = EXERCISES.get(exercise_id)
    if not exercise:
        return {"error": "Exercise not found"}

    target_notes = exercise["target_notes"]
    results = []
    total_score = 0

    for i, segment in enumerate(audio_segments):
        if i >= len(target_notes):
            break

        analysis = analyze_pitch_from_data(segment.get("audio_data", []), segment.get("sample_rate", 44100))
        volume = analyze_volume(segment.get("audio_data", []))
        analysis.update(volume)

        note_score = score_performance(analysis, target_notes[i])
        results.append(note_score)
        total_score += note_score["score"]

    avg_score = total_score / len(results) if results else 0

    return {
        "exercise": exercise["name"],
        "description": exercise["description"],
        "difficulty": exercise["difficulty"],
        "total_notes": len(target_notes),
        "analyzed_notes": len(results),
        "overall_score": round(avg_score, 1),
        "note_results": results,
        "summary": _generate_summary(avg_score, results)
    }


def _generate_summary(score: float, results: list[dict]) -> str:
    """Generate a text summary of the performance"""
    if score >= 90:
        return "Excellent performance! Your pitch and tone are very accurate."
    elif score >= 75:
        return "Great job! Minor improvements needed in pitch accuracy."
    elif score >= 60:
        return "Good effort! Focus on hitting the target notes more precisely."
    elif score >= 40:
        return "Keep practicing! Try using a piano reference for pitch."
    else:
        return "Don't give up! Start with simpler exercises and work your way up."
