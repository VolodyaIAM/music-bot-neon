import React, { useState, useEffect } from 'react';
import { AnimatedBackground } from './components/AnimatedBackground.tsx';
import { AuthForm } from './components/AuthForm.tsx';
import { UserGallery } from './components/UserGallery.tsx';
import { UserMusicPlayer } from './components/UserMusicPlayer.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import { supabase } from './utils/supabase/client.tsx';
import { projectId } from './utils/supabase/info.tsx';

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  email: string;
  avatar?: string;
  trackCount: number;
  createdAt: string;
}

type AppState = 'auth' | 'gallery' | 'player';

export default function App() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем существующую сессию при загрузке
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('Found existing session for user:', session.user.id);
        
        // Пользователь уже авторизован, загружаем его профиль
        try {
          const baseUrl = `https://${projectId}.supabase.co/functions/v1`;
          const response = await fetch(`${baseUrl}/make-server-0daa964a/profile/${session.user.id}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Profile loaded successfully');
            setUser(session.user);
            setProfile(data.profile);
            setAppState('gallery');
          } else {
            console.log('Profile not found, signing out user');
            // Профиль не найден, возможно пользователь был удален
            await supabase.auth.signOut();
          }
        } catch (profileError) {
          console.error('Error loading profile:', profileError);
          // В случае ошибки сети, остаемся на странице авторизации
          await supabase.auth.signOut();
        }
      } else {
        console.log('No existing session found');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: any, userProfile: UserProfile) => {
    console.log('User logged in:', userData.id);
    setUser(userData);
    setProfile(userProfile);
    setAppState('gallery');
    setViewingProfile(null);
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out user...');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setViewingProfile(null);
      setAppState('auth');
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSelectUser = (selectedProfile: UserProfile) => {
    console.log('Viewing profile:', selectedProfile.id);
    setViewingProfile(selectedProfile);
    setAppState('player');
  };

  const handleBackToGallery = () => {
    console.log('Returning to gallery');
    setViewingProfile(null);
    setAppState('gallery');
  };

  const handleViewOwnProfile = () => {
    console.log('Viewing own profile');
    setViewingProfile(null);
    setAppState('player');
  };

  // Показываем загрузку пока проверяем сессию
  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <div className="text-white/70 mb-4">
            <div className="inline-flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
          <p className="text-white/60">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen">
        {appState === 'auth' && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <AuthForm onLogin={handleLogin} />
          </div>
        )}

        {appState === 'gallery' && user && profile && (
          <div className="min-h-screen p-4">
            {/* Верхняя панель навигации */}
            <div className="max-w-6xl mx-auto mb-6">
              <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl border-white/10 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white">
                    {profile.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-white/90">Добро пожаловать, {profile.name}!</h2>
                    <p className="text-white/60 text-sm">
                      {profile.trackCount > 0 
                        ? `У вас ${profile.trackCount} треков` 
                        : 'Загрузите ваши первые треки'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleViewOwnProfile}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/90 text-sm transition-colors"
                  >
                    Мой профиль
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/90 text-sm transition-colors"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            </div>

            <UserGallery 
              onSelectUser={handleSelectUser}
              currentUserId={user.id}
            />
          </div>
        )}

        {appState === 'player' && user && profile && (
          <UserMusicPlayer
            user={user}
            profile={profile}
            viewingProfile={viewingProfile}
            onBack={handleBackToGallery}
            onViewProfile={handleSelectUser}
            onLogout={handleLogout}
          />
        )}
      </div>

      <Toaster 
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </div>
  );
}