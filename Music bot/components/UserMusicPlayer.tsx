import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Volume2, Upload, SkipForward, SkipBack, Trash2, Plus, List, ArrowLeft, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { supabase, getAuthHeaders } from '../utils/supabase/client';

interface Track {
  id: string;
  name: string;
  url: string;
  fileName?: string;
  uploadedAt?: string;
  size?: number;
  type?: string;
  userId?: string;
}

interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  userId?: string;
  createdDate: string;
}

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  email: string;
  avatar?: string;
  trackCount: number;
  createdAt: string;
}

interface UserMusicPlayerProps {
  user: any;
  profile: UserProfile;
  viewingProfile?: UserProfile | null;
  onBack: () => void;
  onViewProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

export function UserMusicPlayer({ 
  user, 
  profile, 
  viewingProfile, 
  onBack, 
  onViewProfile,
  onLogout 
}: UserMusicPlayerProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(50);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: profile.name, bio: profile.bio });
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProfile = viewingProfile || profile;
  const isOwnProfile = !viewingProfile || viewingProfile.id === user.id;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

  useEffect(() => {
    loadTracks();
    if (isOwnProfile) {
      loadPlaylists();
    }
  }, [currentProfile.id, isOwnProfile]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
      const nextTrack = tracks[currentIndex + 1];
      if (nextTrack) {
        playTrack(nextTrack);
      }
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, tracks]);

  const loadTracks = async () => {
    try {
      setIsLoading(true);
      const endpoint = isOwnProfile 
        ? `${baseUrl}/make-server-0daa964a/my-tracks`
        : `${baseUrl}/make-server-0daa964a/tracks/${currentProfile.id}`;
      
      const headers = isOwnProfile ? await getAuthHeaders() : {
        'Authorization': `Bearer ${publicAnonKey}`,
      };

      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to load tracks:', errorData);
        throw new Error(errorData.error || 'Ошибка загрузки треков');
      }

      const data = await response.json();
      setTracks(data.tracks || []);
      
    } catch (error: any) {
      console.error('Error loading tracks:', error);
      toast.error(error.message || 'Ошибка при загрузке треков');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const headers = isOwnProfile ? await getAuthHeaders() : {
        'Authorization': `Bearer ${publicAnonKey}`,
      };
      const response = await fetch(`${baseUrl}/make-server-0daa964a/playlists/${user.id}`, {
        headers,
      });

      if (!response.ok) return;

      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;

    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    let successCount = 0;
    
    try {
      const headers = await getAuthHeaders();
      
      for (const file of Array.from(files)) {
        if (file.type.startsWith('audio/')) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

            const response = await fetch(`${baseUrl}/make-server-0daa964a/upload-track`, {
              method: 'POST',
              headers,
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Ошибка загрузки ${file.name}`);
            }

            const data = await response.json();
            if (data.success) {
              setTracks(prev => [...prev, data.track]);
              successCount++;
              toast.success(`Трек "${data.track.name}" загружен`);
            }
          } catch (error: any) {
            console.error(`Error uploading ${file.name}:`, error);
            toast.error(`Ошибка загрузки ${file.name}: ${error.message}`);
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Успешно загружено ${successCount} треков`);
      }
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteTrack = async (trackId: string) => {
    if (!isOwnProfile) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${baseUrl}/make-server-0daa964a/track/${trackId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка удаления трека');
      }

      setTracks(prev => prev.filter(t => t.id !== trackId));
      
      if (currentTrack?.id === trackId) {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
      
      toast.success('Трек удален');
    } catch (error: any) {
      console.error('Error deleting track:', error);
      toast.error(error.message || 'Ошибка при удалении трека');
    }
  };

  const updateProfile = async () => {
    if (!isOwnProfile) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${baseUrl}/make-server-0daa964a/profile`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка обновления профиля');
      }

      toast.success('Профиль обновлен');
      setIsEditingProfile(false);
      // Здесь нужно обновить профиль в родительском компоненте
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Ошибка при обновлении профиля');
    }
  };

  const createPlaylist = async () => {
    if (!isOwnProfile || !playlistName.trim() || selectedTracks.length === 0) {
      toast.error('Введите название и выберите треки');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${baseUrl}/make-server-0daa964a/playlists`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          trackIds: selectedTracks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания плейлиста');
      }

      const data = await response.json();
      if (data.success) {
        setPlaylists(prev => [...prev, data.playlist]);
        setPlaylistName('');
        setSelectedTracks([]);
        setIsDialogOpen(false);
        toast.success(`Плейлист "${data.playlist.name}" создан`);
      }
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      toast.error(error.message || 'Ошибка при создании плейлиста');
    }
  };

  const playPlaylist = (playlist: Playlist) => {
    const playlistTracks = tracks.filter(track => playlist.trackIds.includes(track.id));
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0]);
      toast.success(`Воспроизводится плейлист "${playlist.name}"`);
    } else {
      toast.error('В плейлисте нет доступных треков');
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Error playing audio:', err);
        toast.error('Ошибка воспроизведения');
        setIsPlaying(false);
      });
    }
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Error playing track:', err);
          toast.error('Ошибка воспроизведения трека');
          setIsPlaying(false);
        });
      }
    }, 100);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && !isNaN(value[0]) && isFinite(value[0])) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const initials = currentProfile.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onLoadedMetadata={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          toast.error('Ошибка загрузки аудио');
          setIsPlaying(false);
        }}
      />

      {/* Заголовок профиля */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {viewingProfile ? 'К галерее' : 'Назад'}
          </Button>

          <div className="flex items-center space-x-2">
            {isOwnProfile && (
              <Button
                onClick={() => setIsEditingProfile(true)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Edit className="w-4 h-4 mr-2" />
                Редактировать
              </Button>
            )}
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Выйти
            </Button>
          </div>
        </div>

        {/* Профиль пользователя */}
        <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20 ring-2 ring-purple-500/30">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl text-white/90 mb-2">
                  {currentProfile.name}
                  {!isOwnProfile && (
                    <span className="text-lg text-white/60 ml-2">
                      • {currentProfile.trackCount} треков
                    </span>
                  )}
                </h1>
                {currentProfile.bio && (
                  <p className="text-white/70">{currentProfile.bio}</p>
                )}
                <p className="text-sm text-white/50 mt-2">
                  Участник с {new Date(currentProfile.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Панель управления для своего профиля */}
        {isOwnProfile && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25 border-0"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isLoading ? 'Загрузка...' : 'Загрузить треки'}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={tracks.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Создать плейлист
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Создать плейлист</DialogTitle>
                  <DialogDescription>
                    Создайте новый плейлист, выбрав треки из вашей коллекции
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Название плейлиста"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    <p className="text-sm text-white/70">Выберите треки:</p>
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center space-x-2 p-2 rounded bg-white/5 hover:bg-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTracks.includes(track.id)}
                          onChange={() => toggleTrackSelection(track.id)}
                          className="rounded"
                        />
                        <span className="flex-1">{track.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={createPlaylist} className="w-full">
                    Создать плейлист
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => setShowPlaylists(!showPlaylists)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <List className="w-4 h-4 mr-2" />
              Плейлисты {playlists.length > 0 && `(${playlists.length})`}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </motion.div>

      {/* Диалог редактирования профиля */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="bg-black/90 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
            <DialogDescription>
              Обновите информацию о себе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Имя</label>
              <Input
                value={editProfile.name}
                onChange={(e) => setEditProfile(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">О себе</label>
              <Textarea
                value={editProfile.bio}
                onChange={(e) => setEditProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 resize-none"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={updateProfile} className="flex-1">
                Сохранить
              </Button>
              <Button 
                onClick={() => setIsEditingProfile(false)} 
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Плейлисты */}
      {showPlaylists && playlists.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-black/20 backdrop-blur-xl border-white/10 p-4 shadow-2xl shadow-purple-500/10">
            <h3 className="mb-4 text-lg text-white/90">Ваши плейлисты</h3>
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <motion.div
                  key={playlist.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => playPlaylist(playlist)}
                  className="p-3 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">{playlist.name}</span>
                    <span className="text-sm text-white/60">
                      {playlist.trackIds.length} треков
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Основной плеер */}
      {currentTrack && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Card className="bg-black/20 backdrop-blur-xl border-white/10 p-6 shadow-2xl shadow-purple-500/10">
            <div className="space-y-4">
              <h3 className="text-xl text-center text-white/90">{currentTrack.name}</h3>
              
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-400 [&_[role=slider]]:to-blue-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-purple-400/50"
                />
                <div className="flex justify-between text-sm text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
                    const prevTrack = tracks[currentIndex - 1];
                    if (prevTrack) playTrack(prevTrack);
                  }}
                  disabled={tracks.findIndex(t => t.id === currentTrack.id) === 0}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={togglePlay}
                    size="lg"
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25 border-0"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </Button>
                </motion.div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
                    const nextTrack = tracks[currentIndex + 1];
                    if (nextTrack) playTrack(nextTrack);
                  }}
                  disabled={tracks.findIndex(t => t.id === currentTrack.id) === tracks.length - 1}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <Volume2 className="w-4 h-4 text-white/60" />
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setVolume(value[0])}
                  className="flex-1 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-emerald-400 [&_[role=slider]]:to-blue-400"
                />
                <span className="text-sm text-white/60 w-8">{volume}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Список треков */}
      {tracks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-black/20 backdrop-blur-xl border-white/10 p-4 shadow-2xl shadow-purple-500/10">
            <h3 className="mb-4 text-lg text-white/90">
              {isOwnProfile ? 'Ваши треки' : `Треки ${currentProfile.name}`} ({tracks.length})
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tracks.map((track) => (
                <motion.div
                  key={track.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg transition-all ${
                    currentTrack?.id === track.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => playTrack(track)}
                    >
                      <span className="text-white/90">{track.name}</span>
                      {track.uploadedAt && (
                        <p className="text-xs text-white/50 mt-1">
                          Загружен: {new Date(track.uploadedAt).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {currentTrack?.id === track.id && isPlaying && (
                        <motion.div
                          className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                      )}
                      
                      {isOwnProfile && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrack(track.id);
                          }}
                          variant="ghost"
                          size="icon"
                          className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 w-8 h-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <p className="text-white/60 mb-4">
            {isOwnProfile 
              ? 'У вас еще нет загруженных треков. Поделитесь своей музыкой с миром!'
              : `У ${currentProfile.name} пока нет публичных треков.`
            }
          </p>
          {isOwnProfile && (
            <p className="text-white/40 text-sm">
              Поддерживаются форматы: MP3, WAV, OGG, M4A и другие аудиоформаты
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}