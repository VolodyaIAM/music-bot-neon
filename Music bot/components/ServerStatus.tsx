import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Server, Clock } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ServerStatusProps {
  baseUrl: string;
}

interface ServerResponse {
  status: string;
  timestamp: string;
  environment: {
    supabaseConfigured: boolean;
    serviceKeyConfigured: boolean;
  };
  message: string;
  server: string;
  endpoints: string[];
}

export function ServerStatus({ baseUrl }: ServerStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [serverData, setServerData] = useState<ServerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const checkServer = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('=== DETAILED SERVER STATUS CHECK ===');
      console.log('Base URL:', baseUrl);
      console.log('Project ID:', projectId);
      console.log('Anon Key present:', !!publicAnonKey);
      console.log('Testing endpoint:', `${baseUrl}/make-server-0daa964a/health`);
      
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/make-server-0daa964a/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        // Добавляем timeout для совместимости
        ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout 
          ? { signal: AbortSignal.timeout(15000) } 
          : {})
      });
      
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`Response received in ${responseTimeMs}ms`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      setResponseTime(responseTimeMs);
      setLastCheck(new Date());
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json() as ServerResponse;
      console.log('✅ Server response:', data);
      
      setServerData(data);
      setError(null);
      
    } catch (err: any) {
      console.error('❌ Server check failed:', err);
      
      let errorMessage = err.message;
      
      if (err.name === 'AbortError') {
        errorMessage = 'Таймаут запроса (15 секунд)';
      } else if (err.message?.includes('Failed to fetch')) {
        errorMessage = 'Сетевая ошибка - сервер недоступен';
      } else if (err.message?.includes('NetworkError')) {
        errorMessage = 'Ошибка сети - проверьте подключение';
      }
      
      setError(errorMessage);
      setServerData(null);
      setLastCheck(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Автоматическая проверка при загрузке
  useEffect(() => {
    checkServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-500';
    if (error) return 'bg-red-500';
    if (serverData?.status === 'ok') return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (isLoading) return 'Проверка...';
    if (error) return 'Ошибка';
    if (serverData?.status === 'ok') return 'Работает';
    return 'Неизвестно';
  };

  return (
    <Card className="bg-black/20 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>Статус сервера</span>
          </CardTitle>
          <Button 
            onClick={checkServer} 
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Основной статус */}
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-white font-medium">{getStatusText()}</span>
          {responseTime && (
            <Badge variant="outline" className="text-xs">
              {responseTime}ms
            </Badge>
          )}
        </div>

        {/* Информация о последней проверке */}
        {lastCheck && (
          <div className="flex items-center space-x-2 text-sm text-white/60">
            <Clock className="w-4 h-4" />
            <span>Последняя проверка: {lastCheck.toLocaleTimeString()}</span>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-red-400 font-medium text-sm">Ошибка подключения</div>
                <div className="text-red-300 text-xs mt-1">{error}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Успешный ответ */}
        {serverData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-green-400 font-medium text-sm">Сервер доступен</div>
                  <div className="text-green-300 text-xs mt-1">{serverData.message}</div>
                </div>
              </div>
            </div>

            {/* Детали сервера */}
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-white/60">Сервер:</div>
                <div className="text-white">{serverData.server}</div>
                
                <div className="text-white/60">Supabase:</div>
                <div className="text-white">
                  {serverData.environment.supabaseConfigured ? '✅ Настроен' : '❌ Не настроен'}
                </div>
                
                <div className="text-white/60">Service Key:</div>
                <div className="text-white">
                  {serverData.environment.serviceKeyConfigured ? '✅ Настроен' : '❌ Не настроен'}
                </div>
                
                <div className="text-white/60">Endpoints:</div>
                <div className="text-white">{serverData.endpoints?.length || 0} шт.</div>
              </div>
            </div>

            {/* Список endpoints */}
            {serverData.endpoints && serverData.endpoints.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-white/60">Доступные endpoints:</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {serverData.endpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="text-xs text-white/70 bg-white/5 px-2 py-1 rounded font-mono"
                    >
                      {endpoint}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Конфигурация */}
        <div className="pt-2 border-t border-white/10">
          <div className="text-xs text-white/50 space-y-1">
            <div>Project ID: {projectId}</div>
            <div>URL: {baseUrl}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}