import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function AudioPlayer({ src, className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef(null);
  const volumeRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target)) {
        setShowVolumeSlider(false);
      }
    };

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.getBoundingClientRect().left;
    const width = progressBar.offsetWidth;
    const newTime = (clickX / width) * duration;

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleVolumeSlider = () => {
    setShowVolumeSlider(!showVolumeSlider);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(139, 92, 246, 0);
          }
        }

        .volume-slider-enter {
          animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .playing-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        input[type="range"].volume-slider::-webkit-slider-thumb {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        input[type="range"].volume-slider:hover::-webkit-slider-thumb {
          transform: scale(1.3);
        }

        input[type="range"].volume-slider::-moz-range-thumb {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        input[type="range"].volume-slider:hover::-moz-range-thumb {
          transform: scale(1.3);
        }
      `}</style>

      <div className={`flex items-center gap-3 bg-transparent ${className}`}>
        <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className={`flex-shrink-0 w-9 h-9 flex items-center justify-center bg-brandPrimary/90 hover:bg-brandPrimary hover:scale-110 active:scale-95 rounded-full transition-all duration-200 ${
          isPlaying ? 'playing-pulse' : ''
        }`}
      >
        {isPlaying ? (
          <Pause size={16} className="text-white fill-white" />
        ) : (
          <Play size={16} className="text-white fill-white ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex items-center gap-3">
        <span className="text-[11px] text-textSecondary/80 font-mono min-w-[35px] tabular-nums">
          {formatTime(currentTime)}
        </span>

        <div
          className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative overflow-hidden hover:h-2 transition-all"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-brandPrimary/90 rounded-full transition-all relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-0 group-hover:scale-100" />
          </div>
        </div>

        <span className="text-[11px] text-textSecondary/80 font-mono min-w-[35px] tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      <div ref={volumeRef} className="relative flex items-center gap-2">
        <button
          onClick={toggleVolumeSlider}
          className={`text-textSecondary/70 hover:text-brandPrimary transition-all p-1 hover:scale-110 ${
            showVolumeSlider ? 'text-brandPrimary scale-110' : ''
          }`}
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={16} />
          ) : (
            <Volume2 size={16} />
          )}
        </button>

        {showVolumeSlider && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider volume-slider-enter w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-2.5
                       [&::-webkit-slider-thumb]:h-2.5
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-moz-range-thumb]:w-2.5
                       [&::-moz-range-thumb]:h-2.5
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-white
                       [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:shadow-lg"
          />
        )}
      </div>
      </div>
    </>
  );
}
