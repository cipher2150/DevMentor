import React, { useState } from 'react';
import { Folder, FileCode, ChevronDown, ChevronRight, Eye, Sparkles, Brain, CheckCircle2 } from 'lucide-react';

export default function CodebaseExplorer({
  fileTree,
  fileOverviews,
  selectedPath,
  onSelectPath,
  onViewCode,
  concepts,
  onSelectConcept
}) {
  const [expandedFolders, setExpandedFolders] = useState({
    'client': true,
    'server': true,
    'shared': true
  });

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const overview = fileOverviews[selectedPath] || {
    path: selectedPath || 'server/drawing-state.ts',
    purpose: 'Manages drawing state for collaborative rooms.',
    responsibilities: [
      'Maintains drawing state for active session rooms',
      'Tracks active strokes in real-time before finalizing',
      'Stores committed stroke arrays for permanent canvas buffer',
      'Supports user-specific undo/redo rollback'
    ],
    usedBy: ['server/rooms.ts', 'server/server.ts'],
    relatedConcepts: ['State Synchronization', 'Canvas Architecture', 'Undo/Redo']
  };

  // Group files into folder structure
  const folderStructure = buildTreeFromList(fileTree);

  return (
    <div className="panel-shell sidebar-panel">
      <div className="panel-header">
        <div className="panel-header__title">
          <Folder size={16} />
          <span>Codebase Explorer</span>
        </div>
        <span className="panel-badge">{fileTree.length} files</span>
      </div>

      <div className="panel-section">
        <div className="section-label">
          <Brain size={13} />
          Key concepts
        </div>
        <div className="chip-row">
          {concepts.map((concept) => (
            <button
              key={concept.id}
              onClick={() => onSelectConcept(concept)}
              className="chip-button"
            >
              <span className="chip-dot" />
              {concept.title}
            </button>
          ))}
        </div>
      </div>

      <div className="tree-panel">
        {renderTreeNodes(folderStructure, expandedFolders, toggleFolder, selectedPath, onSelectPath)}
      </div>

      {selectedPath && (
        <div className="info-card">
          <div className="info-card__header">
            <span className="info-card__path">{overview.path}</span>
            <button onClick={() => onViewCode(overview.path)} className="mini-button">
              <Eye size={13} />
              View code
            </button>
          </div>

          <div className="info-block">
            <span className="section-label">Purpose</span>
            <p>{overview.purpose}</p>
          </div>

          <div className="info-block">
            <span className="section-label">Responsibilities</span>
            <ul>
              {overview.responsibilities.map((resp, i) => (
                <li key={i}>
                  <CheckCircle2 size={13} />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {overview.usedBy && overview.usedBy.length > 0 && (
            <div className="info-block">
              <span className="section-label">Used by</span>
              <div className="tag-list">
                {overview.usedBy.map((caller, i) => (
                  <span key={i} className="tag">{caller}</span>
                ))}
              </div>
            </div>
          )}

          {overview.relatedConcepts && overview.relatedConcepts.length > 0 && (
            <div className="info-block">
              <span className="section-label">Related concepts</span>
              <div className="tag-list">
                {overview.relatedConcepts.map((c, i) => (
                  <span key={i} className="tag tag--primary">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildTreeFromList(fileList) {
  const root = {};
  fileList.forEach(item => {
    const parts = item.path.split('/');
    let current = root;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        current[part] = { _isFile: true, path: item.path };
      } else {
        if (!current[part]) current[part] = { _isFile: false };
        current = current[part];
      }
    });
  });
  return root;
}

function renderTreeNodes(node, expandedFolders, toggleFolder, selectedPath, onSelectPath, currentPath = '') {
  return Object.entries(node).map(([name, val]) => {
    if (name.startsWith('_')) return null;

    if (val._isFile) {
      const isSelected = selectedPath === val.path;
      return (
        <div
          key={val.path}
          onClick={() => onSelectPath(val.path)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
          <span className="truncate">{name}</span>
        </div>
      );
    } else {
      const folderFullPath = currentPath ? `${currentPath}/${name}` : name;
      const isExpanded = expandedFolders[folderFullPath] !== false;

      return (
        <div key={folderFullPath} className="space-y-0.5">
          <div
            onClick={() => toggleFolder(folderFullPath)}
            className="flex items-center gap-1.5 px-2 py-1 text-slate-300 font-semibold hover:bg-slate-900/40 rounded cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
            <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{name}</span>
          </div>

          {isExpanded && (
            <div className="pl-4 space-y-0.5 border-l border-slate-800/60 ml-2">
              {renderTreeNodes(val, expandedFolders, toggleFolder, selectedPath, onSelectPath, folderFullPath)}
            </div>
          )}
        </div>
      );
    }
  });
}
