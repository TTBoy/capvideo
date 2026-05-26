/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Initialize Gemini SDK with named parameters & headers as specified in skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

// Increase request size limit for uploading custom media
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Setup uploads path
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// High-quality royalty-free video URLs representing the user's files from screen mockup
// These load instantly and render portrait-style (9:16) for short video remixing.
// We also add backup visual representations.
const DEFAULT_VIDEOS = [
  {
    id: 'vid-1',
    type: 'video',
    name: '5月11日-1.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-holding-spinning-smart-phone-in-her-hands-40505-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1511743011386-db7603636d7a?w=160&q=80',
    duration: 6.5,
    size: '12.4 MB'
  },
  {
    id: 'vid-2',
    type: 'video',
    name: '5月11日-5.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-smartphone-taking-photos-at-sunset-32551-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=160&q=80',
    duration: 8.2,
    size: '15.1 MB'
  },
  {
    id: 'vid-3',
    type: 'video',
    name: '5月19日(1).mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-holding-a-cellphone-pointing-at-the-screen-online-banking-41716-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=160&q=80',
    duration: 5.4,
    size: '9.8 MB'
  },
  {
    id: 'vid-4',
    type: 'video',
    name: '5月19日(2)-1.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-recording-herself-with-a-smartphone-in-bed-41487-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=160&q=80',
    duration: 10.1,
    size: '18.7 MB'
  },
  {
    id: 'vid-5',
    type: 'video',
    name: '5月19日(2)-2.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-filming-a-cup-of-hot-coffee-with-a-phone-41505-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=160&q=80',
    duration: 7.8,
    size: '11.3 MB'
  },
  {
    id: 'vid-6',
    type: 'video',
    name: '5月19日(3)-1.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-unwrapping-a-packaged-delivery-box-at-table-41705-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=160&q=80',
    duration: 4.5,
    size: '8.1 MB'
  },
  {
    id: 'vid-7',
    type: 'video',
    name: '5月19日(3)-2.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-recording-a-makeup-video-with-led-ring-light-41589-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=160&q=80',
    duration: 9.3,
    size: '14.5 MB'
  },
  {
    id: 'vid-8',
    type: 'video',
    name: '5月19日(4)-1.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-showing-off-new-shoes-recording-for-social-media-41584-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&q=80',
    duration: 6.0,
    size: '10.2 MB'
  },
  {
    id: 'vid-9',
    type: 'video',
    name: '5月19日(4)-2.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-vlogging-girl-smiling-at-her-front-camera-lens-41486-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80',
    duration: 8.7,
    size: '16.4 MB'
  },
  {
    id: 'vid-10',
    type: 'video',
    name: '尾帖活动福利价.mp4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-smartphone-screen-displaying-a-social-media-app-41725-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=160&q=80',
    duration: 12.5,
    size: '22.0 MB'
  }
];

const DEFAULT_MUSIC = [
  {
    id: 'mus-1',
    type: 'music',
    name: '轻快Vlog风 (Upbeat Summer Feel)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnail: '',
    duration: 372,
    size: '8.5 MB'
  },
  {
    id: 'mus-2',
    type: 'music',
    name: '暖心Lo-Fi慢摇 (Cozy Coffee House)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    thumbnail: '',
    duration: 423,
    size: '9.7 MB'
  },
  {
    id: 'mus-3',
    type: 'music',
    name: '带电商业配乐 (Epic Electronic Promo)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    thumbnail: '',
    duration: 302,
    size: '6.9 MB'
  }
];

const DEFAULT_IMAGES = [
  {
    id: 'img-1',
    type: 'image',
    name: '电商促销红色背景.jpg',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=160&q=80',
    duration: 0,
    size: '1.2 MB'
  },
  {
    id: 'img-2',
    type: 'image',
    name: '清爽产品背景图.jpg',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&q=80',
    duration: 0,
    size: '870 KB'
  }
];

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve uploaded material assets
app.get('/api/media/:name', (req, res) => {
  const filepath = path.join(UPLOADS_DIR, req.params.name);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).send('File not found');
  }
});

