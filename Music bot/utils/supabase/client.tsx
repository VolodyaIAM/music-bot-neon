import { createClient } from '@supabase/supabase-js@2';
import { projectId, publicAnonKey } from './info';

console.log('Creating Supabase client with:');
console.log('Project ID:', projectId);
console.log('Public key configured:', !!publicAnonKey);

if (!projectId || !publicAnonKey) {
  console.error('Missing Supabase configuration!');
  console.error('Project ID:', projectId);
  console.error('Public key:', publicAnonKey ? '[CONFIGURED]' : '[MISSING]');
  throw new Error('Supabase configuration is incomplete');
}

// Создаем единый экземпляр Supabase клиента
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Вспомогательная функция для получения заголовков авторизации
export const getAuthHeaders = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token || publicAnonKey}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    };
  }
};

// Функция для получения текущего пользователя
export const getCurrentUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Функция для проверки авторизации
export const checkAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch (error) {
    console.error('Error checking auth:', error);
    return false;
  }
};

console.log('Supabase client created successfully');