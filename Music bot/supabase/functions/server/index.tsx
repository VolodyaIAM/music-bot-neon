import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

// Настройка CORS в первую очередь
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}))

// Логирование запросов
app.use('*', logger(console.log))

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

console.log('=== SERVER INITIALIZATION ===')
console.log('Server starting...')
console.log('Supabase URL configured:', !!supabaseUrl)
console.log('Service key configured:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('=== CRITICAL ERROR: MISSING ENVIRONMENT VARIABLES ===')
  console.error('SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Обработка OPTIONS запросов
app.options('*', (c) => {
  console.log('=== OPTIONS REQUEST ===')
  console.log('Path:', c.req.path)
  console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()))
  return c.text('OK')
})

// Вспомогательная функция для проверки Authorization header (но не требует его для публичных endpoints)
const checkAuthHeader = (request: Request) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.log('❌ Missing authorization header')
    return { error: 'Missing authorization header', status: 401 }
  }
  return { success: true }
}

// ТЕСТОВЫЙ endpoint для проверки сервера (ПУБЛИЧНЫЙ, но требует Authorization)
app.get('/make-server-0daa964a/health', (c) => {
  // Проверяем Authorization header для всех запросов
  const authCheck = checkAuthHeader(c.req.raw)
  if (authCheck.error) {
    return c.json({ code: authCheck.status, message: authCheck.error }, authCheck.status)
  }
  console.log('=== HEALTH CHECK ===')
  console.log('Health check requested at:', new Date().toISOString())
  console.log('Request method:', c.req.method)
  console.log('Request path:', c.req.path)
  console.log('Request headers:', Object.fromEntries(c.req.raw.headers.entries()))
  
  const response = { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: {
      supabaseConfigured: !!supabaseUrl,
      serviceKeyConfigured: !!supabaseServiceKey
    },
    message: 'Server is running correctly',
    server: 'Hono + Deno',
    endpoints: [
      'GET /make-server-0daa964a/health (public)',
      'POST /make-server-0daa964a/signup (public)',
      'GET /make-server-0daa964a/profile/:userId (public)',
      'GET /make-server-0daa964a/users (public)',
      'GET /make-server-0daa964a/tracks/:userId (public)',
      'POST /make-server-0daa964a/upload-track (protected)',
      'GET /make-server-0daa964a/my-tracks (protected)',
      'PUT /make-server-0daa964a/profile (protected)',
      'DELETE /make-server-0daa964a/track/:trackId (protected)'
    ]
  }
  
  console.log('✅ Health check successful, returning:', response)
  return c.json(response)
})

// Создание приватного bucket при запуске сервера
const bucketName = 'make-0daa964a-audio'
const avatarBucketName = 'make-0daa964a-avatars'

const initStorage = async () => {
  try {
    console.log('=== INITIALIZING STORAGE ===')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    console.log('Existing buckets:', buckets?.map(b => b.name))
    
    // Создаем bucket для аудиофайлов
    if (!buckets?.some(bucket => bucket.name === bucketName)) {
      console.log('Creating audio bucket:', bucketName)
      const { error } = await supabase.storage.createBucket(bucketName, { public: false })
      if (error) console.error('Error creating audio bucket:', error)
      else console.log('Audio bucket created successfully')
    } else {
      console.log('Audio bucket already exists')
    }
    
    // Создаем bucket для аватаров
    if (!buckets?.some(bucket => bucket.name === avatarBucketName)) {
      console.log('Creating avatar bucket:', avatarBucketName)
      const { error } = await supabase.storage.createBucket(avatarBucketName, { public: false })
      if (error) console.error('Error creating avatar bucket:', error)
      else console.log('Avatar bucket created successfully')
    } else {
      console.log('Avatar bucket already exists')
    }
    
    console.log('=== STORAGE INITIALIZATION COMPLETE ===')
  } catch (error) {
    console.error('=== STORAGE INITIALIZATION ERROR ===')
    console.error('Error initializing storage:', error)
  }
}

// Инициализируем хранилище
initStorage()

