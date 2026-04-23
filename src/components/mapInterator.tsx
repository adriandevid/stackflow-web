'use client';

import { useState } from "react";
import CustomNode from "./ui/customNode";

export type Node = {
    id: string
    type: string
    code: number
    status: boolean
    data: {
        label: string
        image: string
        port: string
        subType: string
        uptime: string
        cpu: string
    },
    position: { x: number, y: number }
};

export default function MapInterator({
    ref,
    onMouseMove,
    onMouseUp,
    zoom,
    edges,
    nodes,
    tempEdge,
    selectedNodeId,
    onClickNode,
    handleNodeDragNode,
    startConnectNode,
    endConnectNode,
    removeEdgeEvent,
    mousePos,
    activeSelectNode,
    activedSelectNode
}: {
    ref: any
    onMouseMove: any
    onMouseUp: any
    zoom: any
    edges: any
    nodes: any
    tempEdge: any
    selectedNodeId: any
    onClickNode: any
    handleNodeDragNode: any
    startConnectNode: any
    endConnectNode: any
    removeEdgeEvent: any
    mousePos: any,
    activeSelectNode: any
    activedSelectNode: boolean
}) {
    const getPath = (sourceId: any, targetId: any) => {
        const sNode = nodes.find((n: Node) => n.id === sourceId);
        const tNode = nodes.find((n: Node) => n.id === targetId);
        if (!sNode || !tNode) return "";

        const sx = sNode.position.x + 90; // centro aprox
        const sy = sNode.position.y + 40;
        const tx = tNode.position.x + 90;
        const ty = tNode.position.y + 40;

        return `M ${sx} ${sy} C ${sx} ${(sy + ty) / 2}, ${tx} ${(sy + ty) / 2}, ${tx} ${ty} `;
    };

    return (
        <div
            ref={ref}
            className="relative w-full h-full overflow-auto"
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            style={{
                zoom: zoom
            }}
        >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                    </marker>
                </defs>

                {/* Edges Existentes */}
                {edges.map((edge: any) => (
                    <g key={edge.id} className="cursor-pointer group pointer-events-auto" onClick={(e) => { e.stopPropagation(); removeEdgeEvent(edge.id); }}>
                        <path
                            d={getPath(edge.source, edge.target)}
                            stroke="#cbd5e1"
                            strokeWidth="6"
                            fill="none"
                            className="opacity-0 group-hover:opacity-20 transition-opacity stroke-red-500"
                        />
                        <path
                            d={getPath(edge.source, edge.target)}
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            fill="none"
                            markerEnd="url(#arrow)"
                            className="group-hover:stroke-cyan-400 transition-colors"
                        />
                    </g>
                ))}

                {/* Edge Temporária sendo desenhada */}
                {tempEdge && (
                    <path
                        d={`M ${nodes.find((n: Node) => n.id === tempEdge.sourceId).position.x + 90} ${nodes.find((n: Node) => n.id === tempEdge.sourceId).position.y + 40} L ${mousePos.x} ${mousePos.y} `}
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        fill="none"
                    />
                )}
                {/* Edge Temporária sendo desenhada */}
                {tempEdge && (
                    <path
                        d={`M ${nodes.find((n: Node) => n.id === tempEdge.sourceId).position.x + 90} ${nodes.find((n: Node) => n.id === tempEdge.sourceId).position.y + 40} L ${mousePos.x} ${mousePos.y} `}
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        fill="none"
                    />
                )}
            </svg>

            {nodes.map((node: Node) => (
                <CustomNode
                    key={node.id}
                    node={node}
                    activeSelectNode={activedSelectNode}
                    isSelected={selectedNodeId === node.id}
                    onClick={onClickNode}
                    onDrag={handleNodeDragNode}
                    onStartConnect={startConnectNode}
                    onEndConnect={endConnectNode}
                />
            ))}
        </div>
    )
}