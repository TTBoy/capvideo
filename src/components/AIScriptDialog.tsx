/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Loader2, X, Speech, Check, MessageSquareCode } from 'lucide-react';
import { VideoGroup } from '../types';

interface AIScriptDialogProps {
  groups: VideoGroup[];
  isOpen: boolean;
  onClose: () => void;
  onApplyScripts: (scripts: string[]) => void;
  onSynthesizeTTS: (groupId: string, text: string, voice: string) => Promise<string | null>;
}

export default function AIScriptDialog({
  groups,
  isOpen,
  onClose,
  onApplyScripts,
  onSynthesizeTTS
}: AIScriptDialogProps) {
  const [theme, setTheme] = useState('京东年中大促，工控直发爆便宜');
  const [keypoints, setKeypoints] = useState('突出正品保障、闪电发货、限时买一送一福利、低至五折优惠');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<string[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedDrafts([]);

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          keypoints,
          groupCount: groups.length,
          groupNames: groups.map(g => g.name)
        }),
      });

      if (!response.ok) {
        throw new Error('Script generation failed');
      }

      const data = await response.json();
      if (data.scripts) {
        setGeneratedDrafts(data.scripts);
      }
    } catch (err) {
      console.error(err);
      // Local graceful simulation scripts mapping
      const localSim = groups.map((g, idx) => {
        if (idx === 0) return `天呐！这款爆款"${theme}"简直是不可多得的神仙好物！`;
        if (idx === 1) return `它完美支持核心特点：${keypoints}，买到就是赚到！`;
        return `现在下单直发包邮，赶紧戳屏幕下方链接抢购吧！`;
      });
      setGeneratedDrafts(localSim);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (generatedDrafts.length === 0) return;
    
    // Apply copywriting scripts
    onApplyScripts(generatedDrafts);

    // Promptly synthesising real-time audio voiceovers sequentially for each group!
    setIsSynthesizing(true);
    try {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const textToSynth = generatedDrafts[i];
        if (textToSynth) {
          // Perform TTS Generation sequentially
          await onSynthesizeTTS(group.id, textToSynth, group.voiceoverVoice || 'Zephyr');
        }
      }
    } catch (error) {
      console.error('Sequentially sync voiceover failure:', error);
    } finally {
      setIsSynthesizing(false);
      onClose();
    }
  };

  return (
    <div id="ai-script-dialog-modal" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl bg-[#141414] border border-[#333] rounded-sm shadow-2xl overflow-hidden text-[#E0E0E0] flex flex-col max-h-[90vh]">
        
        {/* Title Bar */}
        <div className="p-3 bg-[#1A1A1A] border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>AI 智能矩阵口播与配音合成器 (Gemini SDK)</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 custom-scrollbar text-[11px]">
          
          <div className="space-y-1">
            <label className="block text-gray-400 font-bold">矩阵营销项目主题</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例如：工厂直营爆便宜、带货直播间引流口播"
              className="w-full bg-black border border-[#333] rounded-sm px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-blue-600 text-[10.5px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-gray-400 font-bold">核心卖点描述 (Keypoints)</label>
            <textarea
              rows={2}
              value={keypoints}
              onChange={(e) => setKeypoints(e.target.value)}
              placeholder="写下商品核心卖点、限时促销福利，大模型将智能穿插配置到各个镜头序列。"
              className="w-full bg-black border border-[#333] rounded-sm px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-blue-600 h-14 resize-none text-[10.5px]"
            />
          </div>

          {/* Setup review columns */}
          <div className="space-y-1.5 bg-black p-2.5 rounded-sm border border-[#222]">
            <p className="font-bold text-gray-400 text-[9.5px] uppercase tracking-wider">预期脚本承接节点 ({groups.length} 幕)</p>
            <div className="flex items-center gap-1.5 overflow-x-auto text-[9px] pb-1 font-mono">
              {groups.map((g, i) => (
                <div key={g.id} className="bg-[#1A1A1A] border border-[#333] px-2 py-0.5 rounded-sm whitespace-nowrap">
                  第 {i + 1} 幕: <span className="text-blue-400 font-bold">{g.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Render Result segment drafts */}
          {generatedDrafts.length > 0 && (
            <div className="space-y-2 bg-black p-3 rounded-sm border border-[#222]">
              <h4 className="font-bold text-gray-300 flex items-center gap-1 text-[10px] uppercase">
                <MessageSquareCode className="w-3.5 h-3.5 text-blue-400" />
                智能生成的分片段落稿:
              </h4>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                {generatedDrafts.map((draft, idx) => (
                  <div key={idx} className="bg-[#1A1A1A] border border-[#333] p-2 rounded-sm">
                    <p className="text-[#888] font-mono text-[8px] mb-0.5 font-bold">【{groups[idx]?.name || `分片段落 ${idx + 1}`}】</p>
                    <p className="text-[10px] italic text-[#E0E0E0] leading-snug">"{draft}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls bar */}
        <div className="p-3 bg-[#1A1A1A] border-t border-[#333] flex items-center justify-between">
          <p className="text-[9px] text-[#888] font-mono">
            {isSynthesizing ? '全自动多节点伴奏配音合轨中...' : 'Powered by Gemini & Smart TTS synthesis'}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isGenerating || isSynthesizing}
              className="px-3.5 py-1 bg-[#252525] border border-[#3c3c3c] text-gray-300 rounded-sm hover:bg-[#333] hover:text-white cursor-pointer text-[10.5px]"
            >
              取消
            </button>

            {generatedDrafts.length > 0 ? (
              <button
                onClick={handleApply}
                disabled={isSynthesizing}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm cursor-pointer transition-all flex items-center gap-1 text-[10.5px] shadow-md"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>TTS 人声合成中...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3" />
                    <span>一键应用并合成国语TTS人声</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm cursor-pointer transition-all flex items-center gap-1 text-[10.5px] shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>正在创作智能口播...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>智能编导自动写作</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
