import React, { useEffect, useRef, useState } from 'react';
import { Network, ArrowRight, Minus, Plus, RotateCcw } from 'lucide-react';

export default function KnowledgeMap({ knowledgeData, onSelectConcept, onSelectFile }) {
  const [activeNode, setActiveNode] = useState(null);
  const [positions, setPositions] = useState({});
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef(null);
  const movedRef = useRef(false);

  const graph = knowledgeData || { nodes: [], edges: [] };

  useEffect(() => {
    setPositions(Object.fromEntries(graph.nodes.map(node => [node.id, { x: node.x, y: node.y }])));
    setViewport({ x: 0, y: 0, scale: 1 });
  }, [knowledgeData]);

  const nodeMap = new Map(graph.nodes.map(node => [node.id, { ...node, ...(positions[node.id] || {}) }]));

  const toCanvasPoint = (event) => {
    const bounds = svgRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 800,
      y: ((event.clientY - bounds.top) / bounds.height) * 460
    };
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    const point = toCanvasPoint(event);
    movedRef.current = true;
    if (dragging.nodeId) {
      setPositions(previous => ({
        ...previous,
        [dragging.nodeId]: {
          x: (point.x - viewport.x) / viewport.scale - dragging.offsetX,
          y: (point.y - viewport.y) / viewport.scale - dragging.offsetY
        }
      }));
    } else {
      setViewport(previous => ({ ...previous, x: point.x - dragging.startX, y: point.y - dragging.startY }));
    }
  };

  const stopDragging = () => setDragging(null);

  const handleCanvasPointerDown = (event) => {
    if (event.target !== svgRef.current) return;
    const point = toCanvasPoint(event);
    movedRef.current = false;
    setDragging({ startX: point.x - viewport.x, startY: point.y - viewport.y });
    svgRef.current.setPointerCapture(event.pointerId);
  };

  const handleNodePointerDown = (event, node) => {
    event.stopPropagation();
    const point = toCanvasPoint(event);
    const position = nodeMap.get(node.id);
    movedRef.current = false;
    setDragging({
      nodeId: node.id,
      offsetX: (point.x - viewport.x) / viewport.scale - position.x,
      offsetY: (point.y - viewport.y) / viewport.scale - position.y
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const changeZoom = (amount) => setViewport(previous => ({
    ...previous,
    scale: Math.min(1.8, Math.max(0.65, previous.scale + amount))
  }));

  const handleWheel = (event) => {
    event.preventDefault();
    changeZoom(event.deltaY > 0 ? -0.1 : 0.1);
  };

  const handleNodeClick = (node) => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    setActiveNode(node.id);
    if (node.file) {
      onSelectFile(node.file);
    }
    if (node.conceptId) {
      onSelectConcept(node.conceptId);
    }
  };

  return (
    <div className="panel-shell knowledge-panel">
      <div className="panel-header">
        <div className="panel-header__title">
          <Network size={16} />
          <span>Architecture map</span>
        </div>
        <div className="map-controls">
          <span className="panel-subtitle">Drag nodes to explore</span>
          <button type="button" title="Zoom out" onClick={() => changeZoom(-0.1)}><Minus size={13} /></button>
          <button type="button" title="Zoom in" onClick={() => changeZoom(0.1)}><Plus size={13} /></button>
          <button type="button" title="Reset map" onClick={() => { setPositions(Object.fromEntries(graph.nodes.map(node => [node.id, { x: node.x, y: node.y }]))); setViewport({ x: 0, y: 0, scale: 1 }); }}><RotateCcw size={13} /></button>
        </div>
      </div>

      <div className={`knowledge-canvas ${dragging ? 'knowledge-canvas--dragging' : ''}`} onWheel={handleWheel}>
        <svg
          ref={svgRef}
          viewBox="0 0 800 460"
          className="knowledge-svg"
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
          {/* Edge Lines */}
          {graph.edges.map((edge, idx) => {
            const source = nodeMap.get(edge.from);
            const target = nodeMap.get(edge.to);
            if (!source || !target) return null;

            const isHighlighted = activeNode === source.id || activeNode === target.id;

            return (
              <g key={idx}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? '#6366f1' : edge.animated ? '#38bdf8' : '#334155'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={edge.animated ? '4 4' : 'none'}
                  className={edge.animated ? 'animate-pulse' : ''}
                >
                  {edge.animated && (
                    <animate
                      attributeName="stroke-dashoffset"
                      values="0;-24"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  )}
                </line>
                {edge.label && (
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2 - 6}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="Fira Code"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const isSelected = activeNode === node.id;
            const isRoot = node.category === 'root';
            const isLayer = node.category === 'layer';
            const isConcept = node.category === 'concept';

            let bgColor = '#1e293b';
            let borderColor = '#475569';
            let textColor = '#e2e8f0';

            if (isRoot) {
              bgColor = '#4f46e5';
              borderColor = '#818cf8';
              textColor = '#ffffff';
            } else if (isLayer) {
              bgColor = '#0f172a';
              borderColor = '#38bdf8';
              textColor = '#38bdf8';
            } else if (isConcept) {
              bgColor = '#1e1b4b';
              borderColor = '#6366f1';
              textColor = '#c7d2fe';
            }

            if (isSelected) {
              borderColor = '#38bdf8';
              bgColor = '#312e81';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node)}
                className="cursor-pointer group"
              >
                {/* Node Box */}
                <rect
                  x={-75}
                  y={-22}
                  width={150}
                  height={44}
                  rx={10}
                  fill={bgColor}
                  stroke={isSelected ? '#38bdf8' : borderColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-all duration-200 group-hover:scale-105"
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                />

                {/* Node Label */}
                <text
                  x={0}
                  y={node.subtitle ? -4 : 4}
                  fill={textColor}
                  fontSize={isRoot ? '12' : '11'}
                  fontWeight={isRoot ? '700' : '600'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none"
                >
                  {node.label}
                </text>

                {node.subtitle && (
                  <text
                    x={0}
                    y={10}
                    fill="#94a3b8"
                    fontSize="8"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
                  >
                    {node.subtitle}
                  </text>
                )}
              </g>
            );
          })}
          </g>
        </svg>
      </div>

      <div className="legend-bar">
        <div className="legend-items">
          <span><i className="legend-swatch swatch-root" />Root</span>
          <span><i className="legend-swatch swatch-layer" />Layer</span>
          <span><i className="legend-swatch swatch-concept" />Concept</span>
        </div>

        <div className="legend-flow">
          <span>Real-time socket flow</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}