// Вспомогательная функция для проверки авторизации (используется только для защищенных endpoints)
const requireAuth = async (request: Request) => {
  console.log('=== AUTHORIZATION CHECK ===')
  
  const authHeader = request.headers.get('Authorization')
  console.log('Authorization header present:', !!authHeader)
  
  if (!authHeader) {
    console.log('❌ No authorization header provided')
    throw new Error('No access token provided')
  }
  
  const accessToken = authHeader.split(' ')[1]
  console.log('Access token extracted:', !!accessToken)
  
  if (!accessToken) {
    console.log('❌ No access token in header')
    throw new Error('No access token provided')
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  
  if (error) {
    console.log('❌ Auth error:', error.message)
    throw new Error('Invalid or expired access token')
  }
  
  if (!user) {
    console.log('❌ No user returned from auth check')
    throw new Error('Invalid or expired access token')
  }
  
  console.log('✅ User authenticated:', user.id)
  return user
}

// ПУБЛИЧНЫЙ endpoint для регистрации пользователя
app.post('/make-server-0daa964a/signup', async (c) => {
  // Проверяем Authorization header
  const authCheck = checkAuthHeader(c.req.raw)
  if (authCheck.error) {
    return c.json({ code: authCheck.status, message: authCheck.error }, authCheck.status)
  }
  
  try {
    console.log('=== SIGNUP REQUEST RECEIVED ===')
    console.log('Request method:', c.req.method)
    console.log('Request URL:', c.req.url)
    console.log('Request headers:', Object.fromEntries(c.req.raw.headers.entries()))
    
    let body;
    try {
      body = await c.req.json()
      console.log('Request body parsed successfully:', { 
        ...body, 
        password: body.password ? '[REDACTED]' : undefined 
      })
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===')
      console.error('Error parsing request body:', parseError)
      return c.json({ error: 'Некорректный формат данных запроса' }, 400)
    }
    
    const { email, password, name, bio } = body

    // Детальная валидация входных данных
    console.log('=== VALIDATING INPUT DATA ===')
    
    if (!email || typeof email !== 'string') {
      console.log('Validation failed: Invalid email:', typeof email, email)
      return c.json({ error: 'Email is required and must be a string' }, 400)
    }

    if (!password || typeof password !== 'string') {
      console.log('Validation failed: Invalid password type:', typeof password)
      return c.json({ error: 'Password is required and must be a string' }, 400)
    }

    if (!name || typeof name !== 'string') {
      console.log('Validation failed: Invalid name:', typeof name, name)
      return c.json({ error: 'Name is required and must be a string' }, 400)
    }

    if (password.length < 6) {
      console.log('Validation failed: Password too short:', password.length)
      return c.json({ error: 'Password must be at least 6 characters long' }, 400)
    }

    // Проверяем формат email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format:', email)
      return c.json({ error: 'Invalid email format' }, 400)
    }

    console.log('✅ Input validation passed')
    console.log('=== CREATING USER WITH SUPABASE AUTH ===')

    // Создаем пользователя
    const createUserPayload = {
      email: email.trim().toLowerCase(),
      password,
      user_metadata: { 
        name: name.trim(),
        bio: bio?.trim() || ''
      },
      email_confirm: true // Автоматически подтверждаем email
    }

    console.log('Creating user with payload:', { 
      ...createUserPayload, 
      password: '[REDACTED]' 
    })

    const { data, error } = await supabase.auth.admin.createUser(createUserPayload)

    if (error) {
      console.error('=== SUPABASE AUTH ERROR ===')
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error)
      
      // Обработка специфических ошибок
      if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        return c.json({ error: 'Пользователь с таким email уже существует' }, 400)
      }
      
      if (error.message?.includes('password')) {
        return c.json({ error: 'Пароль не соответствует требованиям' }, 400)
      }
      
      if (error.message?.includes('email')) {
        return c.json({ error: 'Неверный формат email' }, 400)
      }

      return c.json({ 
        error: `Ошибка создания пользователя: ${error.message}` 
      }, 500)
    }

    if (!data?.user) {
      console.error('User creation failed: no user data returned')
      return c.json({ error: 'Не удалось создать пользователя' }, 500)
    }

    console.log('✅ USER CREATED SUCCESSFULLY')
    console.log('User ID:', data.user.id)
    console.log('User email:', data.user.email)

    // Создаем профиль пользователя
    const userProfile = {
      id: data.user.id,
      email: data.user.email,
      name: name.trim(),
      bio: bio?.trim() || '',
      avatar: null,
      createdAt: new Date().toISOString(),
      trackCount: 0,
      followerCount: 0,
      followingCount: 0
    }

    console.log('=== CREATING USER PROFILE IN KV STORE ===')

    try {
      await kv.set(`profile:${data.user.id}`, userProfile)
      console.log('✅ Profile saved to KV store')
      
      await kv.set(`user_tracks:${data.user.id}`, [])
      console.log('✅ User tracks initialized')
      
      await kv.set(`user_playlists:${data.user.id}`, [])
      console.log('✅ User playlists initialized')
      
    } catch (kvError) {
      console.error('=== KV STORE ERROR ===')
      console.error('Error creating profile in KV store:', kvError)
      // Профиль можно создать позже, не критично
    }

    console.log('=== 🎉 SIGNUP COMPLETED SUCCESSFULLY ===')

    const successResponse = { 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata
      },
      profile: userProfile
    }

    return c.json(successResponse)

  } catch (error) {
    console.error('=== ❌ UNEXPECTED SIGNUP ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    
    return c.json({ 
      error: 'Внутренняя ошибка сервера при регистрации. Попробуйте еще раз.' 
    }, 500)
  }
})

