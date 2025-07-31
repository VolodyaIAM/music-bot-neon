import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Music, Calendar, Play } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  email: string;
  avatar?: string;
  trackCount: number;
  createdAt: string;
}

interface UserCardProps {
  profile: UserProfile;
  onClick: () => void;
  showFullProfile?: boolean;
}

export function UserCard({ profile, onClick, showFullProfile = false }: UserCardProps) {
  const initials = profile.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Date(profile.createdAt).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {/* Аватар */}
            <Avatar className="w-16 h-16 ring-2 ring-purple-500/30">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Информация о пользователе */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl text-white/90 mb-1 truncate">
                {profile.name}
              </h3>
              
              {profile.bio && (
                <p className="text-white/60 text-sm mb-3 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm text-white/50 mb-4">
                <div className="flex items-center space-x-1">
                  <Music className="w-4 h-4" />
                  <span>{profile.trackCount} треков</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>С {joinDate}</span>
                </div>
              </div>

              {/* Кнопка просмотра профиля */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
              >
                <Play className="w-4 h-4 mr-2" />
                {profile.trackCount > 0 ? 'Слушать музыку' : 'Посмотреть профиль'}
              </Button>
            </div>
          </div>

          {/* Дополнительная информация для полного профиля */}
          {showFullProfile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl text-white/90">{profile.trackCount}</div>
                  <div className="text-sm text-white/60">Треков</div>
                </div>
                <div>
                  <div className="text-2xl text-purple-400">★</div>
                  <div className="text-sm text-white/60">Рейтинг</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Неоновое свечение при наведении */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-emerald-500/0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
        </CardContent>
      </Card>
    </motion.div>
  );
}