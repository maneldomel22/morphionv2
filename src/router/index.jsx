import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Login from '../pages/Login';
import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import Metrics from '../pages/Metrics';
import SoraManual from '../pages/SoraManual';
import Influencer from '../pages/Influencer';
import SceneEditor from '../pages/SceneEditor';
import ImageGeneration from '../pages/ImageGeneration';
import VoiceClone from '../pages/VoiceClone';
import LipSync from '../pages/LipSync';
import Transcription from '../pages/Transcription';
import Library from '../pages/Library';
import SharedFolder from '../pages/SharedFolder';
import Morphy from '../pages/Morphy';
import Plans from '../pages/Plans';
import Profile from '../pages/Profile';

const isDev = import.meta.env.DEV;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/auth',
    element: <Auth />
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'metrics', element: isDev ? <Metrics /> : <Navigate to="/dashboard" replace /> },
      { path: 'sora', element: <SoraManual /> },
      { path: 'influencer', element: <Influencer /> },
      { path: 'scene-editor', element: isDev ? <SceneEditor /> : <Navigate to="/dashboard" replace /> },
      { path: 'images', element: <ImageGeneration /> },
      { path: 'voice-clone', element: <VoiceClone /> },
      { path: 'lipsync', element: <LipSync /> },
      { path: 'transcription', element: <Transcription /> },
      { path: 'library', element: <Library /> },
      { path: 'folders/:folderId', element: <SharedFolder /> },
      { path: 'morphy', element: <Morphy /> },
      { path: 'plans', element: <Plans /> },
      { path: 'profile', element: <Profile /> }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);