// ПУБЛИЧНЫЙ endpoint для получения профиля пользователя
app.get('/make-server-0daa964a/profile/:userId', async (c) => {
  // Проверяем Authorization header
  const authCheck = checkAuthHeader(c.req.raw)
  if (authCheck.error) {
    return c.json({ code: authCheck.status, message: authCheck.error }, authCheck.status)
  }
  
  try {
    const userId = c.req.param('userId')
    console.log('=== FETCHING PROFILE ===')
    console.log('Fetching profile for user:', userId)
    
    if (!userId || typeof userId !== 'string') {
      console.log('❌ Invalid userId parameter:', userId)
      return c.json({ error: 'Invalid user ID' }, 400)
    }
    
    const profile = await kv.get(`profile:${userId}`)
    
    if (!profile) {
      console.log('❌ Profile not found for user:', userId)
      return c.json({ error: 'Profile not found' }, 404)
    }

    // Проверяем, что профиль имеет необходимые поля
    if (!profile.id || !profile.name) {
      console.error('❌ Profile has missing required fields:', profile)
      return c.json({ error: 'Invalid profile data' }, 500)
    }

    try {
      // Получаем количество треков
      const tracks = await kv.get(`user_tracks:${userId}`) || []
      profile.trackCount = Array.isArray(tracks) ? tracks.length : 0
    } catch (trackError) {
      console.error(`Error loading tracks for user ${userId}:`, trackError)
      profile.trackCount = 0
    }

    console.log('✅ Profile fetched successfully')
    console.log('Profile data:', { id: profile.id, name: profile.name, trackCount: profile.trackCount })
    return c.json({ profile })
  } catch (error) {
    console.error('=== PROFILE FETCH ERROR ===')
    console.error('Error fetching profile:', error)
    console.error('Error stack:', error.stack)
    return c.json({ error: `Failed to fetch profile: ${error.message}` }, 500)
  }
})