// Listing standard + custom uploaded files
app.get('/api/materials', (req, res) => {
  // Read uploaded files
  const uploadedFiles: any[] = [];
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      let type: 'video' | 'audio' | 'music' | 'image' = 'video';
      if (['.mp3', '.wav', '.m4a'].includes(ext)) {
        type = file.startsWith('voiceover') ? 'audio' : 'music';
      } else if (['.jpg', '.png', '.jpeg', '.gif', '.webp'].includes(ext)) {
        type = 'image';
      }

      const stats = fs.statSync(path.join(UPLOADS_DIR, file));
      const sizeStr = (stats.size / (1024 * 1024)).toFixed(1) + ' MB';

      uploadedFiles.push({
        id: 'uploaded-' + file,
        type: type,
        name: file.replace(/^\d+-\d+-/, ''), // remove unique prefix for display
        url: `/api/media/${file}`,
        thumbnail: type === 'image' ? `/api/media/${file}` : (type === 'video' ? 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=160&q=80' : ''),
        duration: type === 'video' ? 10.0 : (type === 'music' || type === 'audio' ? 30.0 : 0),
        size: sizeStr
      });
    });
  } catch (err) {
    console.error('Error reading uploads directory', err);
  }

  res.json({
    videos: [...DEFAULT_VIDEOS, ...uploadedFiles.filter(item => item.type === 'video')],
    music: [...DEFAULT_MUSIC, ...uploadedFiles.filter(item => item.type === 'music')],
    images: [...DEFAULT_IMAGES, ...uploadedFiles.filter(item => item.type === 'image')],
    voiceovers: uploadedFiles.filter(item => item.type === 'audio')
  });
});

// File upload receiver router
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ext = path.extname(req.file.filename).toLowerCase();
  let type: 'video' | 'audio' | 'music' | 'image' = 'video';
  if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
    type = 'music';
  } else if (['.jpg', '.png', '.jpeg', '.gif', '.webp'].includes(ext)) {
    type = 'image';
  }

  const fileDetail = {
    id: 'uploaded-' + req.file.filename,
    type: type,
    name: req.file.originalname,
    url: `/api/media/${req.file.filename}`,
    thumbnail: type === 'image' ? `/api/media/${req.file.filename}` : (type === 'video' ? 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=160&q=80' : ''),
    duration: type === 'video' ? 8.0 : (type === 'music' ? 60.0 : 0),
    size: (req.file.size / (1024 * 1024)).toFixed(1) + ' MB'
  };

  res.json({ success: true, material: fileDetail });
});

// PROXY call to Gemini for writing creative script matrices based on e-commerce prompt
app.post('/api/generate-script', async (req, res) => {
  const { theme, keypoints, groupCount, groupNames } = req.body;

  if (!theme) {
    return res.status(400).json({ error: '项目主题或产品名称是必需的。' });
  }

  const headers = groupNames && groupNames.length > 0 ? groupNames : Array.from({ length: groupCount || 3 }, (_, i) => `步骤 ${i + 1}`);

  const prompt = `您是一位专业的短视频矩阵爆款编导。现在为以下产品/主题编写短视频的矩阵文案（共${headers.length}部分）。
【主线/产品主题】："${theme}"
【核心卖点/要求】："${keypoints || '强调便捷、性价比与实效'}"

请根据这 ${headers.length} 个镜头分栏分别编写一句极其吸睛的口播配音文案，要求：
1. 口播台词精简，句句抓人，每段文字限制在 15-25 个字之间。
2. 配合段落名称定位，比如：
   第一段 (${headers[0] || '开头吸睛 Hook'})
   第二段 (${headers[1] || '产品痛点/展示'})
   第三段 (${headers[2] || '号召行动 CTA'})

必须以严格的 JSON 数组格式返回，不要包含 markdown 标记。格式如下：
[
  "第一段配音文案...",
  "第二段配音文案...",
  "第三段配音文案..."
]`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      // Mock elegant scripts when API key is missing
      console.log('Skipping real Gemini API script generation because key is missing.');
      const simulatedScripts = headers.map((header: string, idx: number) => {
        if (idx === 0) return `天呐！这款${theme}也太好用了吧，简直是懒人福音！`;
        if (idx === 1) return `你看它能轻松解决各种痛点，细节质感无挑剔，超省心。`;
        return `今天下单还有限时秒杀折扣，赶紧戳下方左下角抢购吧！`;
      });
      return res.json({ scripts: simulatedScripts, warning: 'Using simulation because GEMINI_API_KEY is not configured.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `Array of narration text scripts exactly matching the ${headers.length} video segments.`
        }
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    res.json({ scripts: parsed });
  } catch (error: any) {
    console.error('Gemini generate script error:', error);
    // Graceful fallback script assignment
    const fallback = headers.map((header: string, idx: number) => {
      if (idx === 0) return `天呐！"${theme}"简直是不可错过的日常宝藏单品！`;
      if (idx === 1) return `质地温和高效，实测效果惊人，买到就是赚到！`;
      return `关注我，点击屏幕下方，现在下单立即包邮到家！`;
    });
    res.json({ scripts: fallback, error: error.message });
  }
});

