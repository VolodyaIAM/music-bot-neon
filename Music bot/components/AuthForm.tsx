import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, Mail, Lock, UserPlus, AlertCircle, Wifi, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ServerStatus } from './ServerStatus';

interface AuthFormProps {
  onLogin: (user: any, profile: any) => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    bio: ''
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

  // Тестовая функция для проверки сервера
  const testServerConnection = async () => {
    setIsTestingConnection(true);
    try {
      console.log('=== TESTING SERVER CONNECTION ===');
      console.log('Project ID:', projectId);
      console.log('Base URL:', baseUrl);
      console.log('Testing URL:', `${baseUrl}/make-server-0daa964a/health`);
      
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/make-server-0daa964a/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`Health check response time: ${responseTime}ms`);
      console.log('Health check response status:', response.status);
      console.log('Health check response statusText:', response.statusText);
      console.log('Health check response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health check response:', data);
        toast.success(
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Сервер работает корректно! ✅</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Время ответа: {responseTime}ms • Endpoints: {data.endpoints?.length || 0}
            </div>
          </div>
        );
      } else {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ Health check error response:', errorData);
        } catch {
          const errorText = await response.text();
          console.error('❌ Health check error text:', errorText);
          errorData = { error: errorText };
        }
        
        toast.error(
          <div>
            <div>Ошибка сервера: {response.status} {response.statusText}</div>
            <div className="text-xs text-gray-400 mt-1">
              {errorData.error || errorData.message || 'Неизвестная ошибка'}
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('❌ Server test network error:', error);
      toast.error(
        <div>
          <div>Ошибка подключения к серверу</div>
          <div className="text-xs text-gray-400 mt-1">
            {error.message || 'Сеть недоступна'}
          </div>
        </div>
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const validateSignupData = () => {
    const errors: {[key: string]: string} = {};

    if (!signupData.name.trim()) {
      errors.name = 'Имя обязательно для заполнения';
    } else if (signupData.name.trim().length < 2) {
      errors.name = 'Имя должно содержать минимум 2 символа';
    }

    if (!signupData.email.trim()) {
      errors.email = 'Email обязателен для заполнения';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signupData.email)) {
        errors.email = 'Введите корректный email адрес';
      }
    }

    if (!signupData.password) {
      errors.password = 'Пароль обязателен для заполнения';
    } else if (signupData.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    }

    return errors;
  };

