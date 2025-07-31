import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Volume2, Upload, SkipForward, SkipBack, Trash2, Plus, List } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

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

export function MusicPlayer() {
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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Уникальный ID пользователя для сессии
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

  // Загружаем треки при монтировании компонента
  useEffect(() => {
    loadTracks();
    loadPlaylists();
  }, []);

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
      // Автоматически переходим к следующему треку
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
      console.log('Loading tracks for user:', userId);
      
      const response = await fetch(`${baseUrl}/make-server-0daa964a/tracks/${userId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Loaded tracks:', data.tracks);
      setTracks(data.tracks || []);
      
      if (data.tracks && data.tracks.length > 0) {
        toast.success(`Загружено ${data.tracks.length} треков`);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      toast.error('Ошибка при загрузке треков. Проверьте подключение.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      console.log('Loading playlists for user:', userId);
      
      const response = await fetch(`${baseUrl}/make-server-0daa964a/playlists/${userId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Failed to load playlists: HTTP ${response.status}: ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Loaded playlists:', data.playlists);
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Error loading playlists:', error);
      // Не показываем ошибку для плейлистов, так как это не критично
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('audio/')) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
            formData.append('userId', userId);

            console.log('Uploading file:', file.name);

            const response = await fetch(`${baseUrl}/make-server-0daa964a/upload-track`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
              setTracks(prev => [...prev, data.track]);
              successCount++;
              toast.success(`Трек "${data.track.name}" загружен`);
            }
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            errorCount++;
            toast.error(`Ошибка загрузки ${file.name}`);
          }
        } else {
          toast.error(`Файл "${file.name}" не является аудиофайлом`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Успешно загружено ${successCount} треков`);
      }
      if (errorCount > 0) {
        toast.error(`Ошибки при загрузке ${errorCount} файлов`);
      }
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteTrack = async (trackId: string) => {
    try {
      console.log('Deleting track:', trackId);
      
      const response = await fetch(`${baseUrl}/make-server-0daa964a/track/${userId}/${trackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setTracks(prev => prev.filter(t => t.id !== trackId));
      
      if (currentTrack?.id === trackId) {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
      
      toast.success('Трек удален');
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Ошибка при удалении трека');
    }
  };

  const createPlaylist = async () => {
    if (!playlistName.trim() || selectedTracks.length === 0) {
      toast.error('Введите название и выберите треки');
      return;
    }

    try {
      console.log('Creating playlist:', playlistName);
      
      const response = await fetch(`${baseUrl}/make-server-0daa964a/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          trackIds: selectedTracks,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPlaylists(prev => [...prev, data.playlist]);
        setPlaylistName('');
        setSelectedTracks([]);
        setIsDialogOpen(false);
        toast.success(`Плейлист "${data.playlist.name}" создан`);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Ошибка при создании плейлиста');
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
    console.log('Playing track:', track.name);
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

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} МБ`;
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

  const skipToNext = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    const nextTrack = tracks[currentIndex + 1];
    if (nextTrack) {
      playTrack(nextTrack);
    }
  };

  const skipToPrevious = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    const prevTrack = tracks[currentIndex - 1];
    if (prevTrack) {
      playTrack(prevTrack);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Невидимый аудио элемент */}
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

      {/* Заголовок и элементы управления */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Неоновый Плеер
        </h1>
        
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
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </motion.div>

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
              {/* Название трека */}
              <h3 className="text-xl text-center text-white/90">{currentTrack.name}</h3>
              
              {/* Прогресс бар */}
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
              
              {/* Элементы управления */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={skipToPrevious}
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
                  onClick={skipToNext}
                  disabled={tracks.findIndex(t => t.id === currentTrack.id) === tracks.length - 1}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Громкость */}
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
      {tracks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-black/20 backdrop-blur-xl border-white/10 p-4 shadow-2xl shadow-purple-500/10">
            <h3 className="mb-4 text-lg text-white/90">
              Ваши треки ({tracks.length})
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
                      {(track.uploadedAt || track.size) && (
                        <p className="text-xs text-white/50 mt-1">
                          {track.uploadedAt && `Загружен: ${new Date(track.uploadedAt).toLocaleDateString('ru-RU')}`}
                          {track.size && ` • ${formatFileSize(track.size)}`}
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
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Сообщение когда нет треков */}
      {tracks.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <p className="text-white/60 mb-4">
            Добро пожаловать! Загрузите ваши первые треки, чтобы начать слушать музыку.
          </p>
          <p className="text-white/40 text-sm">
            Поддерживаются форматы: MP3, WAV, OGG, M4A и другие аудиоформаты
          </p>
        </motion.div>
      )}

      {/* Индикатор загрузки */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center space-x-2 text-white/70">
            <motion.div
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
            />
            <span className="ml-2">Загрузка...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}