// Простой скрипт для отладки авторизации
// Можно запустить в консоли браузера для проверки

async function testAuth() {
  console.log('=== DEBUGGING AUTHENTICATION ===');
  
  const projectId = 'YOUR_PROJECT_ID'; // Замените на реальный ID
  const publicAnonKey = 'YOUR_ANON_KEY'; // Замените на реальный ключ
  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;
  
  try {
    console.log('Testing health endpoint...');
    const response = await fetch(`${baseUrl}/make-server-0daa964a/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS:', data);
    } else {
      const errorData = await response.json();
      console.log('❌ ERROR:', errorData);
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error);
  }
}

// testAuth();