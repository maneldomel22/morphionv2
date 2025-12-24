import { create } from 'zustand';

const createDefaultTimeline = () => ({
  width: 1080,
  height: 1920,
  fps: 30,
  duration: 0,
  tracks: [
    { id: 'layer-1', name: 'Layer 1', type: 'video', clips: [], locked: false, visible: true },
    { id: 'layer-2', name: 'Layer 2', type: 'video', clips: [], locked: false, visible: true }
  ]
});

export const useEditorStore = create((set, get) => ({
  timeline: createDefaultTimeline(),
  currentTime: 0,
  isPlaying: false,
  selectedClipId: null,
  zoom: 1,
  project: null,
  renderJob: null,

  setTimeline: (timeline) => set({ timeline }),

  setCurrentTime: (time) => {
    const state = get();
    const maxTime = Math.max(state.timeline.duration, 60);
    set({ currentTime: Math.max(0, time) });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setSelectedClipId: (id) => set({ selectedClipId: id }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 5)) }),

  setProject: (project) => set({ project }),

  setRenderJob: (renderJob) => set({ renderJob }),

  getOrCreateTrack: (trackType) => {
    const state = get();
    let track = state.timeline.tracks.find(t => t.type === trackType);

    if (!track) {
      track = {
        id: `${trackType}-track-${Date.now()}`,
        type: trackType,
        clips: []
      };

      set({
        timeline: {
          ...state.timeline,
          tracks: [...state.timeline.tracks, track]
        }
      });
    }

    return track.id;
  },

  addClip: (clip) => set((state) => {
    let targetTrackId = clip.trackId;

    if (!targetTrackId) {
      const firstTrackWithClips = state.timeline.tracks.find(t => t.clips.length > 0);
      targetTrackId = firstTrackWithClips ? firstTrackWithClips.id : state.timeline.tracks[0]?.id;
    }

    const track = state.timeline.tracks.find(t => t.id === targetTrackId);

    if (!track) {
      const layerNumber = state.timeline.tracks.length + 1;
      const newTrack = {
        id: `layer-${layerNumber}`,
        name: `Layer ${layerNumber}`,
        type: clip.type || 'video',
        clips: [clip],
        locked: false,
        visible: true
      };

      return {
        timeline: {
          ...state.timeline,
          tracks: [...state.timeline.tracks, newTrack]
        }
      };
    }

    return {
      timeline: {
        ...state.timeline,
        tracks: state.timeline.tracks.map(t =>
          t.id === targetTrackId
            ? { ...t, clips: [...t.clips, clip] }
            : t
        )
      }
    };
  }),

  updateClip: (clipId, updates) => set((state) => ({
    timeline: {
      ...state.timeline,
      tracks: state.timeline.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        )
      }))
    }
  })),

  deleteClip: (clipId) => set((state) => ({
    timeline: {
      ...state.timeline,
      tracks: state.timeline.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => clip.id !== clipId)
      }))
    },
    selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
  })),

  moveClip: (clipId, startTime, duration) => set((state) => ({
    timeline: {
      ...state.timeline,
      tracks: state.timeline.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, startTime, duration }
            : clip
        )
      }))
    }
  })),

  moveClipToTrack: (clipId, targetTrackId, startTime) => set((state) => {
    let clipToMove = null;
    let sourceTrackId = null;

    for (const track of state.timeline.tracks) {
      const clip = track.clips.find(c => c.id === clipId);
      if (clip) {
        clipToMove = { ...clip };
        sourceTrackId = track.id;
        break;
      }
    }

    if (!clipToMove || !sourceTrackId) return state;

    const targetTrack = state.timeline.tracks.find(t => t.id === targetTrackId);
    if (!targetTrack) return state;

    clipToMove.startTime = startTime;
    clipToMove.trackId = targetTrackId;

    return {
      timeline: {
        ...state.timeline,
        tracks: state.timeline.tracks.map(track => {
          if (track.id === sourceTrackId) {
            return {
              ...track,
              clips: track.clips.filter(c => c.id !== clipId)
            };
          }
          if (track.id === targetTrackId) {
            return {
              ...track,
              clips: [...track.clips, clipToMove]
            };
          }
          return track;
        })
      }
    };
  }),

  duplicateClip: (clipId) => set((state) => {
    let targetTrack = null;
    let targetClip = null;

    for (const track of state.timeline.tracks) {
      const clip = track.clips.find(c => c.id === clipId);
      if (clip) {
        targetTrack = track;
        targetClip = clip;
        break;
      }
    }

    if (!targetClip || !targetTrack) return state;

    const newClip = {
      ...targetClip,
      id: `clip-${Date.now()}-${Math.random()}`,
      startTime: targetClip.startTime + targetClip.duration
    };

    return {
      timeline: {
        ...state.timeline,
        tracks: state.timeline.tracks.map(t =>
          t.id === targetTrack.id
            ? { ...t, clips: [...t.clips, newClip] }
            : t
        )
      }
    };
  }),

  clearTimeline: () => set({
    timeline: createDefaultTimeline(),
    currentTime: 0,
    isPlaying: false,
    selectedClipId: null,
    project: null,
    renderJob: null
  }),

  loadProject: (project) => set({
    project,
    timeline: project.timeline_data || createDefaultTimeline(),
    currentTime: 0,
    isPlaying: false,
    selectedClipId: null
  }),

  updateTimelineDuration: () => set((state) => {
    let maxEnd = 0;

    state.timeline.tracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipEnd = clip.startTime + clip.duration;
        if (clipEnd > maxEnd) {
          maxEnd = clipEnd;
        }
      });
    });

    return {
      timeline: {
        ...state.timeline,
        duration: Math.max(maxEnd, 1)
      },
      currentTime: Math.min(state.currentTime, maxEnd)
    };
  }),

  setSelectedTrackId: (id) => set({ selectedClipId: id }),

  addTrack: (track) => {
    const clip = {
      id: track.id,
      type: track.type,
      startTime: track.start || 0,
      duration: (track.end || 5) - (track.start || 0),
      sourceUrl: track.properties?.src || '',
      hasAudio: Boolean(track.hasAudio !== undefined ? track.hasAudio : track.properties?.hasAudio),
      properties: track.properties || {}
    };

    get().addClip(clip);
    get().updateTimelineDuration();
  },

  updateTrack: (trackId, updates) => {
    get().updateClip(trackId, updates);
  },

  deleteTrack: (trackId) => {
    get().deleteClip(trackId);
    get().updateTimelineDuration();
  },

  moveTrack: (trackId, start, end) => {
    get().moveClip(trackId, start, end - start);
    get().updateTimelineDuration();
  },

  duplicateTrack: (trackId) => {
    get().duplicateClip(trackId);
    get().updateTimelineDuration();
  },

  updateTrackProperties: (trackId, properties) => {
    const state = get();
    state.timeline.tracks.forEach(track => {
      const clip = track.clips.find(c => c.id === trackId);
      if (clip) {
        get().updateClip(trackId, {
          properties: { ...clip.properties, ...properties }
        });
      }
    });
  },

  moveTrackUp: (trackId) => set((state) => {
    const tracks = [...state.timeline.tracks];
    const index = tracks.findIndex(t => t.id === trackId);

    if (index > 0) {
      [tracks[index], tracks[index - 1]] = [tracks[index - 1], tracks[index]];
      return {
        timeline: {
          ...state.timeline,
          tracks
        }
      };
    }

    return state;
  }),

  moveTrackDown: (trackId) => set((state) => {
    const tracks = [...state.timeline.tracks];
    const index = tracks.findIndex(t => t.id === trackId);

    if (index < tracks.length - 1) {
      [tracks[index], tracks[index + 1]] = [tracks[index + 1], tracks[index]];
      return {
        timeline: {
          ...state.timeline,
          tracks
        }
      };
    }

    return state;
  }),

  reorderTracks: (draggedTrackId, targetTrackId) => set((state) => {
    const tracks = [...state.timeline.tracks];
    const draggedIndex = tracks.findIndex(t => t.id === draggedTrackId);
    const targetIndex = tracks.findIndex(t => t.id === targetTrackId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      return state;
    }

    const [draggedTrack] = tracks.splice(draggedIndex, 1);
    tracks.splice(targetIndex, 0, draggedTrack);

    return {
      timeline: {
        ...state.timeline,
        tracks
      }
    };
  }),

  createNewTrack: () => {
    const state = get();
    const layerNumber = state.timeline.tracks.length + 1;
    const newTrack = {
      id: `layer-${Date.now()}-${Math.random()}`,
      name: `Layer ${layerNumber}`,
      type: 'video',
      clips: [],
      locked: false,
      visible: true
    };

    set({
      timeline: {
        ...state.timeline,
        tracks: [...state.timeline.tracks, newTrack]
      }
    });

    return newTrack.id;
  },

  toggleTrackLock: (trackId) => set((state) => ({
    timeline: {
      ...state.timeline,
      tracks: state.timeline.tracks.map(t =>
        t.id === trackId ? { ...t, locked: !t.locked } : t
      )
    }
  })),

  toggleTrackVisibility: (trackId) => set((state) => ({
    timeline: {
      ...state.timeline,
      tracks: state.timeline.tracks.map(t =>
        t.id === trackId ? { ...t, visible: !t.visible } : t
      )
    }
  }))
}));
