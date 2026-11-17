from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
MUSIC_DIR = BASE_DIR / "music"
MUSIC_DIR.mkdir(exist_ok=True)

app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".mp3", ".wav", ".ogg", ".oga", ".m4a",
    ".aac", ".flac", ".opus", ".webm"
}

def make_track(path: Path):
    title = path.stem.replace("_", " ").replace("-", " ").strip()
    return {
        "filename": path.name,
        "title": title or "Unknown track",
        "artist": "Local artist",
        "album": "Your library"
    }

@app.get("/api/health")
def health():
    return jsonify({
        "status": "online",
        "service": "AURA Music Flask API"
    })

@app.get("/api/tracks")
def get_tracks():
    files = [
        path for path in MUSIC_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS
    ]
    files.sort(key=lambda item: item.name.lower())
    return jsonify({"tracks": [make_track(path) for path in files]})

@app.post("/api/upload")
def upload_tracks():
    files = request.files.getlist("files")

    if not files:
        return jsonify({"error": "Choose at least one audio file."}), 400

    uploaded = []
    rejected = []

    for file in files:
        if not file or not file.filename:
            continue

        safe_name = secure_filename(file.filename)
        extension = Path(safe_name).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            rejected.append(file.filename)
            continue

        # Avoid overwriting an existing song.
        destination = MUSIC_DIR / safe_name
        if destination.exists():
            destination = MUSIC_DIR / f"{Path(safe_name).stem}_{uuid.uuid4().hex[:8]}{extension}"

        file.save(destination)
        uploaded.append(make_track(destination))

    return jsonify({
        "uploaded": uploaded,
        "rejected": rejected
    })

@app.get("/music/<path:filename>")
def stream_music(filename):
    return send_from_directory(MUSIC_DIR, filename, conditional=True)

@app.errorhandler(413)
def too_large(_error):
    return jsonify({"error": "File too large. Maximum upload size is 100 MB per request."}), 413

if __name__ == "__main__":
    print("AURA Music API starting at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
