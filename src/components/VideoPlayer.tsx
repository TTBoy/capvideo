import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Monitor, Layers, Scissors, Trash2, Plus } from 'lucide-react';
import { Material, SubtitleStyle, VideoGroup } from '../types';

interface VideoPlayerProps {
  activeMaterial: Material | null;
  activeSequence: {
    clips: Material[];
    subtitles: { text: string; start: number; end: number }[];
    voiceovers: { url: string; start: number; duration: number }[];
    bgMusicUrl: string | null;
  } | null;
  subtitleStyle: SubtitleStyle;
  originalVolume: number;
  bgMusicVolume: number;
  
  // Custom segment splitting props
  groups?: VideoGroup[];
  onAddSegmentToGroup?: (original: Material, start: number, end: number, groupIndex: number) => void;
  onRemoveClipFromGroup?: (groupId: string, clipId: string) => void;
}

interface SplitSegment {
  id: string;
  start: number;
  end: number;
  label: string;
}

export default function VideoPlayer({
  activeMaterial,
  activeSequence,
  subtitleStyle,
  originalVolume,
  bgMusicVolume,
  groups = [],
  onAddSegmentToGroup,
  onRemoveClipFromGroup
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);

  // Local segments state for splitting the original video asset
  const [segments, setSegments] = useState<SplitSegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [assignGroupIndex, setAssignGroupIndex] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSequenceMode = !!activeSequence;
  const mediaUrl = isSequenceMode 
    ? (activeSequence.clips[0]?.url || '') 
    : (activeMaterial?.url || '');

  // Initialize segments whenever a material is loaded
  useEffect(() => {
    if (isSequenceMode) return;
    if (activeMaterial) {
      const parentDur = activeMaterial.duration || 10;
      setDuration(parentDur);
      
      // Look for any existing segments inside current groups
      const existing: SplitSegment[] = [];
      groups.forEach((g) => {
        g.videos.forEach((v) => {
          if (v.parentId === activeMaterial.id && v.startTime !== undefined && v.endTime !== undefined) {
            existing.push({
              id: `${v.id}-local`,
              start: v.startTime,
              end: v.endTime,
              label: `段 ${existing.length + 1}`
            });
          }
        });
      });

      if (existing.length > 0) {
        existing.sort((a, b) => a.start - b.start);
        setSegments(
          existing.map((s, idx) => ({ ...s, label: `片段 ${idx + 1}` }))
        );
      } else {
        // Fallback to full duration segment
        setSegments([
          { id: 'full-seg', start: 0, end: parentDur, label: '完整镜头' }
        ]);
      }
      setSelectedSegmentId('full-seg');
    } else {
      setSegments([]);
      setSelectedSegmentId(null);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  }, [activeMaterial, isSequenceMode]);

  // Adjust standard video playback limits & sequential loading
  useEffect(() => {
    if (isSequenceMode && activeSequence) {
      const tot = activeSequence.clips.reduce((sum, item) => sum + (item.duration || 5), 0);
      setDuration(tot);
    } else if (activeMaterial) {
      setDuration(activeMaterial.duration || 10);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  }, [activeMaterial, activeSequence, isSequenceMode]);

  // Handle HTML5 video events
  useEffect(() => {
    const videoObj = videoRef.current;
    if (videoObj) {
      videoObj.volume = isMuted ? 0 : (originalVolume / 100);
      if (isPlaying && !isSequenceMode) {
        videoObj.play().catch(() => {});
      } else {
        videoObj.pause();
      }
    }
  }, [isPlaying, mediaUrl, isMuted, originalVolume, isSequenceMode]);

  // Synchronise frame animation timers
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now() - (currentTime * 1000);
      
      const tick = () => {
        const delta = (performance.now() - startTimeRef.current) / 1000;
        
        if (delta >= duration) {
          setCurrentTime(duration);
          setIsPlaying(false);
          if (videoRef.current) videoRef.current.currentTime = 0;
        } else {
          setCurrentTime(delta);
          
          if (isSequenceMode && activeSequence) {
            let clipStart = 0;
            let currentClipIdx = 0;
            for (let i = 0; i < activeSequence.clips.length; i++) {
              const clipDur = activeSequence.clips[i].duration || 5;
              if (delta >= clipStart && delta < clipStart + clipDur) {
                currentClipIdx = i;
                break;
              }
              clipStart += clipDur;
            }

            const activeClip = activeSequence.clips[currentClipIdx];
            if (activeClip && videoRef.current && videoRef.current.src !== activeClip.url) {
              videoRef.current.src = activeClip.url;
              const clipOffset = activeClip.startTime !== undefined ? activeClip.startTime : 0;
              const offset = delta - clipStart;
              videoRef.current.currentTime = clipOffset + offset;
              videoRef.current.volume = isMuted ? 0 : (originalVolume / 100);
              videoRef.current.play().catch(() => {});
            } else if (videoRef.current && activeClip) {
              const clipOffset = activeClip.startTime !== undefined ? activeClip.startTime : 0;
              const offset = delta - clipStart;
              const targetLocalTime = clipOffset + offset;
              if (Math.abs(videoRef.current.currentTime - targetLocalTime) > 0.5) {
                videoRef.current.currentTime = targetLocalTime;
              }
            }
          } else if (videoRef.current) {
            // Trim boundary restriction preview for selected segment in single mode
            const activeSelSeg = segments.find(s => s.id === selectedSegmentId);
            if (activeSelSeg && activeSelSeg.id !== 'full-seg') {
              // Lock play between [start, end]
              if (videoRef.current.currentTime >= activeSelSeg.end) {
                videoRef.current.currentTime = activeSelSeg.start;
                startTimeRef.current = performance.now() - (activeSelSeg.start * 1000);
                setCurrentTime(activeSelSeg.start);
              }
            }

            if (Math.abs(videoRef.current.currentTime - delta) > 0.4) {
              videoRef.current.currentTime = delta;
            }
          }

          requestRef.current = requestAnimationFrame(tick);
        }
      };

      requestRef.current = requestAnimationFrame(tick);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, duration, isSequenceMode, activeSequence, isMuted, originalVolume, segments, selectedSegmentId]);

  // Coordinate Subtitles text display based on current frame position
  useEffect(() => {
    if (isSequenceMode && activeSequence) {
      const activeSub = activeSequence.subtitles.find(
        sub => currentTime >= sub.start && currentTime < sub.end
      );
      setActiveSubtitle(activeSub ? activeSub.text : null);
    } else {
      setActiveSubtitle(null);
    }
  }, [currentTime, activeSequence, isSequenceMode]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleSeek = (timeSec: number) => {
    const bounded = Math.max(0, Math.min(duration, timeSec));
    setCurrentTime(bounded);
    if (videoRef.current && !isSequenceMode) {
      videoRef.current.currentTime = bounded;
    }
    if (isPlaying) {
      startTimeRef.current = performance.now() - (bounded * 1000);
    }
  };

  const handleSeekRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSeek(parseFloat(e.target.value));
  };

  // Split segment at current playhead position
  const handleSplitAtPlayhead = () => {
    if (!activeMaterial || isSequenceMode) return;
    
    // Find segment that contains playhead
    const targetIdx = segments.findIndex(s => currentTime >= s.start && currentTime <= s.end);
    if (targetIdx === -1) return;

    const target = segments[targetIdx];
    // Check minimal margin separation of 0.2s
    if (currentTime - target.start < 0.2 || target.end - currentTime < 0.2) {
      return;
    }

    const newSegments = [...segments];
    const segA: SplitSegment = {
      id: `${target.id}-split-a-${Date.now()}`,
      start: target.start,
      end: currentTime,
      label: ''
    };
    const segB: SplitSegment = {
      id: `${target.id}-split-b-${Date.now()}`,
      start: currentTime,
      end: target.end,
      label: ''
    };

    // Swap target for A and B
    newSegments.splice(targetIdx, 1, segA, segB);
    newSegments.sort((a,b) => a.start - b.start);

    // Reindex labels
    const relabeled = newSegments.map((s, i) => ({
      ...s,
      label: `片段 ${i + 1}`
    }));

    setSegments(relabeled);
    setSelectedSegmentId(segA.id);
  };

  // Merge split segments / reset splits
  const handleResetSplits = () => {
    if (!activeMaterial) return;
    setSegments([
      { id: 'full-seg', start: 0, end: duration, label: '完整镜头' }
    ]);
    setSelectedSegmentId('full-seg');
  };

  // Add the selected split chunk to chosen group compile timeline
  const handleAssignToGroup = () => {
    if (!activeMaterial || !onAddSegmentToGroup) return;
    const activeSeg = segments.find(s => s.id === selectedSegmentId);
    if (!activeSeg) return;

    onAddSegmentToGroup(activeMaterial, activeSeg.start, activeSeg.end, assignGroupIndex);
  };

  const formattedTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  // Get current timeline assignments for active original video asset
  const getAssignedDetails = () => {
    if (!activeMaterial) return [];
    const usageList: { id: string; groupId: string; groupName: string; start: number; end: number }[] = [];
    groups.forEach((g) => {
      g.videos.forEach((v) => {
        if (v.parentId === activeMaterial.id) {
          usageList.push({
            id: v.id,
            groupId: g.id,
            groupName: g.name,
            start: v.startTime !== undefined ? v.startTime : 0,
            end: v.endTime !== undefined ? v.endTime : v.duration
          });
        }
      });
    });
    return usageList;
  };

  const assignedDetails = getAssignedDetails();
  const activeSelectedSeg = segments.find(s => s.id === selectedSegmentId);

  return (
    <div id="video-player-component" className="flex flex-col bg-[#0A0A0A] border-b border-[#333] min-h-[415px] relative select-none">
      
      {/* Top Main Split Panel: Player Frame (Left) + Material usage/segments allocator (Right) */}
      <div className="flex-1 flex min-h-0 border-b border-[#252525]">
        
        {/* Playback Viewport Screen Frame */}
        <div className="flex-1 relative flex items-center justify-center p-2 bg-black border-r border-[#222]">
          <div className="relative h-[250px] aspect-[9/16] bg-black rounded-sm shadow-2xl overflow-hidden flex items-center justify-center border border-[#1A1A1A]">
            {mediaUrl ? (
              <video
                ref={videoRef}
                src={mediaUrl}
                crossOrigin="anonymous"
                className="w-full h-full object-cover transition-all"
                onClick={togglePlay}
                playsInline
                muted={isMuted}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-500 p-6 text-center">
                <Monitor className="w-10 h-10 text-gray-600 mb-1" />
                <div>
                  <p className="text-[11px] font-bold text-gray-300">等候装载媒体</p>
                  <p className="text-[8.5px] text-gray-500 mt-0.5">选择左侧素材即可载入口播分块流</p>
                </div>
              </div>
            )}

            {/* Custom Interactive Overlays */}
            {activeSubtitle && (
              <div className="absolute bottom-12 left-2 right-2 flex justify-center text-center select-none pointer-events-none" style={{ zIndex: 10 }}>
                <span
                  style={{
                    fontFamily: subtitleStyle.fontFamily || 'sans-serif',
                    fontSize: `${subtitleStyle.fontSize || 13}px`,
                    color: subtitleStyle.color || '#ffff00',
                    backgroundColor: subtitleStyle.bgColor ? `${subtitleStyle.bgColor}dc` : 'transparent',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    fontWeight: subtitleStyle.bold ? 'bold' : 'normal',
                    textShadow: subtitleStyle.stroke ? '2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000' : 'none'
                  }}
                  className="max-w-full block whitespace-normal"
                >
                  {activeSubtitle}
                </span>
              </div>
            )}

            {isSequenceMode && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-blue-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-sm shadow-md border border-blue-500/50">
                <Layers className="w-2.5 h-2.5" />
                AUTO 组合编译模拟
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Usage status Dashboard & block allocate inputs details */}
        {!isSequenceMode && activeMaterial ? (
          <div className="w-[200px] h-full bg-[#111] overflow-y-auto custom-scrollbar p-2.5 flex flex-col justify-between border-l border-[#222]">
            <div>
              {/* Header Title */}
              <div className="border-b border-[#222] pb-1.5 mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  素材使用情况 ({assignedDetails.length})
                </p>
                <p className="text-[8px] text-gray-600 mt-0.5">
                  已分配 {assignedDetails.length} 个片段进入交叉组
                </p>
              </div>

              {/* Dynamic Assignments List */}
              {assignedDetails.length === 0 ? (
                <p className="text-[9px] text-[#555] italic py-2">
                  该原件素材暂未在编排中被裁剪、分配使用
                </p>
              ) : (
                <div className="space-y-1 max-h-[120px] overflow-y-auto custom-scrollbar mb-4">
                  {assignedDetails.map((usage) => (
                    <div
                      key={usage.id}
                      className="bg-black border border-[#222] rounded-sm p-1.5 flex items-center justify-between text-[9px] hover:border-blue-900/40"
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="text-gray-400 font-mono text-[8px] leading-none">
                          {usage.start.toFixed(1)}s - {usage.end.toFixed(1)}s
                        </p>
                        <p className="text-gray-300 font-bold truncate mt-1">
                          {usage.groupName}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemoveClipFromGroup && onRemoveClipFromGroup(usage.groupId, usage.id)}
                        className="p-1 hover:bg-rose-950/40 text-gray-500 hover:text-rose-500 rounded-sm cursor-pointer ml-1 flex-shrink-0"
                        title="移出此分组"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Fragment Selection controller */}
              <div className="border-t border-[#222] pt-2 mt-2">
                <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  当前选中分块:
                </p>
                {activeSelectedSeg ? (
                  <div className="bg-black border border-[#222] p-2 rounded-sm space-y-2">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-blue-400 font-bold">{activeSelectedSeg.label}</span>
                      <span className="font-mono text-gray-400">
                        {activeSelectedSeg.start.toFixed(1)}s-{activeSelectedSeg.end.toFixed(1)}s
                      </span>
                    </div>

                    {/* Target Dropdown block assignment and append hook */}
                    <div className="space-y-1.5">
                      <select
                        value={assignGroupIndex}
                        onChange={(e) => setAssignGroupIndex(parseInt(e.target.value))}
                        className="w-full bg-[#1A1A1A] text-gray-300 border border-[#333] text-[9.5px] rounded-sm py-1 px-1 focus:outline-none focus:border-blue-700 font-bold"
                      >
                        {groups.map((g, idx) => (
                          <option key={g.id} value={idx}>
                            第 {idx + 1} 幕: {g.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssignToGroup}
                        className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9.5px] flex items-center justify-center gap-1 rounded-sm cursor-pointer shadow-sm transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        分配此分块到选定幕
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[8.5px] text-[#555] italic">在底部轨道上点击选择一个分块进行分配</p>
                )}
              </div>
            </div>

            {/* Timings console controls */}
            <div className="border-t border-[#222] pt-2 mt-2 flex items-center justify-between text-[8px] text-gray-500">
              <span>矩阵智能口播分块剪辑</span>
              <button
                onClick={handleResetSplits}
                className="text-amber-500/80 hover:text-amber-400 hover:underline text-[8px] cursor-pointer"
              >
                还原分块设置
              </button>
            </div>
          </div>
        ) : (
          <div className="w-[200px] h-full bg-[#111] p-3 text-center flex flex-col justify-center items-center border-l border-[#222]">
            <Monitor className="w-8 h-8 text-gray-600 mb-1" />
            <p className="text-[10px] font-bold text-gray-400">矩阵融合模拟中</p>
            <p className="text-[8px] text-gray-500 mt-1 max-w-[150px] leading-relaxed">
              正在运行仿真测试，模拟每个排列生成。
            </p>
          </div>
        )}
      </div>

      {/* Visual Splits Ruler Track: Tick Indicators, Filmstrip chunks overlay, markers */}
      {!isSequenceMode && activeMaterial ? (
        <div className="h-[95px] bg-[#0E0E0E] flex flex-col justify-between p-1.5 relative border-t border-[#252525]">
          
          {/* Ruler tick indicators */}
          <div className="h-3.5 relative border-b border-[#222] select-none text-[8px] font-mono text-gray-500">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, sec) => {
              const leftPercent = (sec / duration) * 100;
              if (leftPercent > 100) return null;
              return (
                <div
                  key={sec}
                  style={{ left: `${leftPercent}%` }}
                  className="absolute -translate-x-1/2 bottom-0 flex flex-col items-center"
                >
                  <span className="text-[7.5px] leading-tight font-black font-mono">
                    {sec}s
                  </span>
                  <span className="w-[1px] h-1 bg-[#333] mt-0.5"></span>
                </div>
              );
            })}
          </div>

          {/* Core filmstrip flex blocks track */}
          <div className="flex-1 relative flex items-center bg-[#070707] border border-[#222] overflow-hidden my-1 rounded-sm">
            
            {/* Visual segments representation */}
            <div className="absolute inset-0 flex items-stretch w-full select-none">
              {segments.map((seg, idx) => {
                const isSelected = seg.id === selectedSegmentId;
                const widthPercent = ((seg.end - seg.start) / duration) * 100;

                return (
                  <div
                    key={seg.id}
                    onClick={() => {
                      setSelectedSegmentId(seg.id);
                      handleSeek(seg.start);
                    }}
                    style={{ width: `${widthPercent}%` }}
                    className={`relative border-r border-[#222] h-full flex flex-col justify-between p-1.5 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-600/15 border-blue-500 shadow-[inset_0_0_8px_rgba(59,130,246,0.25)] z-10 border-l-2' 
                        : 'bg-[#121212] hover:bg-[#161616]'
                    }`}
                  >
                    {/* Render visual filmstrip thumbnails frame sequence backgrounds */}
                    <div className="absolute inset-0 flex overflow-hidden opacity-10 pointer-events-none select-none">
                      {Array.from({ length: 6 }).map((_, frameIdx) => (
                        <img
                          key={frameIdx}
                          src={activeMaterial.thumbnail}
                          className="h-full aspect-video object-cover shrink-0"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>

                    <div className="relative text-[8.5px] font-black text-gray-200 flex items-center justify-between pointer-events-none select-none z-10 leading-none">
                      <span className={isSelected ? "text-blue-400 font-extrabold" : "text-gray-300"}>
                        {seg.label}
                      </span>
                      <span className="text-[7.5px] text-gray-400 font-mono font-bold">
                        {(seg.end - seg.start).toFixed(1)}s
                      </span>
                    </div>

                    {/* Clip bounds indicator on block */}
                    <div className="relative text-[7.5px] font-mono text-gray-500 font-semibold pointer-events-none select-none z-10 leading-none">
                      {seg.start.toFixed(2)} - {seg.end.toFixed(2)}s
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Seeking yellow playhead line indicator */}
            <div
              style={{ left: `${(currentTime / duration) * 100}%` }}
              className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-20 pointer-events-none shadow-[0_0_6px_rgba(245,158,11,0.8)]"
            >
              <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full border border-black shadow"></div>
            </div>
          </div>

          {/* Quick controls panel at the timeline footer */}
          <div className="h-5 flex items-center justify-between text-[#888]">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] bg-black px-1.5 py-0.5 rounded-sm border border-[#222] font-mono text-gray-400">
                总时长: {(duration).toFixed(1)}s
              </span>
              <span className="text-[8px] bg-black px-1.5 py-0.5 rounded-sm border border-[#222] font-mono text-amber-400 font-bold">
                当前游标: {currentTime.toFixed(2)}s
              </span>
            </div>

            {/* Scissor split trigger */}
            <button
              onClick={handleSplitAtPlayhead}
              className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm text-[9px] flex items-center gap-0.5 shadow-sm hover:shadow-md cursor-pointer transition-colors"
              title="在下方游标所在刻度切断本段，将其分为两个小块"
            >
              <Scissors className="w-2.5 h-2.5" />
              <span>在此游标处剪切 (Split)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Legacy control timeline range when active playback combo sequence */
        <div className="h-[45px] bg-[#111] px-3 py-1.5 flex flex-col justify-center border-t border-[#222] select-none text-[#E0E0E0]">
          {/* Seek track overlay */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-blue-400 font-bold">{formattedTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 10}
              step="0.05"
              value={currentTime}
              onChange={handleSeekRange}
              className="flex-1 accent-blue-500 bg-[#252525] rounded-none h-1 cursor-pointer appearance-none transition-all hover:bg-[#333]"
            />
            <span className="text-[9px] font-mono text-gray-500">{formattedTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Buttons Action console bar */}
      <div className="bg-[#161616] border-t border-[#252525] px-3 py-1.5 flex items-center justify-between text-[#888] select-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            disabled={!mediaUrl}
            className={`p-1 px-2.5 rounded-sm cursor-pointer transition-all text-[9.5px] font-bold flex items-center gap-1 ${
              isPlaying 
              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-900/30' 
              : 'bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 border border-blue-900/30'
            } disabled:opacity-30`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-2.5 h-2.5 fill-current" />
                暂停播放
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                播放试听段
              </>
            )}
          </button>

          <button
            onClick={() => handleSeek(0)}
            disabled={!mediaUrl}
            className="p-1 px-1.5 text-gray-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
            title="回到开头"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        <div className="text-[9px] text-[#A0A0A0] font-bold">
          {isSequenceMode 
            ? '交叉矩阵仿真融合试听中' 
            : activeMaterial 
              ? `剪辑中: ${activeMaterial.name}` 
              : '等候选择素材'
          }
        </div>

        <div className="flex items-center gap-1.5 text-[8.5px]">
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer pr-0"
          >
            {isMuted ? <VolumeX className="w-3 text-rose-500" /> : <Volume2 className="w-3 text-green-500" />}
          </button>
          <span>伴奏音:{bgMusicVolume}% / 旁白音:{originalVolume}%</span>
        </div>
      </div>
    </div>
  );
}
