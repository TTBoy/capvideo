/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Video, Sparkles, Volume2, Trash2, Plus, MoveRight, Eye, Play, EyeOff, Bolt, CalendarRange, Scissors } from 'lucide-react';
import { Material, VideoGroup, TransitionType } from '../types';

interface GroupTimelineProps {
  groups: VideoGroup[];
  onAddGroup: () => void;
  onRemoveGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, updatedFields: Partial<VideoGroup>) => void;
  onRemoveClipFromGroup: (groupId: string, matId: string) => void;
  materialsList: Material[];
}

export default function GroupTimeline({
  groups,
  onAddGroup,
  onRemoveGroup,
  onUpdateGroup,
  onRemoveClipFromGroup,
  materialsList
}: GroupTimelineProps) {
  const [activeTransitionPopover, setActiveTransitionPopover] = useState<string | null>(null);
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);

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

  const voices = [
    { id: 'Zephyr', name: 'Zephyr 智能女清' },
    { id: 'Puck', name: 'Puck 洒脱男中' },
    { id: 'Kore', name: 'Kore 温婉女中' },
    { id: 'Charon', name: 'Charon 磁性成熟' },
    { id: 'Fenrir', name: 'Fenrir 浑厚男低' }
  ];

  const handleUpdateTransition = (groupId: string, type: TransitionType) => {
    onUpdateGroup(groupId, {
      transition: { type, duration: 0.5 }
    });
    setActiveTransitionPopover(null);
  };

  return (
    <div id="timeline-tracks-container" className="flex flex-col bg-[#0F0F0F] border-t border-[#333] p-3 overflow-x-auto select-none flex-1 min-h-[300px]">
      {/* Track Stats strip */}
      <div className="flex items-center justify-between mb-2 text-[11px] text-gray-400">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase text-gray-400 tracking-wider">混剪编排轨道 (Combination Tracks)</span>
          <span className="px-2 py-0.5 rounded-sm bg-black text-blue-400 font-mono text-[10px] border border-blue-900/40">
            预计视频时长范围: {totalMinDuration.toFixed(1)}s - {totalMaxDuration.toFixed(1)}s
          </span>
        </div>
        <button
          onClick={onAddGroup}
          className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-sm shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          + 添加全新分组
        </button>
      </div>

      {/* Horizontal List of Columns */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2 custom-scrollbar min-h-[220px]">
        {groups.map((group, idx) => {
          const groupDurationMin = group.videos.length > 0 ? Math.min(...group.videos.map(v => v.duration)) : 0;
          const groupDurationMax = group.videos.length > 0 ? Math.max(...group.videos.map(v => v.duration)) : 0;
          
          return (
            <React.Fragment key={group.id}>
              {/* Group Column container */}
              <div className="w-[300px] flex-shrink-0 bg-[#1A1A1A] border border-[#333] rounded-sm flex flex-col justify-between">
                {/* Header info */}
                <div className="p-2 border-b border-[#222] bg-[#252525] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-blue-400 bg-blue-950/45 px-1.5 py-0.5 rounded-sm border border-blue-900/30 font-bold">
                      G-{idx + 1} ({group.videos.length} clips)
                    </span>
                    
                    {editingGroupNameId === group.id ? (
                      <input
                        type="text"
                        defaultValue={group.name}
                        autoFocus
                        onBlur={(e) => {
                          onUpdateGroup(group.id, { name: e.target.value || `分组 ${idx + 1}` });
                          setEditingGroupNameId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateGroup(group.id, { name: e.currentTarget.value || `分组 ${idx + 1}` });
                            setEditingGroupNameId(null);
                          }
                        }}
                        className="text-[10px] bg-black text-[#E0E0E0] px-1 py-0.5 rounded-sm border border-blue-600 focus:outline-none w-[100px]"
                      />
                    ) : (
                      <span
                        onClick={() => setEditingGroupNameId(group.id)}
                        className="text-[10.5px] font-bold text-gray-200 cursor-pointer hover:text-blue-400 truncate max-w-[120px]"
                        title="双击重命名"
                      >
                        {group.name}
                      </span>
                    )}
                  </div>

                  {/* Standard top buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateGroup(group.id, { soundEnabled: !group.soundEnabled })}
                      className={`p-1 rounded-sm text-[10px] transition-colors ${group.soundEnabled ? 'text-green-400 bg-green-950/25' : 'text-gray-500 hover:text-gray-300'}`}
                      title={group.soundEnabled ? "原音已开启" : "原音关闭"}
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveGroup(group.id)}
                      className="p-1 rounded-sm text-gray-500 hover:text-rose-500 transition-colors"
                      title="删除这组"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Grid list of videos in this category */}
                <div className="flex-1 p-2 overflow-y-auto max-h-[140px] custom-scrollbar bg-black/45 flex flex-col gap-1.5">
                  {group.videos.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-3 border border-dashed border-[#333] rounded-sm bg-black/25 h-20 text-center">
                      <Video className="w-4 h-4 text-gray-600 mb-0.5" />
                      <p className="text-[9.5px] text-gray-500">空的分片编排槽</p>
                      <p className="text-[8.5px] text-[#555] mt-0.5">加载左侧媒体即可装配</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {group.videos.map((vid) => (
                        <div
                          key={vid.id}
                          className="relative aspect-video bg-black rounded-sm border border-[#333] overflow-hidden group/mini"
                        >
                          <img
                            src={vid.thumbnail}
                            alt=""
                            className="w-full h-full object-cover opacity-85 group-hover/mini:opacity-100 transition-all cursor-pointer"
                            referrerPolicy="no-referrer"
                          />
                          {vid.startTime !== undefined && vid.endTime !== undefined && (
                            <span className="absolute top-0.5 left-0.5 bg-blue-600/95 text-white text-[7px] px-1 py-0.5 font-black flex items-center gap-0.5 rounded-sm shadow select-none scale-[0.85] origin-top-left">
                              <Scissors className="w-2 h-2" />
                              分块 {vid.startTime.toFixed(1)}s-{vid.endTime.toFixed(1)}s
                            </span>
                          )}
                          <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-0.5 rounded-sm text-[8px] font-mono text-gray-400 scale-[0.85]">
                            {vid.duration}s
                          </span>

                          {/* Quick delete clip overlay */}
                          <button
                            onClick={() => onRemoveClipFromGroup(group.id, vid.id)}
                            className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-black/75 rounded flex items-center justify-center hover:bg-rose-600 text-white transition-colors opacity-0 group-hover/mini:opacity-100 text-[10px]"
                            title="移出此组"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitle / Script Dubbing lane footer */}
                <div className="p-2 bg-[#1F1F1F] border-t border-[#333] text-[9.5px] flex flex-col gap-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="flex items-center gap-1 font-bold text-gray-300">
                      <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                      口播配音 & 字幕轨道
                    </span>

                    {/* Speaker choosing dropdown mapping */}
                    <select
                      value={group.voiceoverVoice}
                      onChange={(e) => onUpdateGroup(group.id, { voiceoverVoice: e.target.value })}
                      className="bg-black text-[#E0E0E0] border border-[#333] text-[9px] rounded-sm px-1 py-0.5 focus:outline-none"
                    >
                      {voices.map(voice => (
                        <option key={voice.id} value={voice.id}>{voice.name}</option>
                      ))}
                    </select>
                  </div>

                  {group.voiceoverText ? (
                    <div className="bg-black p-1.5 rounded-sm border border-[#222] flex flex-col gap-0.5">
                      <p className="text-gray-300 line-clamp-2 text-[9px] leading-tight select-text">
                        "{group.voiceoverText}"
                      </p>
                      
                      {group.voiceoverAudioUrl && (
                        <div className="flex items-center gap-1 mt-0.5 text-[8.5px] text-green-400 font-medium">
                          <Play className="w-2 h-2 fill-current" />
                          <span>已生成 TTS 配音轨道</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 italic text-[9px]">
                      无配音内容，请点击配音生成智能撰稿
                    </p>
                  )}
                </div>
              </div>

              {/* Intercom transitions selector Handle ⋈ */}
              {idx < groups.length - 1 && (
                <div className="flex items-center relative py-10">
                  <div className="w-0 flex items-center justify-center z-10">
                    <button
                      onClick={() => setActiveTransitionPopover(
                        activeTransitionPopover === group.id ? null : group.id
                      )}
                      className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all shadow-md ${
                        group.transition.type !== 'none'
                          ? 'bg-blue-600 border-blue-500 text-white font-bold hover:scale-105'
                          : 'bg-[#252525] border-[#333] text-gray-400 hover:text-white'
                      }`}
                      title="自定义片段间转场动作"
                    >
                      <span className="text-[10px] leading-none">⋈</span>
                    </button>
                  </div>

                  {/* Settings dialog box popover */}
                  {activeTransitionPopover === group.id && (
                    <div className="absolute w-[180px] bg-[#1F1F1F] border border-[#333] rounded-sm shadow-2xl p-2 top-1/2 -translate-y-1/2 left-4 z-40 text-xs text-[#E0E0E0]">
                      <p className="font-bold text-gray-200 border-b border-[#333] pb-1 mb-1.5 text-[10px]">
                        片段转场动效 (Transition)
                      </p>
                      <div className="grid grid-cols-2 gap-1 mb-1.5">
                        {['none', 'fade', 'zoom', 'slide'].map(t => (
                          <button
                            key={t}
                            onClick={() => handleUpdateTransition(group.id, t as any)}
                            className={`px-1 py-0.5 text-center rounded-sm capitalize text-[9.5px] ${
                              group.transition.type === t
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-black hover:bg-[#252525] text-gray-300'
                            }`}
                          >
                            {t === 'none' ? '无' : (t === 'fade' ? '淡入淡出' : (t === 'zoom' ? '自动缩放' : '横向滑屏'))}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-gray-500 mt-1">
                        <span>效果时长</span>
                        <span className="font-mono text-blue-400 font-bold">{group.transition.duration}s</span>
                      </div>
                    </div>
                  )}

                  {/* visual connection strip */}
                  <div className="w-6 border-b border-dashed border-[#333]"></div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Append new empty group column card wrapper */}
        <div
          onClick={onAddGroup}
          className="w-[120px] shrink-0 border-2 border-dashed border-[#333] hover:border-blue-500/50 rounded-sm flex flex-col items-center justify-center p-6 text-gray-500 hover:text-blue-400 cursor-pointer transition-all bg-[#141414] hover:bg-[#1A1A1A] min-h-[220px]"
        >
          <Plus className="w-5 h-5 mb-1 opacity-70" />
          <span className="text-xs font-semibold">追加分组</span>
          <span className="text-[9px] text-gray-600 mt-1">增加视频节点</span>
        </div>
      </div>
    </div>
  );
}
