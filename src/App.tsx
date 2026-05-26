/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Layers, FileText, Music, Underline, Flame, HelpCircle, Laptop, Settings, BadgeAlert, ArrowLeft, RefreshCw, Smartphone, Palette, Sliders } from 'lucide-react';
import { Material, VideoGroup, ProjectConfig, GeneratedVideo, SubtitleStyle } from './types';
import MaterialLibrary from './components/MaterialLibrary';
import VideoPlayer from './components/VideoPlayer';
import GroupTimeline from './components/GroupTimeline';
import ProjectOverview from './components/ProjectOverview';
import AIScriptDialog from './components/AIScriptDialog';

export default function App() {
  // Materials Library state
  const [materials, setMaterials] = useState<{
    videos: Material[];
    music: Material[];
    images: Material[];
    voiceovers: Material[];
  }>({
    videos: [],
    music: [],
    images: [],
    voiceovers: []
  });

  // Selected library item to load in player
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Video groups in timeline
  const [groups, setGroups] = useState<VideoGroup[]>([]);

  // Config settings
  const [config, setConfig] = useState<ProjectConfig>({
    name: '我的超级混剪矩阵项目',
    bgMusicId: null,
    bgMusicVolume: 50,
    originalVolume: 100,
    dubbingVolume: 100,
    dubbingEnabled: true,
    subtitleStyle: {
      fontFamily: 'sans-serif',
      fontSize: 14,
      color: '#ffff00',
      bgColor: '#000000',
      bold: true,
      stroke: true
    },
    canvasRatio: '9:16',
    bgStyle: 'blur',
    bgColor: '#1e1e24',
    dedupConfig: {
      enableMD5Mutation: true,
      hMirrorMode: 'random',
      videoSpeedRatio: 1.01,
      brightnessJitter: 2,
      contrastJitter: 2,
      enableDynamicNoise: true,
      enableSmartCrop: true,
      enableFrameDrift: true
    }
  });

  // Compiled results
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  // Active playing simulation sequence
  const [activePlaySequence, setActivePlaySequence] = useState<{
    clips: Material[];
    subtitles: { text: string; start: number; end: number }[];
    voiceovers: { url: string; start: number; duration: number }[];
    bgMusicUrl: string | null;
  } | null>(null);

  // Dialog states
  const [isAIScriptOpen, setIsAIScriptOpen] = useState(false);
  const [activeTabPanel, setActiveTabPanel] = useState<'group' | 'music' | 'title' | 'sticker' | 'bg' | 'cover'>('group');

  // Fetch preloaded & custom uploaded materials from full-stack express server
  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
        
        // Load the first material as default preview if available
        if (data.videos && data.videos.length > 0 && !selectedMaterial) {
          setSelectedMaterial(data.videos[0]);
        }

        // Bootstrap timeline with standard 3 groups exactly matching layout screenshot
        // to provide immediate, intuitive interactive testing assets
        if (groups.length === 0 && data.videos.length >= 3) {
          const bootstrapGroups: VideoGroup[] = [
            {
              id: 'group-1',
              name: '开头吸引 Hook',
              videos: [data.videos[0], data.videos[1], data.videos[2]],
              soundEnabled: true,
              voiceoverText: '天呐！这款神仙好物简直是懒人的究极福利！',
              voiceoverVoice: 'Zephyr',
              transition: { type: 'fade', duration: 0.5 }
            },
            {
              id: 'group-2',
              name: '产品介绍 / 展示',
              videos: [data.videos[3] || data.videos[0], data.videos[4] || data.videos[1]],
              soundEnabled: true,
              voiceoverText: '无论是功能细节、抗摔防尘还是省心材质，都无可挑剔！',
              voiceoverVoice: 'Puck',
              transition: { type: 'zoom', duration: 0.5 }
            },
            {
              id: 'group-3',
              name: '加急号召行动 CTA',
              videos: [data.videos[5] || data.videos[2], data.videos[9] || data.videos[0]],
              soundEnabled: true,
              voiceoverText: '限时限量买一送一！赶紧点击左下角下单入手吧！',
              voiceoverVoice: 'Zephyr',
              transition: { type: 'none', duration: 0.5 }
            }
          ];
          setGroups(bootstrapGroups);
        }
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Sync uploaded file to library
  const handleUploadSuccess = (newMaterial: Material) => {
    setMaterials(prev => {
      const field = newMaterial.type === 'video' ? 'videos' : (newMaterial.type === 'image' ? 'images' : (newMaterial.type === 'music' ? 'music' : 'voiceovers'));
      return {
        ...prev,
        [field]: [...prev[field as any], newMaterial]
      };
    });
    setSelectedMaterial(newMaterial);
  };

  // Add material clip to specific group track
  const handleAddMaterialToGroup = (material: Material, groupIndex: number) => {
    setGroups(prev => {
      const updated = [...prev];
      if (updated[groupIndex]) {
        // Safe check duplicates
        const exists = updated[groupIndex].videos.some(v => v.id === material.id);
        if (!exists) {
          updated[groupIndex] = {
            ...updated[groupIndex],
            videos: [...updated[groupIndex].videos, material]
          };
        }
      }
      return updated;
    });
  };

  // Add a trimmed segment of an original material to a group track
  const handleAddSegmentToGroup = (
    originalMaterial: Material,
    start: number,
    end: number,
    groupIndex: number
  ) => {
    setGroups(prev => {
      const updated = [...prev];
      if (updated[groupIndex]) {
        const segmentId = `${originalMaterial.id}-segment-${Date.now()}`;
        const name = `${originalMaterial.name} [分块 ${start.toFixed(1)}s-${end.toFixed(1)}s]`;
        const duration = Number((end - start).toFixed(2));

        const segmentMaterial: Material = {
          ...originalMaterial,
          id: segmentId,
          parentId: originalMaterial.id,
          name,
          duration,
          startTime: start,
          endTime: end
        };

        updated[groupIndex] = {
          ...updated[groupIndex],
          videos: [...updated[groupIndex].videos, segmentMaterial]
        };
      }
      return updated;
    });
  };

  // Remove material clip from specific group track
  const handleRemoveClipFromGroup = (groupId: string, matId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          videos: g.videos.filter(v => v.id !== matId)
        };
      }
      return g;
    }));
  };

  // Timeline operations CRUD
  const handleAddGroup = () => {
    const newId = `group-${Date.now()}`;
    const newGroup: VideoGroup = {
      id: newId,
      name: `分组 ${groups.length + 1}`,
      videos: [],
      soundEnabled: true,
      voiceoverText: '',
      voiceoverVoice: 'Zephyr',
      transition: { type: 'none', duration: 0.5 }
    };
    setGroups([...groups, newGroup]);
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const handleUpdateGroup = (groupId: string, updatedFields: Partial<VideoGroup>) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, ...updatedFields };
      }
      return g;
    }));
  };

  const handleApplyScripts = (scripts: string[]) => {
    setGroups(prev => prev.map((g, i) => {
      if (scripts[i]) {
        return { ...g, voiceoverText: scripts[i] };
      }
      return g;
    }));
  };

  // Real TTS synthesising sequential loader proxy calling backend WAV synthesis
  const handleSynthesizeTTS = async (groupId: string, text: string, voice: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, groupIndex: groupId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.audioUrl) {
          // Update specific group voiceover URL
          handleUpdateGroup(groupId, { voiceoverAudioUrl: data.audioUrl });
          return data.audioUrl;
        }
      }
    } catch (err) {
      console.error('Error synthesizing voiceovers:', err);
    }
    return null;
  };

  // Compile Single preview combination simulation
  const handleGenerateSingle = () => {
    if (groups.some(g => g.videos.length === 0)) return;

    // Pick a random clip from each group
    const chosenClips = groups.map(g => {
      const randIdx = Math.floor(Math.random() * g.videos.length);
      return g.videos[randIdx];
    });

    const subtitles: { text: string; start: number; end: number }[] = [];
    let startSum = 0;

    groups.forEach((g, idx) => {
      const clipDuration = chosenClips[idx]?.duration || 5;
      if (g.voiceoverText) {
        subtitles.push({
          text: g.voiceoverText,
          start: startSum,
          end: startSum + clipDuration - 0.5
        });
      }
      startSum += clipDuration;
    });

    // Load inside player
    const bgMus = materials.music.find(m => m.id === config.bgMusicId);
    setActivePlaySequence({
      clips: chosenClips,
      subtitles,
      voiceovers: chosenClips.map((c, i) => ({
        url: groups[i].voiceoverAudioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        start: 0,
        duration: c.duration
      })),
      bgMusicUrl: bgMus ? bgMus.url : null
    });
  };

  // Bulk Matrix cross multiply compiler
  const handleBatchGenerate = async (count: number) => {
    try {
      const response = await fetch('/api/batch-compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups, config }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.videos) {
          // Slice batch count requested
          setGeneratedVideos(data.videos.slice(0, count));
        }
      }
    } catch (err) {
      console.error('Batch compilation failure:', err);
    }
  };

  const handlePlayGenerated = (video: GeneratedVideo) => {
    setActivePlaySequence({
      clips: video.clips,
      subtitles: video.subtitles,
      voiceovers: video.voiceovers,
      bgMusicUrl: config.bgMusicId ? (materials.music.find(m => m.id === config.bgMusicId)?.url || null) : null
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#161619] text-slate-100 overflow-hidden font-sans">
      {/* Visual Window Header wrapper Feleeo Style */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1b20] border-b border-[#2b2b34] h-11 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-extrabold text-xs tracking-wider flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Feleeo AI Matrix Mixer
          </span>
          <span className="h-4 border-r border-[#2d2d38]"></span>
          <p className="text-[10px] text-slate-500 font-medium">无痕视频矩阵批量混剪控制面板 (Borderless Multi-Clip Assembler)</p>
        </div>

        {/* Action Window Menu Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMaterials()}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#24242a] hover:bg-[#2d2d35] text-slate-300 rounded text-[11px] transition-colors select-none cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            重载索引
          </button>
          
          <span className="h-4 border-r border-[#2d2d38]"></span>
          
          <button className="p-1 px-2 text-[10px] bg-[#24242a] hover:bg-[#2c2c34] rounded transition-colors text-slate-400 hover:text-slate-200">
            项目设置
          </button>
          <button className="p-1 px-2 text-[10px] bg-[#1d2729] hover:bg-[#25393c] rounded text-teal-400 transition-colors border border-teal-950/20">
            无痕回收站
          </button>
        </div>
      </div>

      {/* Main Panel Content (Two vertical split panels: Top: Editor workspace | Bottom: Group Timeline track) */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Top Editor Area - split into materials library, player monitor, and statistics panel */}
        <div className="flex-1 flex min-h-0">
          
          {/* Column 1: Material Library (300px) */}
          <div className="w-[300px] flex-shrink-0 min-w-[280px]">
            <MaterialLibrary
              materials={materials}
              onSelectMaterial={(mat) => {
                setSelectedMaterial(mat);
                setActivePlaySequence(null); // break simulation mode to play original clip
              }}
              selectedMaterialId={selectedMaterial?.id || null}
              onUploadSuccess={handleUploadSuccess}
              onAddMaterialToGroup={handleAddMaterialToGroup}
              groupCount={groups.length}
            />
          </div>

          {/* Column 2: Center Player & Styles configurations */}
          <div className="flex-1 bg-[#141416] flex flex-col min-h-0">
            {/* Real Playhead Screen frame */}
            <VideoPlayer
              activeMaterial={selectedMaterial}
              activeSequence={activePlaySequence}
              subtitleStyle={config.subtitleStyle}
              originalVolume={config.originalVolume}
              bgMusicVolume={config.bgMusicVolume}
              groups={groups}
              onAddSegmentToGroup={handleAddSegmentToGroup}
              onRemoveClipFromGroup={handleRemoveClipFromGroup}
            />

            {/* Custom Interactive Settings Ribbon below Player */}
            <div className="bg-[#141414] border-t border-[#333] flex-1 flex flex-col min-h-0">
              {/* Category tabs matching mockup */}
              <div className="flex border-b border-[#222] text-xs h-8 flex-shrink-0 font-bold bg-[#1A1A1A]">
                {[
                  { id: 'group', label: '视频编排 (Group)', icon: Layers },
                  { id: 'music', label: '伴奏音乐 (Music)', icon: Music },
                  { id: 'title', label: '智能字幕 (Subtitle)', icon: Underline },
                  { id: 'sticker', label: '防搬运贴纸 (Stickers)', icon: Flame },
                  { id: 'bg', label: '画布尺寸 (Canvas)', icon: Palette }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabPanel(tab.id as any)}
                      className={`flex-1 py-1 flex items-center justify-center gap-1.5 border-b-2 text-[10.5px] transition-all cursor-pointer ${
                        activeTabPanel === tab.id
                          ? 'border-blue-500 text-blue-400 bg-[#252525]'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Configure Panel content container */}
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-[11px]">
                
                {activeTabPanel === 'group' && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Part A: AI Generation Trigger strip */}
                    <div className="bg-black border border-[#222] p-2.5 rounded-sm space-y-2">
                      <p className="font-bold text-gray-200 flex items-center gap-1.5 text-[10.5px]">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        AI 爆款矩阵口播文案撰写
                      </p>
                      <p className="text-[9.5px] text-gray-500 leading-tight">
                        一键调用 Gemini - 完美匹配每个视频节点，撰写出配合钩子、痛点、CTA 的优秀带货文案，生成配套配音素材。
                      </p>
                      <button
                        onClick={() => setIsAIScriptOpen(true)}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm flex items-center justify-center gap-1 transition-all text-[10.5px] cursor-pointer shadow-md"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI一键口播脚本配置与配音生成
                      </button>
                    </div>

                    {/* Part B: Volume mixing sliders */}
                    <div className="bg-black border border-[#222] p-2.5 rounded-sm space-y-2">
                      <p className="font-bold text-gray-200 flex items-center gap-1.5 text-[10.5px]">
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        音流细节混合器 (Audio Mixer)
                      </p>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-[#888]">
                          <span>原视频轨道音量</span>
                          <span className="font-mono text-blue-400 font-bold">{config.originalVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.originalVolume}
                          onChange={(e) => setConfig({ ...config, originalVolume: parseInt(e.target.value) })}
                          className="w-full accent-blue-500 bg-[#252525] h-1 rounded cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-[#888]">
                          <span>TTS 配音声道音量</span>
                          <span className="font-mono text-blue-400 font-bold">{config.dubbingVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.dubbingVolume}
                          onChange={(e) => setConfig({ ...config, dubbingVolume: parseInt(e.target.value) })}
                          className="w-full accent-blue-500 bg-[#252525] h-1 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTabPanel === 'music' && (
                  <div className="space-y-3 bg-black border border-[#222] p-3 rounded-sm">
                    <p className="font-bold text-gray-200 text-[10.5px] uppercase">背景视频配音与背景音乐混缩</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-[9px]">音乐伴奏曲库选取</label>
                        <select
                          value={config.bgMusicId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig({ ...config, bgMusicId: val ? val : null });
                          }}
                          className="bg-black text-[#E0E0E0] border border-[#333] rounded-sm px-2 py-1 focus:outline-none w-full text-[10px]"
                        >
                          <option value="">[无背景音乐伴奏]</option>
                          {materials.music.map(mus => (
                            <option key={mus.id} value={mus.id}>{mus.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-gray-400 text-[9px] mb-0.5">
                          <span>背景音乐音量比率</span>
                          <span className="font-mono text-blue-400 font-bold">{config.bgMusicVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.bgMusicVolume}
                          onChange={(e) => setConfig({ ...config, bgMusicVolume: parseInt(e.target.value) })}
                          className="w-full accent-blue-500 bg-[#252525] h-1 rounded cursor-pointer mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTabPanel === 'title' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5 bg-black p-2.5 rounded-sm border border-[#222]">
                      <label className="block text-gray-400 font-bold mb-0.5">字幕字号 (Size)</label>
                      <input
                        type="number"
                        min="10"
                        max="32"
                        value={config.subtitleStyle.fontSize}
                        onChange={(e) => setConfig({
                          ...config,
                          subtitleStyle: { ...config.subtitleStyle, fontSize: parseInt(e.target.value) || 12 }
                        })}
                        className="w-full bg-black border border-[#333] rounded-sm px-2 py-0.5 font-mono text-[#E0E0E0] text-center text-[10px]"
                      />
                    </div>

                    <div className="space-y-1.5 bg-black p-2.5 rounded-sm border border-[#222]">
                      <label className="block text-gray-400 font-bold mb-0.5">文字填充颜色 (Fill)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.subtitleStyle.color}
                          onChange={(e) => setConfig({
                            ...config,
                            subtitleStyle: { ...config.subtitleStyle, color: e.target.value }
                          })}
                          className="w-8 h-5 bg-transparent cursor-pointer rounded-sm"
                        />
                        <span className="font-mono text-[9px] text-[#888] bg-black px-1.5 py-0.5 rounded-sm border border-[#222] uppercase">{config.subtitleStyle.color}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-black p-2.5 rounded-sm border border-[#222]">
                      <label className="block text-gray-400 font-bold mb-0.5">文字立体轮廓</label>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="checkbox"
                          checked={config.subtitleStyle.stroke}
                          onChange={(e) => setConfig({
                            ...config,
                            subtitleStyle: { ...config.subtitleStyle, stroke: e.target.checked }
                          })}
                          className="w-3.5 h-3.5 bg-black border-[#333] rounded-sm accent-blue-600"
                        />
                        <span className="text-[10px] text-gray-300">立体高反边界黑影</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTabPanel === 'sticker' && (
                  <div className="bg-black border border-[#222] p-3 rounded-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-[#222] pb-2">
                      <p className="font-bold text-gray-200 text-[10.5px] uppercase flex items-center gap-1.5 text-cyan-400">
                        <Flame className="w-3.5 h-3.5" />
                        AI 高级防搬运去重参数控制台 (Anti-Repetitive Core)
                      </p>
                      <span className="text-[9px] text-[#A0A0A0] bg-cyan-950/40 text-cyan-400 font-bold px-1.5 py-0.5 rounded border border-cyan-800/30">
                        矩阵去重混剪引擎 V3.1
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                      {/* MD5 & Noise */}
                      <div className="space-y-2 p-2 bg-[#121212] border border-[#222] rounded-sm flex flex-col justify-between">
                        <label className="text-gray-300 font-bold flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={config.dedupConfig.enableMD5Mutation}
                            onChange={(e) => setConfig({
                              ...config,
                              dedupConfig: { ...config.dedupConfig, enableMD5Mutation: e.target.checked }
                            })}
                            className="w-3.5 h-3.5 rounded-sm accent-blue-600"
                          />
                          MD5 动态重构
                        </label>
                        <p className="text-[8.5px] text-gray-500 leading-tight">首尾追加扰动二进制尾缀，重算文件唯一哈希值，防止首轮MD5库拦截。</p>
                      </div>

                      {/* Mirroring Mode */}
                      <div className="space-y-1.5 p-2 bg-[#121212] border border-[#222] rounded-sm flex flex-col justify-between">
                        <div>
                          <label className="text-gray-300 font-bold">画面镜像翻转</label>
                          <select
                            value={config.dedupConfig.hMirrorMode}
                            onChange={(e) => setConfig({
                              ...config,
                              dedupConfig: { ...config.dedupConfig, hMirrorMode: e.target.value as any }
                            })}
                            className="w-full bg-[#1A1A1A] text-gray-300 border border-[#333] text-[9.5px] rounded-sm py-1 px-1 mt-1 focus:outline-none focus:border-cyan-600"
                          >
                            <option value="none">从不镜像 (None)</option>
                            <option value="random">随机部分镜像 (Random 50%)</option>
                            <option value="always">全部强制镜像 (Always 100%)</option>
                          </select>
                        </div>
                        <p className="text-[8.5px] text-gray-500 leading-tight">水平方向旋转镜头，彻底打乱原图层空间指纹。</p>
                      </div>

                      {/* Speed multiplier */}
                      <div className="space-y-1.5 p-2 bg-[#121212] border border-[#222] rounded-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <label className="text-gray-300 font-bold">时间微变速</label>
                            <span className="font-mono text-cyan-400 font-extrabold">{config.dedupConfig.videoSpeedRatio}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.95"
                            max="1.05"
                            step="0.01"
                            value={config.dedupConfig.videoSpeedRatio}
                            onChange={(e) => setConfig({
                              ...config,
                              dedupConfig: { ...config.dedupConfig, videoSpeedRatio: parseFloat(e.target.value) }
                            })}
                            className="w-full accent-cyan-500 bg-[#252525] h-1 mt-1 cursor-pointer"
                          />
                        </div>
                        <p className="text-[8.5px] text-gray-500 leading-tight">微变速时间线，改变视频绝对时长和音频流波形对齐。</p>
                      </div>

                      {/* Micro Drift crop */}
                      <div className="space-y-2 p-2 bg-[#121212] border border-[#222] rounded-sm flex flex-col justify-between">
                        <label className="text-gray-300 font-bold flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={config.dedupConfig.enableSmartCrop}
                            onChange={(e) => setConfig({
                              ...config,
                              dedupConfig: { ...config.dedupConfig, enableSmartCrop: e.target.checked }
                            })}
                            className="w-3.5 h-3.5 rounded-sm accent-blue-600"
                          />
                          画幅 1.5% 安全拉伸
                        </label>
                        <p className="text-[8.5px] text-gray-500 leading-tight">1.5% 画面拉伸与无损微裁剪，裁掉原边框指纹与固定浮标。</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                      {/* Contrast Jitter */}
                      <div className="space-y-1.5 p-2 bg-[#121212] border border-[#222] rounded-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <label className="text-gray-300 font-bold">色彩对比度微调</label>
                            <span className="font-mono text-cyan-400 font-extrabold">±{config.dedupConfig.contrastJitter}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={config.dedupConfig.contrastJitter}
                            onChange={(e) => setConfig({
                              ...config,
                              dedupConfig: { ...config.dedupConfig, dedupConfig: { ...config.dedupConfig, contrastJitter: parseInt(e.target.value) } }
                            })}
                            className="w-full accent-cyan-500 bg-[#252525] h-1 mt-1 cursor-pointer"
                          />
                        </div>
                        <p className="text-[8.5px] text-gray-500 leading-tight">直方图曲线像素微调，破坏原视频在去重系统的通道指纹。</p>
                      </div>

                      {/* Brightness Jitter */}
                      <div className="space-y-1.5 p-2 bg-[#121212] border border-[#222] rounded-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <label className="text-gray-300 font-bold">亮度波段随机偏移</label>
                            <span className="font-mono text-cyan-400 font-extrabold">±{config.dedupConfig.brightnessJitter}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={config.dedupConfig.brightnessJitter}
                            onChange={(e) => setConfig({
                              ...config,
                              dedupConfig: { ...config.dedupConfig, dedupConfig: { ...config.dedupConfig, brightnessJitter: parseInt(e.target.value) } }
                            })}
                            className="w-full accent-cyan-500 bg-[#252525] h-1 mt-1 cursor-pointer"
                          />
                        </div>
                        <p className="text-[8.5px] text-gray-500 leading-tight">随机增益亮度通道值，秒级错位防审核特征检测比对。</p>
                      </div>

                      {/* Dynamic Noise */}
                      <div className="space-y-2 p-2 bg-[#121212] border border-[#222] rounded-sm flex flex-col justify-between">
                        <label className="text-gray-300 font-bold flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={config.dedupConfig.enableDynamicNoise}
                            onChange={(e) => setConfig({
                              ...config,
                              dedupConfig: { ...config.dedupConfig, enableDynamicNoise: e.target.checked }
                            })}
                            className="w-3.5 h-3.5 rounded-sm accent-blue-600"
                          />
                          不规则粒子噪声注入
                        </label>
                        <p className="text-[8.5px] text-gray-500 leading-tight">插入 0.2% 不可见防搬运高频透明粒子噪层，消除重复文件静态签名。</p>
                      </div>

                      {/* Head/Tail split drift */}
                      <div className="space-y-2 p-2 bg-[#121212] border border-[#222] rounded-sm flex flex-col justify-between">
                        <label className="text-gray-300 font-bold flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={config.dedupConfig.enableFrameDrift}
                            onChange={(e) => setConfig({
                              ...config,
                              dedupConfig: { ...config.dedupConfig, enableFrameDrift: e.target.checked }
                            })}
                            className="w-3.5 h-3.5 rounded-sm accent-blue-600"
                          />
                          尾部随机削减帧结构
                        </label>
                        <p className="text-[8.5px] text-gray-500 leading-tight">自动对最终视频剪切末尾 2-5 帧，微调音频，打乱帧总长度。</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTabPanel === 'bg' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 bg-black p-2 rounded-sm border border-[#222]">
                      <label className="block text-gray-400 mb-0.5">画布比例</label>
                      <div className="flex gap-1">
                        {['16:9', '9:16'].map(ratio => (
                          <button
                            key={ratio}
                            onClick={() => setConfig({ ...config, canvasRatio: ratio as any })}
                            className={`flex-1 py-0.5 rounded-sm text-[9.5px] font-bold flex items-center justify-center gap-1 cursor-pointer ${config.canvasRatio === ratio ? 'bg-blue-600 text-white' : 'bg-[#252525] text-gray-400 hover:text-white'}`}
                          >
                            {ratio === '16:9' ? <Laptop className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 bg-black p-2 rounded-sm border border-[#222]">
                      <label className="block text-gray-400 mb-0.5">侧边栏填充画风</label>
                      <div className="flex gap-1">
                        {['blur', 'black'].map(bgStyle => (
                          <button
                            key={bgStyle}
                            onClick={() => setConfig({ ...config, bgStyle: bgStyle as any })}
                            className={`flex-1 py-0.5 rounded-sm text-[9.5px] font-bold text-center cursor-pointer ${config.bgStyle === bgStyle ? 'bg-blue-600 text-white' : 'bg-[#252525] text-gray-400 hover:text-white'}`}
                          >
                            {bgStyle === 'blur' ? '智能毛玻璃' : '纯黑极简'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Project Overview Sidebar & Permutation computation (350px) */}
          <div className="w-[350px] flex-shrink-0 min-w-[#320px]">
            <ProjectOverview
              groups={groups}
              config={config}
              generatedVideos={generatedVideos}
              onGenerateSingle={handleGenerateSingle}
              onBatchGenerate={handleBatchGenerate}
              onPlayGenerated={handlePlayGenerated}
              onSelectMusic={(musId) => setConfig({ ...config, bgMusicId: musId })}
              musicList={materials.music}
            />
          </div>
        </div>

        {/* Bottom Workspace Track Timeline */}
        <div className="h-[280px] bg-[#141417] flex-shrink-0 flex flex-col min-h-[250px]">
          <GroupTimeline
            groups={groups}
            onAddGroup={handleAddGroup}
            onRemoveGroup={handleRemoveGroup}
            onUpdateGroup={handleUpdateGroup}
            onRemoveClipFromGroup={handleRemoveClipFromGroup}
            materialsList={[...materials.videos, ...materials.voiceovers, ...materials.images]}
          />
        </div>
      </div>

      {/* Pop Dialogs modals overlay */}
      <AIScriptDialog
        groups={groups}
        isOpen={isAIScriptOpen}
        onClose={() => setIsAIScriptOpen(false)}
        onApplyScripts={handleApplyScripts}
        onSynthesizeTTS={handleSynthesizeTTS}
      />
    </div>
  );
}
