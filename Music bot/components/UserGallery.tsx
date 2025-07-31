import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserCard } from './UserCard';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  email: string;
  avatar?: string;
  trackCount: number;
  createdAt: string;
}

interface UserGalleryProps {
  onSelectUser: (profile: UserProfile) => void;
  currentUserId?: string;
}

export function UserGallery({ onSelectUser, currentUserId }: UserGalleryProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Фильтруем пользователей по поисковому запросу
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Loading users from:', `${baseUrl}/make-server-0daa964a/users`);
      
      const response = await fetch(`${baseUrl}/make-server-0daa964a/users`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json',
        },
      });

      console.log('Users response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('Failed to load users - server response:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          throw new Error(`Сервер вернул ошибку ${response.status}: ${errorText}`);
        }
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      console.log('Users data received:', data);
      
      if (!data.users || !Array.isArray(data.users)) {
        console.error('Invalid users data format:', data);
        throw new Error('Неверный формат данных от сервера');
      }
      
      // Исключаем текущего пользователя из списка
      const otherUsers = data.users.filter((user: UserProfile) => {
        if (!user || !user.id) {
          console.warn('Skipping invalid user:', user);
          return false;
        }
        return user.id !== currentUserId;
      });
      
      console.log(`Loaded ${otherUsers.length} other users (excluding current user)`);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
      
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error(error.message || 'Не удалось загрузить список пользователей');
      // Устанавливаем пустой массив при ошибке
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-white/60">Загрузка музыкантов...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Заголовок и поиск */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div>
          <h1 className="text-4xl mb-2 bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Музыкальное Сообщество
          </h1>
          <p className="text-white/60">
            Откройте для себя удивительных музыкантов и их творчество
          </p>
        </div>

        {/* Поиск */}
        <Card className="bg-black/20 backdrop-blur-xl border-white/10 p-4 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              placeholder="Поиск музыкантов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </Card>

        {/* Статистика */}
        <div className="flex items-center justify-center space-x-6 text-sm text-white/60">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{filteredUsers.length} музыкантов</span>
          </div>
          <div className="w-1 h-1 bg-white/30 rounded-full" />
          <div>
            <span>{filteredUsers.reduce((total, user) => total + user.trackCount, 0)} треков</span>
          </div>
        </div>
      </motion.div>

      {/* Кнопка обновления */}
      <div className="text-center">
        <Button
          onClick={loadUsers}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Обновить список
        </Button>
      </div>

      {/* Сетка пользователей */}
      {filteredUsers.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <UserCard
                profile={user}
                onClick={() => onSelectUser(user)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="space-y-4">
            <div className="text-white/40 text-6xl">🎵</div>
            <h3 className="text-xl text-white/70">
              {searchQuery ? 'Музыканты не найдены' : 'Пока нет зарегистрированных музыкантов'}
            </h3>
            <p className="text-white/50">
              {searchQuery 
                ? 'Попробуйте изменить поисковый запрос'
                : 'Будьте первым, кто поделится своей музыкой!'
              }
            </p>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Очистить поиск
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}