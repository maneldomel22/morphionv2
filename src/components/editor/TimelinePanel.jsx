import { useRef, useState, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Type, Image, Video, Music, Trash2, Copy, Eye, EyeOff, Volume2, VolumeX, ChevronUp, ChevronDown, Lock, Unlock } from 'lucide-react';
import { getVideoMetadata } from '../../lib/videoMetadata';

export default function TimelinePanel() {
  const timelineRef = useRef(null);
  const [draggedClip, setDraggedClip] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [resizing, setResizing] = useState(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [hoveredTrackId, setHoveredTrackId] = useState(null);
  const [originalTrackId, setOriginalTrackId] = useState(null);
  const [draggedTrackId, setDraggedTrackId] = useState(null);
  const [dragOverTrackId, setDragOverTrackId] = useState(null);

  const {
    timeline,
    currentTime,
    selectedClipId,
    zoom,
    setCurrentTime,
    setSelectedClipId,
    setIsPlaying,
    updateClip,
    deleteClip,
    duplicateClip,
    moveClip,
    moveClipToTrack,
    addClip,
    updateTimelineDuration,
    moveTrackUp,
    moveTrackDown,
    reorderTracks,
    createNewTrack,
    toggleTrackLock,
    toggleTrackVisibility
  } = useEditorStore();

  const pixelsPerSecond = 50 * zoom;

  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setContainerWidth(timelineRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    const observer = new ResizeObserver(updateWidth);
    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, []);

  const snapToGrid = (time, gridSize = 0.25) => {
    return Math.round(time / gridSize) * gridSize;
  };

  const handleDrop = async (e, trackType) => {
    e.preventDefault();
    const videoData = e.dataTransfer.getData('video');
    if (!videoData) return;

    const video = JSON.parse(videoData);
    const container = timelineRef.current;
    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    const dropTime = snapToGrid(Math.max(0, x / pixelsPerSecond));

    const clipType = trackType || 'video';

    try {
      const metadata = await getVideoMetadata(video.video_url);

      const newClip = {
        id: `clip-${Date.now()}-${Math.random()}`,
        type: clipType,
        startTime: dropTime,
        duration: metadata.duration,
        sourceUrl: video.video_url,
        hasAudio: Boolean(metadata.hasAudio),
        properties: {
          src: video.video_url,
          x: 0,
          y: 0,
          scale: 1
        }
      };

      addClip(newClip);
      updateTimelineDuration();
    } catch (error) {
      console.error('Error getting video metadata:', error);

      const newClip = {
        id: `clip-${Date.now()}-${Math.random()}`,
        type: clipType,
        startTime: dropTime,
        duration: 5,
        sourceUrl: video.video_url,
        hasAudio: true,
        properties: {
          src: video.video_url,
          x: 0,
          y: 0,
          scale: 1
        }
      };

      addClip(newClip);
      updateTimelineDuration();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleTrackDragStart = (e, trackId) => {
    e.stopPropagation();
    setDraggedTrackId(trackId);
  };

  const handleTrackDragOver = (e, trackId) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedTrackId && draggedTrackId !== trackId) {
      setDragOverTrackId(trackId);
    }
  };

  const handleTrackDragEnd = () => {
    if (draggedTrackId && dragOverTrackId) {
      reorderTracks(draggedTrackId, dragOverTrackId);
    }
    setDraggedTrackId(null);
    setDragOverTrackId(null);
  };

  const handleTrackDragLeave = () => {
    setDragOverTrackId(null);
  };

  const getTimeFromPosition = (clientX) => {
    const container = timelineRef.current;
    if (!container) return 0;

    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const x = clientX - rect.left + scrollLeft;
    const time = Math.max(0, x / pixelsPerSecond);

    return time;
  };

  const handleTimelineClick = (e) => {
    if (isDraggingPlayhead || draggedClip || resizing) return;

    const time = getTimeFromPosition(e.clientX);
    setCurrentTime(time);
    setIsPlaying(false);
  };

  const handlePlayheadMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingPlayhead(true);
    setIsPlaying(false);
  };

  const getTrackFromY = (clientY) => {
    const container = timelineRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const y = clientY - rect.top + scrollTop - 32;

    const tracksWithClips = timeline.tracks.filter(track => track.clips.length > 0);

    if (tracksWithClips.length === 0) {
      return timeline.tracks[0] || null;
    }

    const trackIndex = Math.floor(y / 80);

    if (trackIndex < 0) {
      return tracksWithClips[0];
    }

    if (trackIndex >= tracksWithClips.length) {
      return { id: 'new-layer', isNew: true };
    }

    return tracksWithClips[trackIndex];
  };

  const handleClipMouseDown = (e, clip) => {
    e.stopPropagation();
    setSelectedClipId(clip.id);

    let clipTrack = null;
    for (const track of timeline.tracks) {
      if (track.clips.some(c => c.id === clip.id)) {
        clipTrack = track;
        break;
      }
    }

    if (clipTrack?.locked) {
      return;
    }

    const time = getTimeFromPosition(e.clientX);
    const clipStartPos = clip.startTime;

    setDragOffset(time - clipStartPos);
    setDraggedClip(clip.id);

    if (clipTrack) {
      setOriginalTrackId(clipTrack.id);
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingPlayhead) {
      const time = getTimeFromPosition(e.clientX);
      setCurrentTime(time);
      return;
    }

    if (resizing) {
      const time = getTimeFromPosition(e.clientX);
      const snappedTime = snapToGrid(time);

      let clip = null;
      for (const track of timeline.tracks) {
        clip = track.clips.find(c => c.id === resizing.clipId);
        if (clip) break;
      }

      if (!clip) return;

      if (resizing.direction === 'start') {
        const minDuration = 0.5;
        const maxStart = clip.startTime + clip.duration - minDuration;
        if (snappedTime < maxStart) {
          const newDuration = clip.duration + (clip.startTime - snappedTime);
          moveClip(resizing.clipId, snappedTime, newDuration);
        }
      } else if (resizing.direction === 'end') {
        const minDuration = 0.5;
        if (snappedTime > clip.startTime + minDuration) {
          const newDuration = snappedTime - clip.startTime;
          moveClip(resizing.clipId, clip.startTime, newDuration);
        }
      }
      return;
    }

    if (!draggedClip) return;

    const time = getTimeFromPosition(e.clientX);
    const newStart = snapToGrid(Math.max(0, time - dragOffset));

    let clip = null;
    for (const track of timeline.tracks) {
      clip = track.clips.find(c => c.id === draggedClip);
      if (clip) break;
    }

    if (!clip) return;

    moveClip(draggedClip, newStart, clip.duration);

    // Detectar track sob o cursor durante o drag
    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    const trackElement = elementUnderCursor?.closest('[data-track-id]');

    if (trackElement) {
      const trackId = trackElement.getAttribute('data-track-id');
      setHoveredTrackId(trackId);
    } else {
      setHoveredTrackId(null);
    }
  };

  const handleMouseUp = (e) => {
    if (draggedClip && hoveredTrackId && hoveredTrackId !== originalTrackId) {
      let clip = null;
      for (const track of timeline.tracks) {
        clip = track.clips.find(c => c.id === draggedClip);
        if (clip) break;
      }

      if (clip) {
        if (hoveredTrackId === 'new-layer') {
          const newLayerId = createNewTrack();
          moveClipToTrack(draggedClip, newLayerId, clip.startTime);
        } else {
          moveClipToTrack(draggedClip, hoveredTrackId, clip.startTime);
        }
      }
    }

    if (draggedClip || resizing || isDraggingPlayhead) {
      updateTimelineDuration();
    }

    setDraggedClip(null);
    setResizing(null);
    setDragOffset(0);
    setIsDraggingPlayhead(false);
    setHoveredTrackId(null);
    setOriginalTrackId(null);
  };

  const handleResizeStart = (e, clip, direction) => {
    e.stopPropagation();

    let clipTrack = null;
    for (const track of timeline.tracks) {
      if (track.clips.some(c => c.id === clip.id)) {
        clipTrack = track;
        break;
      }
    }

    if (clipTrack?.locked) {
      return;
    }

    setResizing({ clipId: clip.id, direction });
    setSelectedClipId(clip.id);
  };

  useEffect(() => {
    if (isDraggingPlayhead || draggedClip || resizing) {
      const handleMove = (e) => handleMouseMove(e);
      const handleUp = (e) => handleMouseUp(e);

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDraggingPlayhead, draggedClip, resizing, timeline, dragOffset, hoveredTrackId, originalTrackId]);

  const getClipIcon = (type) => {
    switch (type) {
      case 'video': return Video;
      case 'text': return Type;
      case 'image': return Image;
      case 'audio': return Music;
      default: return Video;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderClip = (clip, trackType, track) => {
    const Icon = getClipIcon(clip.type);
    const left = clip.startTime * pixelsPerSecond;
    const width = clip.duration * pixelsPerSecond;
    const isSelected = selectedClipId === clip.id;
    const isDragging = draggedClip === clip.id;
    const isLocked = track?.locked;

    const bgColors = {
      video: 'bg-gradient-to-r from-cyan-600 to-blue-600',
      audio: 'bg-gradient-to-r from-green-600 to-emerald-600',
      text: 'bg-gradient-to-r from-purple-600 to-pink-600',
      image: 'bg-gradient-to-r from-orange-600 to-amber-600'
    };

    const clipName = clip.properties?.text || clip.sourceUrl?.split('/').pop()?.split('.')[0] || 'Clip';

    return (
      <div
        key={clip.id}
        className={`absolute h-16 top-2 rounded-md ${bgColors[clip.type] || 'bg-gradient-to-r from-blue-600 to-cyan-600'}
          ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-surfaceDark' : ''}
          ${isDragging ? 'cursor-grabbing shadow-2xl scale-105 opacity-80' : isLocked ? 'cursor-not-allowed' : 'cursor-grab'}
          ${isLocked ? 'opacity-60' : ''}
          group transition-all hover:shadow-lg overflow-hidden border border-white/10`}
        style={{
          left: `${left}px`,
          width: `${Math.max(width, 40)}px`
        }}
        onMouseDown={(e) => handleClipMouseDown(e, clip)}
      >
        {isLocked && (
          <div className="absolute top-1 left-1 bg-yellow-500/20 backdrop-blur-sm rounded px-1 py-0.5">
            <Lock size={10} className="text-yellow-400" />
          </div>
        )}

        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 transition-colors z-10 bg-white/0"
          onMouseDown={(e) => handleResizeStart(e, clip, 'start')}
        />

        <div className="flex flex-col h-full justify-center px-2.5 text-white relative">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon size={14} className="flex-shrink-0" />
            <span className="text-xs font-semibold truncate flex-1">
              {clipName}
            </span>
            {clip.hasAudio && <Volume2 size={12} className="text-white/80 flex-shrink-0" />}
          </div>
          <div className="text-[10px] text-white/70 font-mono">
            {formatTime(clip.duration)}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20" />

        {!isLocked && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateClip(clip.id);
              }}
              className="p-1.5 bg-black/70 hover:bg-black/90 rounded transition-colors backdrop-blur-sm"
              title="Duplicar"
            >
              <Copy size={11} className="text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteClip(clip.id);
                updateTimelineDuration();
              }}
              className="p-1.5 bg-red-600/90 hover:bg-red-600 rounded transition-colors backdrop-blur-sm"
              title="Excluir"
            >
              <Trash2 size={11} className="text-white" />
            </button>
          </div>
        )}

        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 transition-colors z-10 bg-white/0"
          onMouseDown={(e) => handleResizeStart(e, clip, 'end')}
        />
      </div>
    );
  };

  const tracksWithClips = timeline.tracks.filter(track => track.clips.length > 0);
  const hasNoTracks = tracksWithClips.length === 0;

  return (
    <div className="h-full w-full flex flex-col bg-surfaceDark text-textPrimary">
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* Track Labels - Fixed Left Column */}
        {!hasNoTracks && (
          <div className="flex-shrink-0 w-40 bg-surfaceDark border-r border-borderSubtle">
            <div className="h-10 border-b border-borderSubtle bg-surfaceMuted flex items-center justify-end px-2 gap-1">
              <Lock size={12} className="text-textTertiary" />
              <Eye size={12} className="text-textTertiary" />
            </div>
            {tracksWithClips.map((track, index) => (
              <div
                key={`label-${track.id}`}
                draggable
                onDragStart={(e) => handleTrackDragStart(e, track.id)}
                onDragOver={(e) => handleTrackDragOver(e, track.id)}
                onDragEnd={handleTrackDragEnd}
                onDragLeave={handleTrackDragLeave}
                className={`h-20 border-b border-borderSubtle/50 flex items-center gap-2 px-2 group cursor-move transition-colors ${
                  dragOverTrackId === track.id ? 'bg-primary/10 border-primary' : ''
                } ${draggedTrackId === track.id ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-xs text-textSecondary font-medium truncate">
                    {track.name || `Layer ${index + 1}`}
                  </span>
                  <div className="flex items-center gap-1">
                    {track.clips.some(c => c.type === 'video') && <Video size={10} className="text-textTertiary" />}
                    {track.clips.some(c => c.type === 'audio') && <Music size={10} className="text-textTertiary" />}
                    {track.clips.some(c => c.type === 'text') && <Type size={10} className="text-textTertiary" />}
                    {track.clips.some(c => c.type === 'image') && <Image size={10} className="text-textTertiary" />}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrackLock(track.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      track.locked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-surfaceMuted hover:bg-surfaceMuted/70 text-textTertiary'
                    }`}
                    title={track.locked ? 'Desbloquear' : 'Bloquear'}
                  >
                    {track.locked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrackVisibility(track.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      !track.visible ? 'bg-red-500/20 text-red-400' : 'bg-surfaceMuted hover:bg-surfaceMuted/70 text-textTertiary'
                    }`}
                    title={track.visible ? 'Ocultar' : 'Mostrar'}
                  >
                    {track.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline Area - Scrollable */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative w-full"
          onClick={handleTimelineClick}
        >
          <div style={{ width: `${Math.max(timeline.duration * pixelsPerSecond, containerWidth)}px`, minHeight: '100%' }}>
            {/* Time Ruler */}
            <div className="relative h-10 border-b border-borderSubtle bg-gradient-to-b from-surfaceMuted to-surfaceDark">
              {Array.from({ length: Math.ceil(Math.max(timeline.duration, containerWidth / pixelsPerSecond)) + 1 }).map((_, i) => (
                <div key={i}>
                  <div
                    className="absolute top-6 h-4 w-px bg-borderSubtle/40"
                    style={{ left: `${i * pixelsPerSecond}px` }}
                  />
                  <span
                    className="absolute top-1.5 text-[11px] text-textSecondary font-mono font-medium"
                    style={{ left: `${i * pixelsPerSecond + 4}px` }}
                  >
                    {formatTime(i)}
                  </span>
                  {[0.25, 0.5, 0.75].map((fraction) => (
                    <div
                      key={`${i}-${fraction}`}
                      className="absolute top-7 h-3 w-px bg-borderSubtle/20"
                      style={{ left: `${(i + fraction) * pixelsPerSecond}px` }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Tracks */}
            {hasNoTracks ? (
              <div
                className="relative h-48 border-b border-borderSubtle/50 bg-surfaceDark/50"
                onDrop={(e) => handleDrop(e, 'video')}
                onDragOver={handleDragOver}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-textSecondary/50">
                    Arraste mídia aqui para começar
                  </span>
                </div>
              </div>
            ) : (
              <div>
                {tracksWithClips.map((track) => (
                  <div
                    key={track.id}
                    data-track-id={track.id}
                    className={`relative h-20 border-b border-borderSubtle/50 bg-surfaceDark/50 transition-colors ${
                      hoveredTrackId === track.id ? 'bg-blue-500/10 ring-2 ring-blue-500/50 ring-inset' : ''
                    }`}
                    onDrop={(e) => handleDrop(e, track.type)}
                    onDragOver={handleDragOver}
                  >
                    {track.clips.map(clip => {
                      const isBeingDragged = clip.id === draggedClip;
                      const isDraggingToAnotherTrack = isBeingDragged && hoveredTrackId && hoveredTrackId !== track.id;

                      if (isDraggingToAnotherTrack) {
                        return (
                          <div key={clip.id} style={{ opacity: 0.3, pointerEvents: 'none' }}>
                            {renderClip(clip, track.type, track)}
                          </div>
                        );
                      }

                      return renderClip(clip, track.type, track);
                    })}
                  </div>
                ))}

                {/* New Layer Drop Zone */}
                {draggedClip && (
                  <div
                    data-track-id="new-layer"
                    className={`relative h-20 border-b border-borderSubtle/50 border-dashed transition-colors ${
                      hoveredTrackId === 'new-layer' ? 'bg-blue-500/20 ring-2 ring-blue-500/50 ring-inset' : 'bg-surfaceDark/30'
                    }`}
                    onDragOver={handleDragOver}
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-xs text-textSecondary/70">
                        {hoveredTrackId === 'new-layer' ? 'Solte para criar nova camada' : 'Arraste aqui para nova camada'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Playhead - Single */}
            <div
              className="absolute top-0 w-px bg-red-500 z-50 pointer-events-none"
              style={{
                left: `${currentTime * pixelsPerSecond}px`,
                height: hasNoTracks ? '200px' : `${10 + (tracksWithClips.length * 80) + (draggedClip ? 80 : 0)}px`
              }}
            >
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-lg cursor-ew-resize pointer-events-auto"
                onMouseDown={handlePlayheadMouseDown}
              />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-1 bg-red-500 text-white text-xs font-mono whitespace-nowrap rounded shadow-lg">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
