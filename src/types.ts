/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MaterialType = 'video' | 'audio' | 'music' | 'image';

export interface Material {
  id: string;
  type: MaterialType;
  name: string;
  url: string;
  thumbnail: string;
  duration: number; // in seconds
  size: string;
  isSelected?: boolean;
  startTime?: number; // start offset within original video (in seconds)
  endTime?: number;   // end offset within original video (in seconds)
  parentId?: string;  // ID of original material if this is a sub-clip
}

export type TransitionType = 'none' | 'fade' | 'zoom' | 'slide';

export interface TransitionSettings {
  type: TransitionType;
  duration: number; // in seconds
}

export interface VideoGroup {
  id: string;
  name: string;
  videos: Material[];         // list of videos grouped in this segment
  soundEnabled: boolean;     // original sound toggle
  voiceoverText: string;     // AI generated script / voiceover text
  voiceoverVoice: string;    // voice ID for TTS
  voiceoverAudioUrl?: string; // compiled audio file URL
  transition: TransitionSettings;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;          // in pixels
  color: string;             // hex color
  bgColor: string;           // hex color (for backing box)
  bold: boolean;
  stroke: boolean;           // text outline stroke
}

export interface DeduplicationConfig {
  enableMD5Mutation: boolean;     // MD5 混淆 (改变字节流尾部，制造独一无二的文件哈希值)
  hMirrorMode: 'always' | 'random' | 'none'; // 水平镜像翻转 (扰乱原画面视觉特征)
  videoSpeedRatio: number;        // 变速范围 (0.95 - 1.05之间微移，改变时间轨道和音画对齐特征)
  brightnessJitter: number;       // 亮度微扰波动率 (+/- 1-5%)
  contrastJitter: number;         // 对比度微扰波动率 (+/- 1-5%)
  enableDynamicNoise: boolean;    // 动态高频暗噪点通道 (规避云端行为画面特征库)
  enableSmartCrop: boolean;       // 安全微裁剪与缩放 (1.5% 画面拉伸，剪绝暗角特征)
  enableFrameDrift: boolean;      // 智能头尾随机帧切除 (丢弃 0.1-0.2秒末尾帧，扰乱帧序列指纹)
}

export interface ProjectConfig {
  name: string;
  bgMusicId: string | null;
  bgMusicVolume: number;     // 0 - 100
  originalVolume: number;    // 0 - 100
  dubbingVolume: number;     // 0 - 100
  dubbingEnabled: boolean;
  subtitleStyle: SubtitleStyle;
  canvasRatio: '16:9' | '9:16';
  bgStyle: 'blur' | 'color' | 'black';
  bgColor: string;           // hex color when bgStyle is 'color'
  dedupConfig: DeduplicationConfig; // 视频去重参数集
}

export interface GeneratedVideo {
  id: string;
  name: string;
  combinationCode: string;   // e.g., "1-3-2" indices
  clips: Material[];         // ordered list of videos selected for this mix
  subtitles: { text: string; start: number; end: number }[];
  voiceovers: { url: string; start: number; duration: number }[];
  totalDuration: number;
  bgMusicUrl: string | null;
  createdAt: string;
  dedupSignatures?: {         // 该视频实例在合成时应用的独有防搬运去重特征码 & 算法印记
    appliedMD5: string;
    mirrored: boolean;
    appliedSpeed: number;
    brightnessAdjust: string;
    contrastAdjust: string;
    noiseInjected: boolean;
    croppedRatio: string;
    frameTrimming: string;
  };
}