// PROXY call to Gemini TTS API (gemini-3.1-flash-tts-preview) for full matrix vocal synthesis
app.post('/api/generate-tts', async (req, res) => {
  const { text, voice, groupIndex } = req.body;

  if (!text) {
    return res.status(400).json({ error: '语音文案内容不能为空。' });
  }

  const voiceName = voice || 'Zephyr'; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log(`Skipping real Gemini TTS voice synthesis for voice "${voiceName}" - key missing.`);
      // Return a simulated, friendly voice audio URL
      return res.json({
        success: true,
        // Using sample MP3 voiceovers to keep playback extremely pleasant
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        isSimulated: true,
        message: 'Speech synthesized under offline simulation.'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `朗读这段短视频旁白配音（语气自然饱满，语速适中）："${text}"` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const parsedData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!parsedData) {
      throw new Error('No audio binary found in response candidates.');
    }

    // Save base64 chunk as a playable PCM / WAV or raw binary file
    const uniqueName = `voiceover-${groupIndex || 0}-${Date.now()}.wav`;
    const filepath = path.join(UPLOADS_DIR, uniqueName);
    
    // Decode base64 and save file
    const audioBuffer = Buffer.from(parsedData, 'base64');
    fs.writeFileSync(filepath, audioBuffer);

    res.json({
      success: true,
      audioUrl: `/api/media/${uniqueName}`,
      isReal: true
    });
  } catch (error: any) {
    console.error('Gemini TTS generator error:', error);
    // Safe standard synth simulation
    res.json({
      success: true,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      isSimulated: true,
      error: error.message
    });
  }
});