  const validateLoginData = () => {
    const errors: {[key: string]: string} = {};

    if (!loginData.email.trim()) {
      errors.email = 'Email обязателен для заполнения';
    }

    if (!loginData.password) {
      errors.password = 'Пароль обязателен для заполнения';
    }

    return errors;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const errors = validateSignupData();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('=== FRONTEND SIGNUP PROCESS START ===');
      
      const requestBody = {
        name: signupData.name.trim(),
        email: signupData.email.trim().toLowerCase(),
        password: signupData.password,
        bio: signupData.bio.trim()
      };

      console.log('Making POST request to:', `${baseUrl}/make-server-0daa964a/signup`);
      
      // Регистрируем пользователя через наш API
      const response = await fetch(`${baseUrl}/make-server-0daa964a/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      let data;
      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (responseText) {
          data = JSON.parse(responseText);
        } else {
          throw new Error('Пустой ответ от сервера');
        }
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        throw new Error('Некорректный ответ от сервера');
      }

      if (!response.ok) {
        console.error('Server error:', response.status, data);
        throw new Error(data.error || `Ошибка сервера: ${response.status}`);
      }

      if (!data.success) {
        console.error('Signup not successful:', data);
        throw new Error(data.error || 'Регистрация не была завершена');
      }

      console.log('✅ SIGNUP SUCCESSFUL, attempting auto-login...');
      
      // Автоматически входим в систему
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: signupData.email.trim().toLowerCase(),
        password: signupData.password,
      });

      if (signInError) {
        console.error('Auto-login error:', signInError);
        throw new Error(`Регистрация прошла успешно, но не удалось войти в систему: ${signInError.message}`);
      }

      toast.success('Регистрация успешна! Добро пожаловать!');
      onLogin(authData.user, data.profile);
      
      // Очищаем форму
      setSignupData({ name: '', email: '', password: '', bio: '' });
      setValidationErrors({});
      
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Ошибка регистрации. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const errors = validateLoginData();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);
    try {
      console.log('=== STARTING LOGIN PROCESS ===');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email.trim().toLowerCase(),
        password: loginData.password,
      });

      if (error) {
        console.error('Login error:', error);
        
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Неверный email или пароль');
        }
        
        throw new Error(error.message);
      }

      console.log('LOGIN SUCCESSFUL, fetching profile...');

      // Получаем профиль пользователя
      console.log('Fetching user profile for:', data.user.id);
      const profileResponse = await fetch(`${baseUrl}/make-server-0daa964a/profile/${data.user.id}`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Accept': 'application/json',
        }
      });
      
      console.log('Profile response status:', profileResponse.status);
      
      if (!profileResponse.ok) {
        let errorData;
        try {
          errorData = await profileResponse.json();
          console.error('Profile fetch error response:', errorData);
        } catch (parseError) {
          const errorText = await profileResponse.text();
          console.error('Profile fetch error text:', errorText);
          throw new Error(`Ошибка сервера ${profileResponse.status}: ${errorText}`);
        }
        throw new Error(errorData.error || 'Профиль пользователя не найден.');
      }
      
      const profileData = await profileResponse.json();
      console.log('Profile data received:', profileData);

      toast.success('Добро пожаловать!');
      onLogin(data.user, profileData.profile);
      
      // Очищаем форму
      setLoginData({ email: '', password: '' });
      setValidationErrors({});
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Ошибка входа. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Статус сервера */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ServerStatus baseUrl={baseUrl} />
        </motion.div>

        {/* Форма авторизации */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Неоновая Музыка
              </CardTitle>
              <CardDescription className="text-white/60">
                Присоединяйтесь к музыкальному сообществу
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Быстрая тестовая кнопка */}
              <div className="mb-4">
                <Button
                  onClick={testServerConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  {isTestingConnection ? 'Проверка...' : 'Быстрая проверка'}
                </Button>
              </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="login" className="text-white data-[state=active]:bg-white/20">
                  Вход
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">
                  Регистрация
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white/90">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => {
                        setLoginData(prev => ({ ...prev, email: e.target.value }));
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({ ...prev, email: '' }));
                        }
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${
                        validationErrors.email ? 'border-red-400' : ''
                      }`}
                    />
                    {validationErrors.email && (
                      <div className="flex items-center space-x-1 text-red-400 text-sm">
                        <AlertCircle className="w-3 h-3" />
                        <span>{validationErrors.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white/90">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Пароль
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Введите пароль"
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData(prev => ({ ...prev, password: e.target.value }));
                        if (validationErrors.password) {
                          setValidationErrors(prev => ({ ...prev, password: '' }));
                        }
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${
                        validationErrors.password ? 'border-red-400' : ''
                      }`}
                    />
                    {validationErrors.password && (
                      <div className="flex items-center space-x-1 text-red-400 text-sm">
                        <AlertCircle className="w-3 h-3" />
                        <span>{validationErrors.password}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
                  >
                    {isLoading ? 'Вход...' : 'Войти'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white/90">
                      <User className="w-4 h-4 inline mr-2" />
                      Имя *
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Ваше имя"
                      value={signupData.name}
                      onChange={(e) => {
                        setSignupData(prev => ({ ...prev, name: e.target.value }));
                        if (validationErrors.name) {
                          setValidationErrors(prev => ({ ...prev, name: '' }));
                        }
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${
                        validationErrors.name ? 'border-red-400' : ''
                      }`}
                    />
                    {validationErrors.name && (
                      <div className="flex items-center space-x-1 text-red-400 text-sm">
                        <AlertCircle className="w-3 h-3" />
                        <span>{validationErrors.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white/90">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email *
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupData.email}
                      onChange={(e) => {
                        setSignupData(prev => ({ ...prev, email: e.target.value }));
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({ ...prev, email: '' }));
                        }
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${
                        validationErrors.email ? 'border-red-400' : ''
                      }`}
                    />
                    {validationErrors.email && (
                      <div className="flex items-center space-x-1 text-red-400 text-sm">
                        <AlertCircle className="w-3 h-3" />
                        <span>{validationErrors.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white/90">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Пароль *
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Минимум 6 символов"
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData(prev => ({ ...prev, password: e.target.value }));
                        if (validationErrors.password) {
                          setValidationErrors(prev => ({ ...prev, password: '' }));
                        }
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 ${
                        validationErrors.password ? 'border-red-400' : ''
                      }`}
                    />
                    {validationErrors.password && (
                      <div className="flex items-center space-x-1 text-red-400 text-sm">
                        <AlertCircle className="w-3 h-3" />
                        <span>{validationErrors.password}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-bio" className="text-white/90">
                      О себе (необязательно)
                    </Label>
                    <Textarea
                      id="signup-bio"
                      placeholder="Расскажите о себе и своей музыке..."
                      value={signupData.bio}
                      onChange={(e) => setSignupData(prev => ({ ...prev, bio: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white border-0"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}