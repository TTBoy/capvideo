/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Video, Music, Image as ImageIcon, Volume2, Plus, Upload, FolderPlus, Grid, List, Scissors, Check, Loader2 } from 'lucide-react';
import { Material, MaterialType } from '../types';

interface MaterialLibraryProps {
  materials: {
    videos: Material[];
    music: Material[];
    images: Material[];
    voiceovers: Material[];
  };
  onSelectMaterial: (material: Material) => void;
  selectedMaterialId: string | null;
  onUploadSuccess: (material: Material) => void;
  onAddMaterialToGroup: (material: Material, groupIndex: number) => void;
  groupCount: number;
}

export default function MaterialLibrary({
  materials,
  onSelectMaterial,
  selectedMaterialId,
  onUploadSuccess,
  onAddMaterialToGroup,
  groupCount
}: MaterialLibraryProps) {
  const [activeTab, setActiveTab] = useState<'all' | MaterialType>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter materials based on selected tab
  const getFilteredMaterials = () => {
    switch (activeTab) {
      case 'video':
        return materials.videos;
      case 'music':
        return materials.music;
      case 'image':
        return materials.images;
      case 'audio':
        return materials.voiceovers;
      default:
        return [
          ...materials.videos,
          ...materials.voiceovers,
          ...materials.music,
          ...materials.images,
        ];
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const resData = await response.json();
      if (resData.success && resData.material) {
        onUploadSuccess(resData.material);
      }
    } catch (err) {
      console.error('File upload error:', err);
      // Fallback create mock material locally
      const mockMat: Material = {
        id: 'uploaded-local-' + Date.now(),
        type: file.type.startsWith('image/') ? 'image' : (file.type.startsWith('audio/') ? 'music' : 'video'),
        name: file.name,
        url: URL.createObjectURL(file),
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=160&q=80',
        duration: 8.0,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      };
      onUploadSuccess(mockMat);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="material-library-panel" className="flex flex-col h-full bg-[#141414] text-[#E0E0E0] border-r border-[#333]">
      {/* Search Header */}
      <div className="p-2 border-b border-[#222]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            素材媒体库 (Media Assets)
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-1 rounded-sm ${isGridView ? 'bg-[#252525] text-blue-400 border border-[#444]' : 'text-gray-500 hover:text-gray-300'}`}
              title="网格视图"
            >
              <Grid className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-1 rounded-sm ${!isGridView ? 'bg-[#252525] text-blue-400 border border-[#444]' : 'text-gray-500 hover:text-gray-300'}`}
              title="列表视图"
            >
              <List className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Dynamic Horizontal Controls */}
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm transition-colors text-[9.5px]"
          >
            <Upload className="w-2.5 h-2.5" />
            + 导入文件
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*,audio/*,image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#252525] border border-[#333] hover:bg-[#333] text-gray-300 rounded-sm transition-colors text-[9.5px]"
          >
            <FolderPlus className="w-2.5 h-2.5 text-green-400" />
            导入文件夹
          </button>

          <button
            className="flex items-center gap-1 px-2 py-0.5 bg-[#252525] border border-[#333] hover:bg-[#333] text-gray-300 rounded-sm transition-colors text-[9.5px]"
          >
            <Plus className="w-2.5 h-2.5 text-violet-400" />
            新文件夹
          </button>

          <button
            className="flex items-center gap-1 px-2 py-0.5 bg-[#252525] border border-[#333] hover:bg-[#333] text-blue-400 rounded-sm transition-colors text-[9.5px]"
          >
            <Scissors className="w-2.5 h-2.5" />
            快速裁剪
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222] bg-[#1A1A1A] text-[10.5px]">
        {[
          { id: 'all', label: '全部' },
          { id: 'video', label: '视频', icon: Video },
          { id: 'audio', label: '配音', icon: Volume2 },
          { id: 'music', label: '音乐', icon: Music },
          { id: 'image', label: '图片', icon: ImageIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center border-b-2 text-center transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-[#252525] font-semibold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[10px]">
                {Icon && <Icon className="w-2.5 h-2.5" />}
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Drop/Uploader Region */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto p-3 custom-scrollbar transition-all ${
          dragActive ? 'bg-[#242b35] border-2 border-dashed border-cyan-400' : ''
        }`}
      >
        {isUploading && (
          <div className="flex items-center justify-center gap-2 py-4 mb-3 bg-[#24242a] rounded">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-300">正在上传并索引素材...</span>
          </div>
        )}

        {getFilteredMaterials().length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
            <Upload className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
            <p>拖拽音视频文件 / 图片到此处</p>
            <p className="text-[10px] text-slate-600 mt-1">支持 MP4, MP3, JPG, PNG 规范</p>
          </div>
        ) : isGridView ? (
          /* Grid View Layout */
          <div className="grid grid-cols-2 gap-1.5">
            {getFilteredMaterials().map((mat) => {
              const isSelected = selectedMaterialId === mat.id;
              return (
                <div
                  key={mat.id}
                  onClick={() => onSelectMaterial(mat)}
                  className={`group relative rounded-sm bg-[#1A1A1A] border p-1 cursor-pointer hover:bg-[#222] transition-all flex flex-col justify-between ${
                    isSelected ? 'border-blue-700 bg-[#252525] ring-1 ring-blue-500/20' : 'border-[#333]'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full rounded-sm overflow-hidden bg-black flex items-center justify-center">
                    {mat.thumbnail ? (
                      <img
                        src={mat.thumbnail}
                        alt={mat.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : mat.type === 'music' || mat.type === 'audio' ? (
                      <div className="w-full h-full flex items-center justify-center bg-blue-950/20">
                        <Music className="w-6 h-6 text-blue-400" />
                      </div>
                    ) : (
                      <Video className="w-6 h-6 text-gray-500" />
                    )}

                    {/* Checkmark overlay */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Clip Duration */}
                    {mat.duration > 0 && (
                      <span className="absolute bottom-1 right-1 bg-black/80 px-1 rounded-sm text-[8px] font-mono text-[#E0E0E0] scale-90">
                        {Math.floor(mat.duration / 60)}:
                        {String(Math.floor(mat.duration % 60)).padStart(2, '0')}
                      </span>
                    )}

                    {/* Fast add action overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                      {groupCount > 0 && Array.from({ length: groupCount }).map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddMaterialToGroup(mat, i);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm transition-all transform hover:scale-105"
                          title={`分配到分组 ${i + 1}`}
                        >
                          +{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metadata labels */}
                  <div className="mt-1 px-0.5">
                    <p className={`text-[10px] font-medium truncate transition-colors ${
                      isSelected ? 'text-blue-400' : 'text-gray-300 group-hover:text-blue-400'
                    }`} title={mat.name}>
                      {mat.name}
                    </p>
                    <div className="flex justify-between items-center text-[9px] text-gray-500 mt-0.5 font-mono">
                      <span>{mat.size}</span>
                      <span className="capitalize text-[8px] bg-black px-1 rounded text-gray-400">{mat.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Layout */
          <div className="flex flex-col gap-1">
            {getFilteredMaterials().map((mat) => {
              const isSelected = selectedMaterialId === mat.id;
              const Icon = mat.type === 'video' ? Video : (mat.type === 'music' ? Music : (mat.type === 'image' ? ImageIcon : Volume2));
              return (
                <div
                  key={mat.id}
                  onClick={() => onSelectMaterial(mat)}
                  className={`flex items-center gap-2 p-1.5 rounded-sm cursor-pointer transition-all border text-[10px] group ${
                    isSelected ? 'bg-[#252525] border-blue-900 text-blue-400' : 'bg-[#1A1A1A] border-[#333] text-gray-300 hover:bg-[#222]'
                  }`}
                >
                  <div className="w-12 h-8 rounded-sm bg-black flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {mat.thumbnail ? (
                      <img src={mat.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isSelected ? 'text-blue-400' : 'text-gray-300 group-hover:text-blue-400'}`}>{mat.name}</p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">{mat.size} {mat.duration > 0 && `• ${mat.duration}s`}</p>
                  </div>
                  {/* Plus actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {groupCount > 0 && Array.from({ length: groupCount }).map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddMaterialToGroup(mat, i);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-sm flex items-center justify-center transition-all"
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
