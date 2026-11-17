import React, { useEffect, useRef, useState } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Search, Music2, Headphones, Heart, Library, Plus,
  MoreHorizontal, Shuffle, Repeat, Upload, Disc3,
  AudioLines, Clock3, ListMusic
} from "lucide-react";

const formatTime = (value) => {
  if (!Number.isFinite(value)) return "0:00";
  const m = Math.floor(value / 60);
  const s = Math.floor(value % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const colors = [
  "cover-purple", "cover-blue", "cover-orange",
  "cover-green", "cover-pink", "cover-cyan"
];

function App() {
  const audioRef = useRef(null);
  const fileRef = useRef(null);

  const [tracks, setTracks] = useState([]);
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [liked, setLiked] = useState([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  async function loadTracks() {
    try {
      const response = await fetch("/api/tracks");
      if (!response.ok) throw new Error("Backend unavailable");
      const data = await response.json();
      setTracks(data.tracks || []);
      setMessage("");
    } catch {
      setMessage("Cannot connect to Flask. Start the backend first.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  function playTrack(track) {
    setCurrent(track);
    setTime(0);
    setDuration(0);
    setPlaying(true);
  }

  useEffect(() => {
    if (!audioRef.current || !current) return;

    audioRef.current.src = `/music/${encodeURIComponent(current.filename)}`;
    audioRef.current.load();

    const promise = audioRef.current.play();
    if (promise) {
      promise.then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }, [current]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!current && tracks.length) {
      playTrack(tracks[0]);
      return;
    }

    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function nextTrack() {
    if (!tracks.length) return;

    if (shuffle && tracks.length > 1) {
      const choices = tracks.filter(t => t.filename !== current?.filename);
      playTrack(choices[Math.floor(Math.random() * choices.length)]);
      return;
    }

    const index = tracks.findIndex(t => t.filename === current?.filename);
    playTrack(tracks[(index + 1) % tracks.length]);
  }

  function previousTrack() {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const index = tracks.findIndex(t => t.filename === current?.filename);
    if (tracks.length) {
      playTrack(tracks[(index - 1 + tracks.length) % tracks.length]);
    }
  }

  async function uploadFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setMessage("");

    try {
      const form = new FormData();
      files.forEach(file => form.append("files", file));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Upload failed");

      await loadTracks();
      setMessage(`${data.uploaded.length} track(s) added to your library.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function toggleLike(filename) {
    setLiked(old =>
      old.includes(filename)
        ? old.filter(item => item !== filename)
        : [...old, filename]
    );
  }

  const visibleTracks = tracks.filter(track =>
    `${track.title} ${track.artist}`.toLowerCase().includes(search.toLowerCase())
  );

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><AudioLines size={23} /></div>
          <span>AURA<span className="brand-dot">.</span></span>
        </div>

        <div className="side-label">MENU</div>
        <nav className="nav-list">
          <button className="nav-item active"><Disc3 size={19}/> Discover</button>
          <button className="nav-item" onClick={() => setSearch("")}>
            <Library size={19}/> Your library
          </button>
          <button className="nav-item" onClick={() => setSearch("")}>
            <Heart size={19}/> Liked songs
          </button>
        </nav>

        <div className="side-label playlist-label">YOUR COLLECTION</div>
        <button className="nav-item" onClick={() => fileRef.current?.click()}>
          <Plus size={19}/> Add music
        </button>
        <button className="nav-item">
          <ListMusic size={19}/> All tracks
        </button>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Headphones size={21}/>
            <strong>Your music. Your space.</strong>
            <span>Enjoy your personal collection.</span>
          </div>
          <div className="profile">
            <div className="avatar">A</div>
            <div><strong>Music lover</strong><small>Local library</small></div>
            <MoreHorizontal size={20}/>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="greeting">
            <span className="eyebrow">YOUR PERSONAL SOUNDTRACK</span>
            <h1>Good music. <span>Good mood.</span></h1>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={18}/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search your music..."
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="upload-button" onClick={() => fileRef.current?.click()}>
              <Upload size={17}/> <span>Add music</span>
            </button>
          </div>
        </header>

        <section className="hero">
          <div className="hero-content">
            <div className="hero-tag"><span className="live-dot"/> YOUR MUSIC EXPERIENCE</div>
            <h2>Feel every<br/> <em>frequency.</em></h2>
            <p>Your favourite sounds, collected in one beautiful place.</p>
            <button className="hero-button" onClick={() => tracks.length ? playTrack(tracks[0]) : fileRef.current?.click()}>
              <Play size={17} fill="currentColor"/>
              {tracks.length ? "Play your music" : "Add your first song"}
            </button>
          </div>
          <div className="hero-art">
            <div className="art-ring ring-one"/>
            <div className="art-ring ring-two"/>
            <div className="art-disc"><AudioLines size={62}/></div>
            <div className="floating-note note-one">♫</div>
            <div className="floating-note note-two">♪</div>
          </div>
          <div className="hero-glow"/>
        </section>

        {message && (
          <div className="message">
            <span>{message}</span>
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <section className="library-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MADE FOR YOUR EARS</span>
              <h2>{search ? "Search results" : "Your music library"}</h2>
            </div>
            <div className="track-count">{tracks.length} TRACKS</div>
          </div>

          {loading ? (
            <div className="empty-state"><Disc3 className="spin" size={35}/><p>Loading your library...</p></div>
          ) : visibleTracks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Music2 size={31}/></div>
              <h3>{search ? "No matching tracks" : "Your library is waiting"}</h3>
              <p>{search ? "Try another search." : "Upload music from your computer to get started."}</p>
              {!search && (
                <button className="outline-button" onClick={() => fileRef.current?.click()}>
                  <Plus size={17}/> Add your first tracks
                </button>
              )}
            </div>
          ) : (
            <div className="track-table">
              <div className="table-head">
                <span>#</span><span>TITLE</span><span>ALBUM</span><span><Clock3 size={15}/></span><span></span>
              </div>
              {visibleTracks.map((track, index) => {
                const active = current?.filename === track.filename;
                return (
                  <div className={`track-row ${active ? "selected" : ""}`} key={track.filename}
                    onDoubleClick={() => playTrack(track)}>
                    <span className="track-index">
                      {active && playing ? <AudioLines size={17}/> : String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="track-title" onClick={() => playTrack(track)}>
                      <div className={`mini-cover ${colors[index % colors.length]}`}>
                        <Music2 size={19}/>
                      </div>
                      <div className="track-name">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </div>
                    </div>
                    <span className="album-name">{track.album}</span>
                    <span className="duration">{active ? formatTime(time) : "—:——"}</span>
                    <button className={`like-button ${liked.includes(track.filename) ? "liked" : ""}`}
                      onClick={() => toggleLike(track.filename)}>
                      <Heart size={17} fill={liked.includes(track.filename) ? "currentColor" : "none"}/>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="footer">
          <span>AURA MUSIC</span>
          <span>YOUR SOUND. YOUR WORLD.</span>
        </footer>
      </main>

      <input ref={fileRef} type="file" accept="audio/*" multiple hidden onChange={uploadFiles}/>

      <audio
        ref={audioRef}
        onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => repeat ? (audioRef.current.currentTime = 0, audioRef.current.play()) : nextTrack()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="player">
        <div className="now-playing">
          {current ? (
            <>
              <div className={`player-cover ${colors[tracks.findIndex(t => t.filename === current.filename) % colors.length]}`}>
                <Disc3 size={27}/>
              </div>
              <div className="now-info">
                <strong>{current.title}</strong>
                <span>{current.artist}</span>
              </div>
              <button className={`like-button ${liked.includes(current.filename) ? "liked" : ""}`}
                onClick={() => toggleLike(current.filename)}>
                <Heart size={17} fill={liked.includes(current.filename) ? "currentColor" : "none"}/>
              </button>
            </>
          ) : (
            <>
              <div className="player-cover placeholder-cover"><Music2 size={24}/></div>
              <div className="now-info"><strong>Nothing playing</strong><span>Choose a track</span></div>
            </>
          )}
        </div>

        <div className="playback">
          <div className="player-controls">
            <button className={shuffle ? "control-active" : ""} onClick={() => setShuffle(!shuffle)} title="Shuffle"><Shuffle size={17}/></button>
            <button onClick={previousTrack} title="Previous"><SkipBack size={20} fill="currentColor"/></button>
            <button className="play-main" onClick={togglePlay} title="Play or pause">
              {playing ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
            </button>
            <button onClick={nextTrack} title="Next"><SkipForward size={20} fill="currentColor"/></button>
            <button className={repeat ? "control-active" : ""} onClick={() => setRepeat(!repeat)} title="Repeat"><Repeat size={17}/></button>
          </div>
          <div className="progress-row">
            <span>{formatTime(time)}</span>
            <input type="range" min="0" max={duration || 100} value={Math.min(time, duration || 100)}
              onChange={e => {
                if (audioRef.current && duration) {
                  audioRef.current.currentTime = Number(e.target.value);
                  setTime(Number(e.target.value));
                }
              }}/>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume-control">
          {muted || volume === 0 ? <VolumeX size={18}/> : <Volume2 size={18}/>}
          <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
            onChange={e => {setVolume(Number(e.target.value)); setMuted(false);}}/>
        </div>
      </div>
    </div>
  );
}

export default App;
