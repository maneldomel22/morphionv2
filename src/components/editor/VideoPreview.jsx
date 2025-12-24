import { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Play, Pause, SkipBack } from 'lucide-react';

export default function VideoPreview() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const videoRefsMap = useRef(new Map());
  const videoReadyMap = useRef(new Map());
  const [activeClips, setActiveClips] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedClipId, setDraggedClipId] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [initialScale, setInitialScale] = useState({ x: 1, y: 1 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });

  const {
    timeline,
    currentTime,
    isPlaying,
    selectedClipId,
    setCurrentTime,
    setIsPlaying,
    togglePlayPause,
    updateClip,
    setSelectedClipId
  } = useEditorStore();

  useEffect(() => {
    const newActiveClips = [];

    for (let trackIndex = 0; trackIndex < timeline.tracks.length; trackIndex++) {
      const track = timeline.tracks[trackIndex];

      if (track.visible === false) continue;

      for (const clip of track.clips) {
        if (clip.type !== 'video' && clip.type !== 'image') continue;

        const clipEnd = clip.startTime + clip.duration;
        if (currentTime >= clip.startTime && currentTime < clipEnd) {
          newActiveClips.push({ ...clip, layerIndex: trackIndex });
        }
      }
    }

    setActiveClips(newActiveClips);
  }, [currentTime, timeline.tracks]);

  useEffect(() => {
    activeClips.forEach(clip => {
      if (clip.type !== 'video') return;

      const video = videoRefsMap.current.get(clip.id);
      if (!video) return;

      const clipTime = currentTime - clip.startTime;
      const trimStart = clip.properties?.trim?.start || 0;
      const videoTime = Math.max(0, trimStart + clipTime);

      const videoSource = clip.properties?.src || clip.sourceUrl;

      const needsLoad = !video.src || !video.src.includes(videoSource);

      if (needsLoad) {
        videoReadyMap.current.set(clip.id, false);
        video.src = videoSource;

        const handleLoadedData = () => {
          videoReadyMap.current.set(clip.id, true);
          video.currentTime = videoTime;

          if (isPlaying) {
            video.play().catch(err => console.error('Error playing video:', clip.id, err));
          }
        };

        const handleError = (e) => {
          console.error('Error loading video:', clip.id, e);
          videoReadyMap.current.set(clip.id, false);
        };

        video.addEventListener('loadeddata', handleLoadedData, { once: true });
        video.addEventListener('error', handleError, { once: true });
        video.load();
      } else {
        const isReady = videoReadyMap.current.get(clip.id);

        if (isReady && video.readyState >= 2) {
          if (Math.abs(video.currentTime - videoTime) > 0.15) {
            try {
              video.currentTime = videoTime;
            } catch (err) {
              console.error('Error setting currentTime:', err);
            }
          }

          if (isPlaying && video.paused) {
            video.play().catch(err => {
              console.error('Error playing video:', clip.id, err);
            });
          } else if (!isPlaying && !video.paused) {
            video.pause();
          }
        }
      }

      video.muted = !(clip.hasAudio === true);
    });

    videoRefsMap.current.forEach((video, clipId) => {
      const isActive = activeClips.some(clip => clip.id === clipId);
      if (!isActive && !video.paused) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentTime, activeClips, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = timeline.width;
      canvas.height = timeline.height;
      renderCanvas(currentTime);
    }
  }, [timeline.width, timeline.height]);

  useEffect(() => {
    if (!isPlaying) {
      renderCanvas(currentTime);
    }
  }, [timeline, currentTime, isPlaying, selectedClipId]);

  useEffect(() => {
    if (!isPlaying) {
      renderCanvas(currentTime);
      return;
    }

    const startTime = performance.now();
    const initialTime = currentTime;

    const animate = (timestamp) => {
      const elapsed = (timestamp - startTime) / 1000;
      const newTime = initialTime + elapsed;

      if (timeline.duration > 0 && newTime >= timeline.duration) {
        setCurrentTime(timeline.duration);
        setIsPlaying(false);
        return;
      }

      setCurrentTime(newTime);
      renderCanvas(newTime);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, timeline.duration]);

  useEffect(() => {
    return () => {
      videoRefsMap.current.forEach((video) => {
        video.pause();
        video.src = '';
        video.load();
      });
      videoRefsMap.current.clear();
      videoReadyMap.current.clear();
    };
  }, []);

  const renderCanvas = (time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeClips = [];

    for (let trackIndex = 0; trackIndex < timeline.tracks.length; trackIndex++) {
      const track = timeline.tracks[trackIndex];

      if (track.visible === false) continue;

      for (const clip of track.clips) {
        const clipEnd = clip.startTime + clip.duration;
        if (time >= clip.startTime && time < clipEnd) {
          activeClips.push({ ...clip, layerIndex: trackIndex });
        }
      }
    }

    activeClips
      .sort((a, b) => (timeline.tracks.length - b.layerIndex) - (timeline.tracks.length - a.layerIndex))
      .forEach(clip => {
        const progress = (time - clip.startTime) / clip.duration;

        if (clip.type === 'text') {
          renderText(ctx, clip, progress);
        } else if (clip.type === 'image') {
          renderImage(ctx, clip, progress);
        }
      });
  };

  const renderText = (ctx, clip, progress) => {
    const props = clip.properties || {};

    ctx.save();

    let fontSize = props.size || 64;
    let fontWeight = props.bold ? 'bold' : 'normal';
    let fontStyle = props.italic ? 'italic' : 'normal';
    let fontFamily = props.font || 'Inter';

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = props.color || '#ffffff';
    ctx.textAlign = props.align || 'center';
    ctx.textBaseline = props.verticalAlign || 'middle';

    let alpha = 1;
    if (props.animation === 'fade-in') {
      alpha = Math.min(progress * 2, 1);
    } else if (props.animation === 'fade-out') {
      alpha = Math.max(1 - progress * 2, 0);
    }
    ctx.globalAlpha = alpha;

    let x = props.x !== undefined ? props.x : timeline.width / 2;
    let y = props.y !== undefined ? props.y : timeline.height / 2;

    if (props.animation === 'slide-up') {
      y = props.y + (1 - progress) * 100;
    } else if (props.animation === 'slide-down') {
      y = props.y - (1 - progress) * 100;
    } else if (props.animation === 'slide-left') {
      x = props.x + (1 - progress) * 100;
    } else if (props.animation === 'slide-right') {
      x = props.x - (1 - progress) * 100;
    }

    if (props.shadow) {
      ctx.shadowColor = props.shadow.color || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = props.shadow.blur || 10;
      ctx.shadowOffsetX = props.shadow.offsetX || 0;
      ctx.shadowOffsetY = props.shadow.offsetY || 4;
    }

    const text = props.text || clip.name || 'Texto';
    const metrics = ctx.measureText(text);

    if (props.backgroundColor) {
      const padding = props.padding || 10;
      ctx.fillStyle = props.backgroundColor;
      ctx.fillRect(
        x - metrics.width / 2 - padding,
        y - fontSize / 2 - padding,
        metrics.width + padding * 2,
        fontSize + padding * 2
      );
      ctx.fillStyle = props.color || '#ffffff';
    }

    ctx.fillText(text, x, y);

    if (selectedClipId === clip.id) {
      ctx.globalAlpha = 1;
      const padding = 10;
      const boxX = x - metrics.width / 2 - padding;
      const boxY = y - fontSize / 2 - padding;
      const boxWidth = metrics.width + padding * 2;
      const boxHeight = fontSize + padding * 2;

      // Borda principal
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      // Handles nos cantos (círculos)
      const handleSize = 8;
      ctx.fillStyle = '#3b82f6';

      // Cantos
      const corners = [
        { x: boxX, y: boxY }, // NW
        { x: boxX + boxWidth, y: boxY }, // NE
        { x: boxX + boxWidth, y: boxY + boxHeight }, // SE
        { x: boxX, y: boxY + boxHeight }, // SW
      ];

      corners.forEach(corner => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, handleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Handles nas bordas (quadrados)
      ctx.fillStyle = '#3b82f6';
      const edges = [
        { x: boxX + boxWidth / 2, y: boxY }, // N
        { x: boxX + boxWidth, y: boxY + boxHeight / 2 }, // E
        { x: boxX + boxWidth / 2, y: boxY + boxHeight }, // S
        { x: boxX, y: boxY + boxHeight / 2 }, // W
      ];

      edges.forEach(edge => {
        ctx.fillRect(edge.x - handleSize / 2, edge.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(edge.x - handleSize / 2, edge.y - handleSize / 2, handleSize, handleSize);
      });
    }

    ctx.restore();
  };

  const renderImage = (ctx, clip, progress) => {
    const props = clip.properties || {};
    ctx.save();
    ctx.restore();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * timeline.fps);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = timeline.width / rect.width;
    const scaleY = timeline.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
  };

  const getClipBounds = (clip) => {
    const props = clip.properties || {};
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return null;

    const fontSize = props.size || 64;
    const fontWeight = props.bold ? 'bold' : 'normal';
    const fontStyle = props.italic ? 'italic' : 'normal';
    const fontFamily = props.font || 'Inter';

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    const text = props.text || clip.name || 'Texto';
    const metrics = ctx.measureText(text);

    const clipX = props.x !== undefined ? props.x : timeline.width / 2;
    const clipY = props.y !== undefined ? props.y : timeline.height / 2;

    const textWidth = metrics.width;
    const textHeight = fontSize;
    const padding = 10;

    return {
      x: clipX - textWidth / 2 - padding,
      y: clipY - textHeight / 2 - padding,
      width: textWidth + padding * 2,
      height: textHeight + padding * 2,
      centerX: clipX,
      centerY: clipY
    };
  };

  const getHandleAtPosition = (clip, x, y) => {
    const bounds = getClipBounds(clip);
    if (!bounds) return null;

    const handleSize = 8;
    const hitArea = 12;

    // Cantos
    const corners = [
      { handle: 'nw', x: bounds.x, y: bounds.y },
      { handle: 'ne', x: bounds.x + bounds.width, y: bounds.y },
      { handle: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { handle: 'sw', x: bounds.x, y: bounds.y + bounds.height },
    ];

    for (const corner of corners) {
      const dx = x - corner.x;
      const dy = y - corner.y;
      if (Math.sqrt(dx * dx + dy * dy) <= hitArea) {
        return corner.handle;
      }
    }

    // Bordas
    const edges = [
      { handle: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
      { handle: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { handle: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { handle: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 },
    ];

    for (const edge of edges) {
      if (Math.abs(x - edge.x) <= hitArea && Math.abs(y - edge.y) <= hitArea) {
        return edge.handle;
      }
    }

    return null;
  };

  const getClipAtPosition = (x, y) => {
    const allClips = [];

    for (const track of timeline.tracks) {
      for (const clip of track.clips) {
        const clipEnd = clip.startTime + clip.duration;
        if (currentTime >= clip.startTime && currentTime < clipEnd) {
          if (clip.type === 'text' || clip.type === 'image') {
            allClips.push(clip);
          }
        }
      }
    }

    for (let i = allClips.length - 1; i >= 0; i--) {
      const clip = allClips[i];
      const bounds = getClipBounds(clip);
      if (!bounds) continue;

      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        return clip;
      }
    }

    return null;
  };

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCanvasCoordinates(e);
    const clip = getClipAtPosition(x, y);

    if (clip) {
      setSelectedClipId(clip.id);
      setIsPlaying(false);

      // Verificar se clicou em um handle
      if (selectedClipId === clip.id) {
        const handle = getHandleAtPosition(clip, x, y);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setDraggedClipId(clip.id);
          setDragStart({ x, y });

          const props = clip.properties || {};
          setInitialScale({
            x: props.scaleX || 1,
            y: props.scaleY || 1
          });
          setInitialSize({
            width: getClipBounds(clip)?.width || 0,
            height: getClipBounds(clip)?.height || 0
          });
          return;
        }
      }

      // Se não clicou em handle, começa o drag
      setIsDragging(true);
      setDraggedClipId(clip.id);
      setDragStart({ x, y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if ((!isDragging && !isResizing) || !draggedClipId) return;

    const { x, y } = getCanvasCoordinates(e);

    let clip = null;
    for (const track of timeline.tracks) {
      clip = track.clips.find(c => c.id === draggedClipId);
      if (clip) break;
    }

    if (!clip) return;

    const props = clip.properties || {};

    if (isResizing && resizeHandle) {
      // Lógica de resize
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      const currentSize = props.size || 64;
      let newSize = currentSize;

      // Para texto, ajustar o tamanho da fonte baseado no handle
      switch (resizeHandle) {
        case 'se':
        case 'ne':
        case 'sw':
        case 'nw':
          // Cantos: redimensionar proporcionalmente
          const avgDelta = (deltaX + deltaY) / 2;
          newSize = Math.max(12, currentSize + avgDelta * 0.5);
          break;
        case 'e':
        case 'w':
          // Bordas horizontais
          newSize = Math.max(12, currentSize + deltaX * 0.5);
          break;
        case 'n':
        case 's':
          // Bordas verticais
          newSize = Math.max(12, currentSize + deltaY * 0.5);
          break;
      }

      updateClip(draggedClipId, {
        properties: {
          ...props,
          size: newSize
        }
      });

      setDragStart({ x, y });
    } else if (isDragging) {
      // Lógica de drag (mover)
      const currentX = props.x !== undefined ? props.x : timeline.width / 2;
      const currentY = props.y !== undefined ? props.y : timeline.height / 2;

      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      updateClip(draggedClipId, {
        properties: {
          ...props,
          x: currentX + deltaX,
          y: currentY + deltaY
        }
      });

      setDragStart({ x, y });
    }

    renderCanvas(currentTime);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDraggedClipId(null);
  };

  const updateCursor = (e) => {
    if (isDragging || isResizing) return;

    const { x, y } = getCanvasCoordinates(e);
    const clip = getClipAtPosition(x, y);

    if (clip && selectedClipId === clip.id) {
      const handle = getHandleAtPosition(clip, x, y);
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (handle) {
        const cursorMap = {
          'nw': 'nw-resize',
          'n': 'n-resize',
          'ne': 'ne-resize',
          'e': 'e-resize',
          'se': 'se-resize',
          's': 's-resize',
          'sw': 'sw-resize',
          'w': 'w-resize'
        };
        canvas.style.cursor = cursorMap[handle] || 'default';
      } else {
        canvas.style.cursor = 'move';
      }
    } else if (clip) {
      canvasRef.current.style.cursor = 'pointer';
    } else {
      canvasRef.current.style.cursor = 'default';
    }
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isDragging, isResizing, draggedClipId, dragStart, resizeHandle]);

  const getPreviewDimensions = () => {
    const ratio = timeline.width / timeline.height;

    if (ratio > 1) {
      return { width: '100%', height: 'auto', maxHeight: '100%' };
    } else if (ratio < 1) {
      return { width: 'auto', height: '100%', maxWidth: '100%' };
    } else {
      return { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' };
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surfaceDark">
      <div className="flex-1 flex items-center justify-center p-3 overflow-hidden bg-surfaceDark w-full">
        <div
          ref={containerRef}
          className="relative bg-black overflow-hidden"
          style={{
            aspectRatio: `${timeline.width} / ${timeline.height}`,
            ...getPreviewDimensions()
          }}
        >
          {activeClips.map((clip) => {
            if (clip.type !== 'video') return null;

            const props = clip.properties || {};
            const x = props.x !== undefined ? props.x : timeline.width / 2;
            const y = props.y !== undefined ? props.y : timeline.height / 2;
            const scale = props.scale !== undefined ? props.scale : 1;
            const rotation = props.rotation !== undefined ? props.rotation : 0;

            const isDefaultPosition = props.x === 0 && props.y === 0;
            const layerZIndex = timeline.tracks.length - (clip.layerIndex || 0);

            return (
              <video
                key={clip.id}
                ref={(el) => {
                  if (el) {
                    videoRefsMap.current.set(clip.id, el);
                  } else {
                    videoRefsMap.current.delete(clip.id);
                  }
                }}
                className="absolute object-contain bg-black"
                style={
                  isDefaultPosition
                    ? {
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: layerZIndex
                      }
                    : {
                        left: `${(x / timeline.width) * 100}%`,
                        top: `${(y / timeline.height) * 100}%`,
                        width: `${scale * 100}%`,
                        height: `${scale * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        zIndex: layerZIndex
                      }
                }
                playsInline
                preload="auto"
                crossOrigin="anonymous"
              />
            );
          })}

          <canvas
            ref={canvasRef}
            width={timeline.width}
            height={timeline.height}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1000 }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={updateCursor}
          />
        </div>
      </div>

      <div className="border-t border-borderSubtle p-4 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-full bg-surfaceMuted hover:bg-surfaceMuted/70 flex items-center justify-center transition-colors"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-brandPrimary hover:bg-brandPrimary/90 flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
          </button>

          <div className="text-textSecondary font-mono text-sm">
            {formatTime(currentTime)} / {formatTime(timeline.duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