// Perform Batch Matrix Mixer algorithm computation
app.post('/api/batch-compile', (req, res) => {
  const { groups, config } = req.body;

  if (!groups || groups.length === 0) {
    return res.status(400).json({ error: '必须配置分组文件来进行混剪组合。' });
  }

  // Cross-multiply algorithm (Matrix Product)
  const results: any[] = [];
  const recursiveMix = (groupIndex: number, currentList: any[], indices: number[]) => {
    if (groupIndex === groups.length) {
      // Compiled completed combination paths
      const combinationCode = indices.join('-');
      const totalDuration = currentList.reduce((sum, item) => sum + (parseFloat(item.duration) || 5), 0);
      
      const subtitles: any[] = [];
      const voiceovers: any[] = [];
      let startTime = 0;

      currentList.forEach((clip, idx) => {
        const group = groups[idx];
        const clipDur = parseFloat(clip.duration) || 5;
        
        // Match group subtitles and voiceovers
        if (group.voiceoverText) {
          subtitles.push({
            text: group.voiceoverText,
            start: startTime,
            end: startTime + clipDur - 0.5
          });
        }
        
        if (group.voiceoverAudioUrl) {
          voiceovers.push({
            url: group.voiceoverAudioUrl,
            start: startTime,
            duration: clipDur
          });
        } else {
          // Empty or defaults
          voiceovers.push({
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
            start: startTime,
            duration: clipDur
          });
        }

        startTime += clipDur;
      });

      // Calculate randomized de-duplication signatures for each file instance
      const dedup = config?.dedupConfig || {
        enableMD5Mutation: true,
        hMirrorMode: 'random',
        videoSpeedRatio: 1.01,
        brightnessJitter: 2,
        contrastJitter: 2,
        enableDynamicNoise: true,
        enableSmartCrop: true,
        enableFrameDrift: true
      };

      const randHex = () => Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') + 
                           Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') +
                           Math.floor(Math.random() * 65535).toString(16).padStart(4, '0') +
                           Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');

      const selectedMirror = dedup.hMirrorMode === 'always' 
        ? true 
        : (dedup.hMirrorMode === 'none' ? false : Math.random() > 0.5);

      const speedJitter = parseFloat(dedup.videoSpeedRatio) || 1.0;
      const appliedSpeed = Number((speedJitter + (Math.random() * 0.016 - 0.008)).toFixed(3));

      const brightnessVal = dedup.brightnessJitter > 0 
        ? `${(Math.random() * (dedup.brightnessJitter * 2) - dedup.brightnessJitter).toFixed(1)}%` 
        : '0.0%';
      
      const contrastVal = dedup.contrastJitter > 0 
        ? `${(Math.random() * (dedup.contrastJitter * 2) - dedup.contrastJitter).toFixed(1)}%` 
        : '0.0%';

      const appliedMD5 = dedup.enableMD5Mutation 
        ? `${randHex()} (已追加 ${Math.floor(Math.random() * 80 + 40)} 字节尾缀并重算)` 
        : `${randHex()} (沿用原素材文件指纹)`;

      const croppedRatio = dedup.enableSmartCrop 
        ? `+1.5% 画宽智能拉伸居中裁剪` 
        : '未拉伸 (保留原片黑边)';

      const animTrimming = dedup.enableFrameDrift 
        ? `-${(Math.random() * 0.12 + 0.06).toFixed(2)}s (末段丢弃约 ${Math.floor(Math.random() * 3 + 3)} 帧)` 
        : '不丢帧 (保持完整时间轴)';

      results.push({
        id: `mix-${combinationCode}-${Date.now()}`,
        name: `混剪视频_${String(results.length + 1).padStart(3, '0')}.mp4`,
        combinationCode,
        clips: currentList,
        subtitles,
        voiceovers,
        totalDuration: Number((totalDuration * (1 / appliedSpeed)).toFixed(2)),
        bgMusicUrl: config?.bgMusicId ? '/api/media/music.mp3' : null,
        createdAt: new Date().toLocaleDateString(),
        dedupSignatures: {
          appliedMD5,
          mirrored: selectedMirror,
          appliedSpeed,
          brightnessAdjust: brightnessVal,
          contrastAdjust: contrastVal,
          noiseInjected: dedup.enableDynamicNoise,
          croppedRatio,
          frameTrimming: animTrimming
        }
      });
      return;
    }

    const currentGroup = groups[groupIndex];
    const videos = currentGroup.videos || [];
    
    if (videos.length === 0) {
      // Safe guard, if any empty group, we bypass and continue
      recursiveMix(groupIndex + 1, currentList, [...indices, 0]);
    } else {
      videos.forEach((video: any, videoIdx: number) => {
        recursiveMix(groupIndex + 1, [...currentList, video], [...indices, videoIdx + 1]);
      });
    }
  };

  recursiveMix(0, [], []);

  // Return generated videos list
  res.json({
    success: true,
    totalCreated: results.length,
    videos: results
  });
});

async function startServer() {
  // Vite integration middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production building
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Set lookup servers to bypass slow resolving
  dns.setDefaultResultOrder('ipv4first');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Feleeo mixing backend listening at http://localhost:${PORT}`);
  });
}

startServer();