// ЗАЩИЩЕННЫЙ endpoint для обновления профиля пользователя
app.put('/make-server-0daa964a/profile', async (c) => {
  try {
    console.log('=== UPDATE PROFILE REQUEST ===')
    
    const user = await requireAuth(c.req.raw)
    const { name, bio } = await c.req.json()
    const userId = user.id

    const existingProfile = await kv.get(`profile:${userId}`)
    if (!existingProfile) {
      return c.json({ error: 'Profile not found' }, 404)
    }

    const updatedProfile = {
      ...existingProfile,
      name: name || existingProfile.name,
      bio: bio !== undefined ? bio : existingProfile.bio,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`profile:${userId}`, updatedProfile)

    console.log('✅ Profile updated successfully')
    return c.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.error('=== PROFILE UPDATE ERROR ===')
    console.error('Error updating profile:', error)
    
    if (error.message?.includes('access token')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    return c.json({ error: 'Failed to update profile' }, 500)
  }
})

// ПУБЛИЧНЫЙ endpoint для получения всех пользователей
app.get('/make-server-0daa964a/users', async (c) => {
  // Проверяем Authorization header
  const authCheck = checkAuthHeader(c.req.raw)
  if (authCheck.error) {
    return c.json({ code: authCheck.status, message: authCheck.error }, authCheck.status)
  }
  
  try {
    console.log('=== FETCHING ALL USERS ===')
    
    const profiles = await kv.getByPrefix('profile:')
    const users = []

    console.log('Found profiles from KV store:', profiles.length)

    for (const item of profiles) {
      // Проверяем, что item и item.value существуют
      if (!item || !item.value) {
        console.warn('Skipping invalid profile item:', item)
        continue
      }
      
      const profile = item.value
      
      // Проверяем, что профиль имеет обязательные поля
      if (!profile.id || !profile.name) {
        console.warn('Skipping profile with missing required fields:', profile)
        continue
      }

      try {
        // Получаем количество треков для профиля
        const tracks = await kv.get(`user_tracks:${profile.id}`) || []
        profile.trackCount = Array.isArray(tracks) ? tracks.length : 0
        users.push(profile)
        
        console.log(`✅ Added profile: ${profile.name} (${profile.id}) with ${profile.trackCount} tracks`)
      } catch (trackError) {
        console.error(`Error loading tracks for user ${profile.id}:`, trackError)
        // Добавляем профиль даже если не удалось загрузить треки
        profile.trackCount = 0
        users.push(profile)
      }
    }

    // Сортируем по количеству треков
    users.sort((a, b) => (b.trackCount || 0) - (a.trackCount || 0))

    console.log('✅ Users fetched successfully, count:', users.length)
    return c.json({ users })
  } catch (error) {
    console.error('=== USERS FETCH ERROR ===')
    console.error('Error fetching users:', error)
    console.error('Error stack:', error.stack)
    return c.json({ error: `Failed to fetch users: ${error.message}` }, 500)
  }
})

// ЗАЩИЩЕННЫЙ endpoint для загрузки трека
app.post('/make-server-0daa964a/upload-track', async (c) => {
  try {
    console.log('=== UPLOAD TRACK REQUEST ===')
    
    const user = await requireAuth(c.req.raw)
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const trackName = formData.get('name') as string
    const userId = user.id
    
    if (!file || !trackName) {
      return c.json({ error: 'File and name are required' }, 400)
    }

    if (!file.type.startsWith('audio/')) {
      return c.json({ error: 'File must be an audio file' }, 400)
    }

    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}_${trackName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`
    
    // Загружаем файл в Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return c.json({ error: `Failed to upload file: ${error.message}` }, 500)
    }

    // Создаем подписанный URL
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600 * 24 * 7)

    if (urlError) {
      console.error('Error creating signed URL:', urlError)
      return c.json({ error: 'Failed to create signed URL' }, 500)
    }

    // Сохраняем метаданные трека
    const trackId = Date.now().toString() + Math.random().toString(36).substring(2)
    const trackData = {
      id: trackId,
      name: trackName,
      fileName: fileName,
      userId: userId,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      type: file.type,
      isPublic: true
    }

    await kv.set(`track:${userId}:${trackId}`, trackData)
    
    // Добавляем ID трека в список пользователя
    const userTracksKey = `user_tracks:${userId}`
    const existingTracks = await kv.get(userTracksKey) || []
    await kv.set(userTracksKey, [...existingTracks, trackId])

    console.log('✅ Track uploaded successfully')
    return c.json({
      success: true,
      track: {
        ...trackData,
        url: signedUrlData.signedUrl
      }
    })

  } catch (error) {
    console.error('=== TRACK UPLOAD ERROR ===')
    console.error('Upload error:', error)
    
    if (error.message?.includes('access token')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    return c.json({ error: `Internal server error during upload: ${error.message}` }, 500)
  }
})

// ПУБЛИЧНЫЙ endpoint для получения треков пользователя
app.get('/make-server-0daa964a/tracks/:userId', async (c) => {
  // Проверяем Authorization header
  const authCheck = checkAuthHeader(c.req.raw)
  if (authCheck.error) {
    return c.json({ code: authCheck.status, message: authCheck.error }, authCheck.status)
  }
  
  try {
    const userId = c.req.param('userId')
    console.log('=== FETCHING USER TRACKS ===')
    console.log('Fetching tracks for user:', userId)
    
    if (!userId || typeof userId !== 'string') {
      console.log('❌ Invalid userId parameter:', userId)
      return c.json({ error: 'Invalid user ID' }, 400)
    }
    
    const userTracksKey = `user_tracks:${userId}`
    const trackIds = await kv.get(userTracksKey) || []
    
    if (!Array.isArray(trackIds)) {
      console.warn('Track IDs is not an array:', typeof trackIds, trackIds)
      return c.json({ tracks: [] })
    }
    
    const tracks = []
    console.log(`Found ${trackIds.length} track IDs for user ${userId}`)

    for (const trackId of trackIds) {
      if (!trackId) {
        console.warn('Skipping empty track ID')
        continue
      }
      
      try {
        const trackData = await kv.get(`track:${userId}:${trackId}`)
        
        if (!trackData) {
          console.warn(`Track data not found for ID: ${trackId}`)
          continue
        }
        
        if (!trackData.isPublic) {
          console.log(`Skipping private track: ${trackId}`)
          continue
        }
        
        if (!trackData.fileName) {
          console.warn(`Track ${trackId} has no fileName`)
          continue
        }

        // Создаем новый подписанный URL
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(trackData.fileName, 3600 * 24)

        if (urlError) {
          console.error(`Error creating signed URL for track ${trackId}:`, urlError)
          continue
        }

        if (signedUrlData && signedUrlData.signedUrl) {
          tracks.push({
            ...trackData,
            url: signedUrlData.signedUrl
          })
          console.log(`✅ Added track: ${trackData.name || trackId}`)
        }
      } catch (trackError) {
        console.error(`Error processing track ${trackId}:`, trackError)
        continue
      }
    }

    console.log('✅ User tracks fetched successfully, count:', tracks.length)
    return c.json({ tracks })

  } catch (error) {
    console.error('=== USER TRACKS FETCH ERROR ===')
    console.error('Error fetching tracks:', error)
    console.error('Error stack:', error.stack)
    return c.json({ error: `Failed to fetch tracks: ${error.message}` }, 500)
  }
})

// ЗАЩИЩЕННЫЙ endpoint для получения треков текущего пользователя
app.get('/make-server-0daa964a/my-tracks', async (c) => {
  try {
    console.log('=== FETCHING MY TRACKS ===')
    
    const user = await requireAuth(c.req.raw)
    const userId = user.id
    const userTracksKey = `user_tracks:${userId}`
    
    const trackIds = await kv.get(userTracksKey) || []
    const tracks = []

    for (const trackId of trackIds) {
      const trackData = await kv.get(`track:${userId}:${trackId}`)
      if (trackData) {
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(trackData.fileName, 3600 * 24)

        if (!urlError && signedUrlData) {
          tracks.push({
            ...trackData,
            url: signedUrlData.signedUrl
          })
        }
      }
    }

    console.log('✅ My tracks fetched successfully, count:', tracks.length)
    return c.json({ tracks })

  } catch (error) {
    console.error('=== MY TRACKS FETCH ERROR ===')
    console.error('Error fetching my tracks:', error)
    
    if (error.message?.includes('access token')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    return c.json({ error: `Failed to fetch tracks: ${error.message}` }, 500)
  }
})

// ЗАЩИЩЕННЫЙ endpoint для удаления трека
app.delete('/make-server-0daa964a/track/:trackId', async (c) => {
  try {
    console.log('=== DELETE TRACK REQUEST ===')
    
    const user = await requireAuth(c.req.raw)
    const trackId = c.req.param('trackId')
    const userId = user.id
    
    // Получаем данные трека
    const trackData = await kv.get(`track:${userId}:${trackId}`)
    if (!trackData) {
      return c.json({ error: 'Track not found' }, 404)
    }

    // Проверяем владельца
    if (trackData.userId !== userId) {
      return c.json({ error: 'Not authorized to delete this track' }, 403)
    }

    // Удаляем файл из Storage
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([trackData.fileName])

    if (deleteError) {
      console.error('Error deleting file from storage:', deleteError)
    }

    // Удаляем метаданные
    await kv.del(`track:${userId}:${trackId}`)
    
    // Удаляем из списка пользователя
    const userTracksKey = `user_tracks:${userId}`
    const existingTracks = await kv.get(userTracksKey) || []
    const updatedTracks = existingTracks.filter((id: string) => id !== trackId)
    await kv.set(userTracksKey, updatedTracks)

    console.log('✅ Track deleted successfully')
    return c.json({ success: true })

  } catch (error) {
    console.error('=== TRACK DELETE ERROR ===')
    console.error('Delete error:', error)
    
    if (error.message?.includes('access token')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    return c.json({ error: `Failed to delete track: ${error.message}` }, 500)
  }
})

// ЗАЩИЩЕННЫЙ endpoint для создания плейлиста
app.post('/make-server-0daa964a/playlists', async (c) => {
  try {
    console.log('=== CREATE PLAYLIST REQUEST ===')
    
    const user = await requireAuth(c.req.raw)
    const { name, trackIds } = await c.req.json()
    const userId = user.id
    
    if (!name || !Array.isArray(trackIds)) {
      return c.json({ error: 'Name and trackIds are required' }, 400)
    }

    const playlistId = Date.now().toString() + Math.random().toString(36).substring(2)
    const playlistData = {
      id: playlistId,
      name,
      trackIds,
      userId,
      createdDate: new Date().toISOString(),
      isPublic: true
    }

    await kv.set(`playlist:${userId}:${playlistId}`, playlistData)
    
    // Добавляем в список плейлистов пользователя
    const userPlaylistsKey = `user_playlists:${userId}`
    const existingPlaylists = await kv.get(userPlaylistsKey) || []
    await kv.set(userPlaylistsKey, [...existingPlaylists, playlistId])

    console.log('✅ Playlist created successfully')
    return c.json({ success: true, playlist: playlistData })

  } catch (error) {
    console.error('=== PLAYLIST CREATE ERROR ===')
    console.error('Error creating playlist:', error)
    
    if (error.message?.includes('access token')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    return c.json({ error: `Failed to create playlist: ${error.message}` }, 500)
  }
})

// ПУБЛИЧНЫЙ endpoint для получения плейлистов пользователя
app.get('/make-server-0daa964a/playlists/:userId', async (c) => {
  // Проверяем Authorization header
  const authCheck = checkAuthHeader(c.req.raw)
  if (authCheck.error) {
    return c.json({ code: authCheck.status, message: authCheck.error }, authCheck.status)
  }
  
  try {
    const userId = c.req.param('userId')
    console.log('=== FETCHING USER PLAYLISTS ===')
    console.log('Fetching playlists for user:', userId)
    
    const userPlaylistsKey = `user_playlists:${userId}`
    const playlistIds = await kv.get(userPlaylistsKey) || []
    
    const playlists = []
    for (const playlistId of playlistIds) {
      const playlistData = await kv.get(`playlist:${userId}:${playlistId}`)
      if (playlistData && playlistData.isPublic) {
        playlists.push(playlistData)
      }
    }

    console.log('✅ User playlists fetched successfully, count:', playlists.length)
    return c.json({ playlists })

  } catch (error) {
    console.error('=== USER PLAYLISTS FETCH ERROR ===')
    console.error('Error fetching playlists:', error)
    return c.json({ error: `Failed to fetch playlists: ${error.message}` }, 500)
  }
})

// Catch-all для необработанных маршрутов
app.all('*', (c) => {
  console.log('=== UNHANDLED REQUEST ===')
  console.log('Method:', c.req.method)
  console.log('URL:', c.req.url)
  console.log('Path:', c.req.path)
  console.log('Available routes:', [
    'GET /make-server-0daa964a/health',
    'POST /make-server-0daa964a/signup',
    'GET /make-server-0daa964a/profile/:userId',
    'PUT /make-server-0daa964a/profile',
    'GET /make-server-0daa964a/users',
    'POST /make-server-0daa964a/upload-track',
    'GET /make-server-0daa964a/tracks/:userId',
    'GET /make-server-0daa964a/my-tracks',
    'DELETE /make-server-0daa964a/track/:trackId',
    'POST /make-server-0daa964a/playlists',
    'GET /make-server-0daa964a/playlists/:userId'
  ])
  return c.json({ 
    error: 'Endpoint not found', 
    path: c.req.path,
    method: c.req.method,
    message: 'Check console logs for available routes'
  }, 404)
})

console.log('=== 🚀 SERVER READY TO START ===')
console.log('All routes configured, starting Deno server...')

Deno.serve(app.fetch)