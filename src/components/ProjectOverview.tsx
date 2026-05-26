/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Download, Loader2, Video, CheckCircle2, Music, Settings2, Sparkles, Sliders, Type, HelpCircle, ShieldAlert, ChevronDown, ChevronUp, Fingerprint, Shield } from 'lucide-react';
import { VideoGroup, GeneratedVideo, ProjectConfig } from '../types';

interface ProjectOverviewProps {
  groups: VideoGroup[];
  config: ProjectConfig;
  generatedVideos: GeneratedVideo[];
  onGenerateSingle: () => void;
  onBatchGenerate: (count: number) => void;
  onPlayGenerated: (video: GeneratedVideo) => void;
  onSelectMusic: (musicId: string | null) => void;
  musicList: any[];
}

export default function ProjectOverview({
  groups,
  config,
  generatedVideos,
  onGenerateSingle,
  onBatchGenerate,
  onPlayGenerated,
  onSelectMusic,
  musicList
}: ProjectOverviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'preview'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [batchCountInput, setBatchCountInput] = useState(10);
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  // Calculate overall cross multiplication permutations
  const hasEmptyGroup = groups.some(g => g.videos.length === 0);
  const possibleCount = hasEmptyGroup 
    ? 0 
    : groups.reduce((product, g) => product * (g.videos.length || 1), 1);

  const totalMinDuration = groups.reduce((sum, g) => {
    if (g.videos.length === 0) return sum;
    const durs = g.videos.map(v => v.duration || 5);
    return sum + Math.min(...durs);
  }, 0);

  const totalMaxDuration = groups.reduce((sum, g) => {
    if (g.videos.length === 0) return sum;
    const durs = g.videos.map(v => v.duration || 5);
    return sum + Math.max(...durs);
  }, 0);

  const handleBatchCompileClick = () => {
    setIsGenerating(true);
    setGenerationProgress(5);
    
    // Animate beautiful processing rendering progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            onBatchGenerate(Math.min(batchCountInput, possibleCount));
            setActiveTab('preview');
          }, 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 150);
  };

  return (
    <div id="project-overview-panel" className="w-[350px] h-full bg-[#141414] border-l border-[#333] text-[#E0E0E0] flex flex-col justify-between">
      {/* Header Tabs */}
      <div className="flex border-b border-[#222] bg-[#1A1A1A] text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-center font-bold tracking-tight transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#252525] text-blue-400 border-b-2 border-blue-500'
              : 'text-[#888] hover:text-[#fff]'
          }`}
        >
          矩阵属性 (Settings)
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-center font-bold tracking-tight transition-all relative shrink-0 ${
            activeTab === 'preview'
              ? 'bg-[#252525] text-blue-400 border-b-2 border-blue-500'
              : 'text-[#888] hover:text-[#fff]'
          }`}
        >
          导出队列 (Output)
          {generatedVideos.length > 0 && (
            <span className="absolute top-2 right-4 bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-sm scale-90 text-[8px] leading-none">
              {generatedVideos.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' ? (
        /* Status dashboard overview */
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col justify-between text-[11px]">
          <div>
            {/* Permutation statistics displays */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-black p-2.5 rounded-sm border border-blue-900/40">
                <p className="text-[9px] text-[#888] font-bold uppercase tracking-wider">矩阵交叉变体</p>
                <p className="text-lg font-black font-mono text-blue-400 mt-0.5">
                  {possibleCount} <span className="text-[10px] font-normal text-gray-400">个实例</span>
                </p>
              </div>
              <div className="bg-black p-2.5 rounded-sm border border-[#222]">
                <p className="text-[9px] text-[#888] font-bold uppercase tracking-wider">预期视频时长</p>
                <p className="text-xs font-bold font-mono text-green-400 mt-2">
                  {totalMinDuration.toFixed(1)}s - {totalMaxDuration.toFixed(1)}s
                </p>
              </div>
            </div>

            {/* Checklist specification metrics */}
            <div className="space-y-2">
              <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-[#222] pb-1">
                矩阵参数状态表 (Parameters Check)
              </h3>

              <div className="flex items-center justify-between py-1 bg-black px-2 rounded-sm border border-[#222]">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Video className="w-3 h-3 text-blue-400" /> 视频分组材料:
                </span>
                <span className="font-mono text-[#E0E0E0] font-semibold">
                  {groups.length} 组/共 {groups.reduce((sum, g) => sum + g.videos.length, 0)} 素材
                </span>
              </div>

              <div className="flex items-center justify-between py-1 bg-black px-2 rounded-sm border border-[#222]">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-violet-400" /> 配音脚本:
                </span>
                <span className="font-mono text-[#E0E0E0] font-semibold">
                  {groups.filter(g => g.voiceoverText).length} / {groups.length} 编排
                </span>
              </div>

              <div className="bg-black p-2 rounded-sm border border-[#222] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Music className="w-3 h-3 text-green-400" /> 背景音乐 (Music):
                  </span>
                  <span className="text-[9.5px] text-green-400 font-bold">
                    {config.bgMusicId ? '已选定' : '未加载'}
                  </span>
                </div>
                <select
                  value={config.bgMusicId || ''}
                  onChange={(e) => onSelectMusic(e.target.value ? e.target.value : null)}
                  className="bg-[#1A1A1A] text-[#E0E0E0] border border-[#333] rounded-sm px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-blue-600 w-full"
                >
                  <option value="">[无背景音乐伴奏]</option>
                  {musicList.map(mus => (
                    <option key={mus.id} value={mus.id}>{mus.name}</option>
                  ))}
                </select>
              </div>

              {/* Subtitles custom controls summary */}
              <div className="flex items-center justify-between py-1 bg-black px-2 rounded-sm border border-[#222]">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-amber-400" /> 智能字幕:
                </span>
                <span className="text-[#E0E0E0] font-mono">
                  {config.subtitleStyle.fontSize}px • {config.subtitleStyle.color === '#ffff00' ? '黄色' : '黑色'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 bg-black px-2 rounded-sm border border-[#222] opacity-60">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-pink-400" /> 贴纸/背景尺寸:
                </span>
                <span className="capitalize text-[#E0E0E0] text-[9.5px]">
                  {config.canvasRatio} • {config.bgStyle === 'blur' ? '模糊模糊' : '纯黑背景'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Buttons */}
          <div className="mt-4 space-y-2 border-t border-[#222] pt-3">
            {isGenerating ? (
              <div className="bg-black border border-[#333] rounded-sm p-3 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-blue-400 font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>批渲染剪辑引擎运行中...</span>
                </div>
                <div className="w-full bg-[#252525] rounded-none h-1 overflow-hidden">
                  <div
                    style={{ width: `${generationProgress}%` }}
                    className="bg-blue-600 h-full transition-all duration-150"
                  ></div>
                </div>
                <p className="text-[9px] text-[#888] font-mono">融合音流声道及关键帧轨 {generationProgress}%</p>
              </div>
            ) : (
              <>
                {/* Single test sample buttons */}
                <button
                  onClick={onGenerateSingle}
                  disabled={hasEmptyGroup}
                  className="w-full py-1.5 bg-[#252525] hover:bg-[#333] border border-[#444] disabled:opacity-40 text-gray-200 hover:text-white transition-all font-semibold rounded-sm text-[10.5px] cursor-pointer flex items-center justify-center gap-1 px-2.5 hover:shadow-md"
                >
                  <Play className="w-3 h-3 fill-current" />
                  生成单条高精模拟预览片
                </button>

                {/* Batch Permutation Trigger block with adjustable compile sizes */}
                <div className="bg-black border border-[#222] p-2.5 rounded-sm text-center">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gray-400 text-[10px]">矩阵批量导出数量</span>
                    <input
                      type="number"
                      min="1"
                      max={possibleCount || 100}
                      value={batchCountInput}
                      onChange={(e) => setBatchCountInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 bg-[#1A1A1A] border border-[#333] rounded-sm py-0.5 text-center font-mono text-blue-400 font-bold focus:outline-none focus:border-blue-600 text-[10px]"
                    />
                  </div>
                  <button
                    onClick={handleBatchCompileClick}
                    disabled={hasEmptyGroup || possibleCount === 0}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10.5px] transition-all rounded-sm cursor-pointer shadow flex items-center justify-center gap-1 px-2.5 disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    高极速批量交叉合成 (Cross Mix)
                  </button>
                </div>
              </>
            )}

            {hasEmptyGroup && (
              <p className="text-[9px] text-amber-500/90 text-center select-none bg-amber-500/5 p-1.5 rounded-sm border border-amber-500/10 leading-tight">
                ⚠️ 注意：每一个片段分组必须至少有一个视频素材，才能组装高转化交叉流！
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Preview tab generated combinations directory */
        <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar text-[10px]">
          {generatedVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Sliders className="w-6 h-6 opacity-30 text-gray-400 mb-1.5" />
              <p>暂无混剪导出实例</p>
              <p className="text-[9px] text-gray-600 mt-0.5">设置分组编排后点击生成批量视频</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-gray-500 text-[9px] border-b border-[#222] pb-1 mb-1.5 font-mono">
                <span>导出序列名称</span>
                <span>跨组对齐特征码</span>
              </div>
              {generatedVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-[#1A1A1A] border border-[#333] hover:border-blue-900/50 p-2 rounded-sm flex flex-col justify-between hover:bg-[#222] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-200 text-[10.5px] truncate" title={video.name}>
                        {video.name}
                      </p>
                      <p className="text-[8.5px] text-gray-500 mt-0.5 font-mono">
                        共 {video.clips.length} 段 • {(video.totalDuration).toFixed(1)} 秒
                      </p>
                      
                      {/* Toggle-expand button for de-duplication report */}
                      {video.dedupSignatures && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => setExpandedVideoId(expandedVideoId === video.id ? null : video.id)}
                            className="flex items-center gap-1 text-[8.5px] bg-[#242424] hover:bg-[#2e2e2e] text-cyan-400 font-bold px-1.5 py-0.5 rounded border border-cyan-900/30 font-sans cursor-pointer transition-all"
                          >
                            <Shield className="w-2.5 h-2.5 text-cyan-400" />
                            <span>去重特征指纹</span>
                            {expandedVideoId === video.id ? (
                              <ChevronUp className="w-2.5 h-2.5 text-cyan-400" />
                            ) : (
                              <ChevronDown className="w-2.5 h-2.5 text-cyan-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-950/40 px-1 py-0.5 rounded-sm border border-blue-900/20 shrink-0">
                      [{video.combinationCode}]
                    </span>
                  </div>

                  {/* Anti-Repetitive Detail Diagnostics Panel */}
                  {expandedVideoId === video.id && video.dedupSignatures && (
                    <div className="mt-2 p-2 bg-black border border-[#222] rounded-sm text-[8.5px] space-y-1.5 text-gray-400 font-mono transition-all">
                      <div className="flex items-center gap-1 border-b border-[#222] pb-1.5 text-cyan-400 font-bold mb-1">
                        <Fingerprint className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>防搬运过审特征报告</span>
                      </div>
                      
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[#777] shrink-0">重造哈希 MD5:</span>
                        <span className="text-gray-300 text-right select-all truncate max-w-[140px] font-mono text-[8px]" title={video.dedupSignatures.appliedMD5}>
                          {video.dedupSignatures.appliedMD5}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#777]">画面镜像翻转:</span>
                        <span className={video.dedupSignatures.mirrored ? "text-emerald-400 font-bold bg-emerald-950/20 px-1 rounded-sm text-[8px]" : "text-gray-500"}>
                          {video.dedupSignatures.mirrored ? "已执行 (逃逸像素审查)" : "未翻转"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#777]">音画变速倍频:</span>
                        <span className="text-[#E0E0E0] font-bold">
                          {video.dedupSignatures.appliedSpeed}x (打乱时长结构)
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#777]">画质色彩偏移:</span>
                        <span className="text-[#E0E0E0]">
                          亮度: {video.dedupSignatures.brightnessAdjust} | 对比度: {video.dedupSignatures.contrastAdjust}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#777]">高频隐藏噪点:</span>
                        <span className={video.dedupSignatures.noiseInjected ? "text-emerald-400 font-bold bg-emerald-950/20 px-1 rounded-sm text-[8px]" : "text-gray-500"}>
                          {video.dedupSignatures.noiseInjected ? "1.2MHz 暗噪注入 (已启用)" : "未混入"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#777]">画框裁剪拉伸:</span>
                        <span className="text-[#E0E0E0]">
                          {video.dedupSignatures.croppedRatio}
                        </span>
                      </div>

                      <div className="flex justify-between text-amber-500/90 font-bold">
                        <span className="text-[#777] font-normal">尾部随机裁帧:</span>
                        <span>{video.dedupSignatures.frameTrimming}</span>
                      </div>
                    </div>
                  )}

                  {/* Playback sequence controls */}
                  <div className="flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-[#333] text-[9.5px]">
                    <button
                      onClick={() => onPlayGenerated(video)}
                      className="px-2 py-0.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-sm border border-blue-900/30 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      模拟合成预览
                    </button>
                    <a
                      href={video.clips[0]?.url || '#'}
                      download={video.name}
                      className="px-2 py-0.5 bg-[#252525] border border-[#3c3c3c] text-gray-300 rounded-sm hover:bg-[#333] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Download className="w-2.5 h-2.5" />
                      导出
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
