export type TrackType = 'video' | 'text' | 'image' | 'audio';

export type RenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface VideoProperties {
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  rotation?: number;
  opacity?: number;
  trim?: {
    start: number;
    end: number;
  };
}

export interface TextProperties {
  text: string;
  font: string;
  size: number;
  color: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  animation?: 'none' | 'fade-in' | 'fade-out' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  shadow?: {
    blur: number;
    color: string;
    offsetX: number;
    offsetY: number;
  };
}

export interface ImageProperties {
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  rotation?: number;
  opacity?: number;
  animation?: 'none' | 'fade-in' | 'fade-out' | 'zoom-in' | 'zoom-out';
}

export interface AudioProperties {
  src: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  trim?: {
    start: number;
    end: number;
  };
}

export type TrackProperties = VideoProperties | TextProperties | ImageProperties | AudioProperties;

export interface Track {
  id: string;
  type: TrackType;
  start: number;
  end: number;
  layer: number;
  properties: TrackProperties;
  locked?: boolean;
  muted?: boolean;
  visible?: boolean;
}

export interface Timeline {
  width: number;
  height: number;
  fps: number;
  duration: number;
  tracks: Track[];
}

export interface TimelineProject {
  id: string;
  user_id: string;
  title: string;
  timeline_data: Timeline;
  thumbnail_url?: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  created_at: string;
  updated_at: string;
}

export interface RenderJob {
  id: string;
  project_id: string;
  user_id: string;
  status: RenderJobStatus;
  progress: number;
  output_url?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface EditorState {
  timeline: Timeline;
  currentTime: number;
  isPlaying: boolean;
  selectedTrackId: string | null;
  zoom: number;
  project: TimelineProject | null;
}
