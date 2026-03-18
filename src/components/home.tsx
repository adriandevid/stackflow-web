'use client';

import io, { ManagerOptions, Socket } from 'socket.io-client';
import React, { useState, useCallback, useEffect, useMemo, useRef, useActionState, startTransition } from 'react';
import {
    Server,
    Box,
    Layers,
    FileCode,
    Activity,
    Settings,
    Plus,
    Play,
    Terminal,
    Save,
    Database,
    Globe,
    ShieldCheck,
    Zap,
    ChevronRight,
    Maximize2,
    MousePointer2,
    X,
    RefreshCw,
    Cpu,
    HardDrive,
    Download,
    FileJson,
    ImageIcon,
    PlusCircle,
    CheckCircle2,
    Share2,
    Edit,
    Minus,
    Trash,
    AlertTriangle,
    UploadCloud,
    FileText,
    Trash2,
    LogOut,
    GripVertical,
    Menu,
    CardSim,
    Code,
    CircleSlash
} from 'lucide-react';
import domtoimage from "dom-to-image-more";
import { domToPng } from 'modern-screenshot';
import CustomNode from '@pedreiro-web/components/ui/customNode';
import { Application, ApplicationCreate, ApplicationFile, ApplicationFileCreate, ApplicationFileUpdate, ApplicationUpdate, ApplicationValidator } from '@pedreiro-web/infrastructure/repository/types/application';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Edge } from '@pedreiro-web/infrastructure/repository/types';
import { InfrastructureComponent, InfrastructureComponentCommand, InfrastructureComponentCommandCreate, InfrastructureComponentCommandValidator, InfrastructureComponentCreate, InfrastructureComponentEnvironmentCreate, InfrastructureComponentEnvironmentValidator, InfrastructureComponentLabelCreate, InfrastructureComponentLabelValidator, InfrastructureComponentNetworkCreate, InfrastructureComponentNetworkValidator, InfrastructureComponentPortCreate, InfrastructureComponentPortValidator, InfrastructureComponentUpdate, InfrastructureComponentValidator, InfrastructureComponentVolumeCreate, InfrastructureComponentVolumeValidator, Log } from '@pedreiro-web/infrastructure/repository/types/infrastructure-component';
import Create from '@pedreiro-web/app/actions/application/create';
import CreateInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/create';
import UpdateInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/update';
import { redirect, useRouter } from 'next/navigation';
import DeleteInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/delete';
import UpdateApplication from '@pedreiro-web/app/actions/application/update';
import DeleteApplication from '@pedreiro-web/app/actions/application/delete';
import Signout from '@pedreiro-web/app/actions/authentication/signout';
import { cn } from '@pedreiro-web/util/tailwindmerge';
import { MemoryInformations } from '@pedreiro-web/util/plataform';
import BuildInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/build';
import UpdateStateInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/updateState';
import StopInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/stop';
import DestroyInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/destroy';

// --- Aplicação Principal ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'info' }: any) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-cyan-100 text-cyan-600'
                        }`}>
                        {type === 'warning' ? <AlertTriangle size={24} /> : <Zap size={24} />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
                </div>
                <div className="flex border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors border-r border-slate-100"
                    >
                        Cancelar
                    </button>
                    <button
                        type='button'
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${type === 'warning' ? 'text-amber-600 hover:bg-amber-50' : 'text-cyan-600 hover:bg-cyan-50'
                            }`}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Home({
    edgesSource,
    applicationsSource,
    infrastructureComponentsSource,
    computerMemory
}: {
    computerMemory: MemoryInformations
    edgesSource: Edge[];
    applicationsSource: Application[];
    infrastructureComponentsSource: InfrastructureComponent[]
}) {
    const [activeTab, setActiveTab] = useState('nodes-map'); // 'nodes-map' ou 'files'
    const [activeFile, setActiveFile] = useState('docker-compose.yml');
    const [code, setCode] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-api');
    const [isDeploying, setIsDeploying] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

    // Estado dos Nodes para permitir movimento
    const [nodes, setNodes] = useState<any[]>([]);

    const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

    const fileTemplates: any = useMemo(() => ({
        'docker-compose.yml': `version: '3.8'\nservices:\n  api:\n    build: ./backend\n    ports:\n      - "5000:5000"\n    depends_on:\n      - db\n  web:\n    image: nginx:stable\n    ports:\n      - "80:80"\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_PASSWORD: example`,
        'deployment.yml': `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-deployment\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: backend-api\n  template:\n    metadata:\n      labels:\n        app: backend-api\n    spec:\n      containers:\n      - name: api\n        image: backend-image:v1`,
        'Dockerfile': `FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 5000\nCMD ["npm", "start"]`,
        'service.yml': `apiVersion: v1\nkind: Service\nmetadata:\n  name: api-service\nspec:\n  selector:\n    app: backend-api\n  ports:\n    - protocol: TCP\n      port: 80\n      targetPort: 5000`
    }), []);

    useEffect(() => {
        setCode(fileTemplates[activeFile]);
    }, [activeFile, fileTemplates]);

    const updatePosition = async (code: number, content: { position_x: number, position_y: number }, type: number) => {
        if (type == 1) {
            const responseRequest = await fetch(`${window.location.href}/api/applications/${code}/update-position`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            })

            const responseResult: Application = await responseRequest.json();
            return responseResult;
        } else if (type == 2) {
            const responseRequest = await fetch(`${window.location.href}/api/infrastructure-component/${code}/update-position`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            })

            const responseResult: InfrastructureComponent = await responseRequest.json();
            return responseResult;
        }
    }

    const createEdge = async (content: { source_id: number, target_id: number }) => {
        const responseRequest = await fetch(`${window.location.href}/api/edges/`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(content)
        })

        const responseResult: Edge = await responseRequest.json();
        return responseResult;
    }

    const deleteEdge = async (id: number) => {
        const responseRequest = await fetch(`${window.location.href}/api/edges/${id}`, {
            method: "DELETE"
        })

        if (responseRequest.status == 200) {
            return true;
        }
        return false;
    }


    const handleNodeDrag = (id: any, x: any, y: any) => {
        const nodeSelected = nodes.filter(x => x.id == id)[0];
        console.log(nodeSelected)
        updatePosition(nodeSelected.code, { position_x: x, position_y: y }, nodeSelected.type == "container" ? 1 : 2);
        setNodes(prev => prev.map(node => node.id === id ? { ...node, position: { x, y } } : node));
    };

    const handleDeploy = () => {
        setIsDeploying(true);
        setTimeout(() => setIsDeploying(false), 3000);
    };

    const exportConfig = () => {
        const configData = {
            timestamp: new Date().toISOString(),
            cluster: "GCP-SOUTH-1",
            nodes: nodes,
            configurations: fileTemplates
        };
        const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cloud-infra-config-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
        showNotify("Configurações exportadas!");
    };

    const [notification, setNotification] = useState<any>(null);

    const showNotify = (text: any) => {
        setNotification(text);
        setTimeout(() => setNotification(null), 3000);
    };

    const canvasRef = useRef<any>(null);

    const exportMapImage = () => {
        if (!canvasRef.current) return;

        const node = document.getElementById("area");

        domToPng(canvasRef.current).then(x => {
            const link = document.createElement('a');
            link.href = x;
            link.download = `cluster-map-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(x);
            setShowExportMenu(false);
            showNotify("Mapa exportado como SVG!");
        });
    };

    const [edges, setEdges] = useState<any[]>([]);
    const [tempEdge, setTempEdge] = useState<any>(null);

    // Funções de Conexão
    const startConnect = (nodeId: any, handleSide: any) => {
        setTempEdge({ sourceId: nodeId, handleSide });
    };

    const endConnect = (targetId: any) => {
        if (tempEdge && tempEdge.sourceId !== targetId) {
            const exists = edges.find(e => (e.source === tempEdge.sourceId && e.target === targetId) || (e.source === targetId && e.target === tempEdge.sourceId));
            if (!exists) {
                const newEdge = {
                    id: `e-${Date.now()}`,
                    source: tempEdge.sourceId,
                    target: targetId
                };
                createEdge({ source_id: tempEdge.sourceId, target_id: targetId })
                setEdges(prev => [...prev, newEdge]);
                showNotify("Nova conexão estabelecida");
            }
        }
        setTempEdge(null);
    };

    const removeEdge = (id: any) => {
        deleteEdge(parseInt(`${edges.filter(e => e.id == id)[0].id}`.split("-")[1]))
        setEdges(prev => prev.filter(e => e.id !== id));
        showNotify("Conexão removida");
    };
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const handleMouseMoveCanvas = (e: any) => {
        if (!tempEdge || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const MapInterator = () => (
        <div
            ref={canvasRef}
            className="relative w-full h-full overflow-auto"
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={() => setTempEdge(null)}
            style={{
                zoom: scaleMap
            }}
        >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                    </marker>
                </defs>

                {/* Edges Existentes */}
                {edges.map(edge => (
                    <g key={edge.id} className="cursor-pointer group pointer-events-auto" onClick={(e) => { e.stopPropagation(); removeEdge(edge.id); }}>
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
                        d={`M ${nodes.find(n => n.id === tempEdge.sourceId).position.x + 90} ${nodes.find(n => n.id === tempEdge.sourceId).position.y + 40} L ${mousePos.x} ${mousePos.y}`}
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        fill="none"
                    />
                )}
                {/* Edge Temporária sendo desenhada */}
                {tempEdge && (
                    <path
                        d={`M ${nodes.find(n => n.id === tempEdge.sourceId).position.x + 90} ${nodes.find(n => n.id === tempEdge.sourceId).position.y + 40} L ${mousePos.x} ${mousePos.y}`}
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        fill="none"
                    />
                )}
            </svg>

            {nodes.map(node => (
                <CustomNode
                    key={node.id}
                    node={node}
                    activeSelectNode={activedSelectNode}
                    isSelected={selectedNodeId === node.id}
                    onClick={(nodeId: string) => {
                        setSelectedNodeId(nodeId)
                        setShowContentDetails(true)
                    }}
                    onDrag={handleNodeDrag}
                    onStartConnect={startConnect}
                    onEndConnect={endConnect}
                />
            ))}
        </div>
    )

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'web',
        subType: 'db',
        image: '',
        port: '',
        replicas: '1'
    });

    const getPath = (sourceId: any, targetId: any) => {
        const sNode = nodes.find(n => n.id === sourceId);
        const tNode = nodes.find(n => n.id === targetId);
        if (!sNode || !tNode) return "";

        const sx = sNode.position.x + 90; // centro aprox
        const sy = sNode.position.y + 40;
        const tx = tNode.position.x + 90;
        const ty = tNode.position.y + 40;

        return `M ${sx} ${sy} C ${sx} ${(sy + ty) / 2}, ${tx} ${(sy + ty) / 2}, ${tx} ${ty}`;
    };


    const [fileContents, setFileContents] = useState<any>({
        'docker-compose.yml': `version: '3.8'\nservices:\n  api:\n    build: ./backend\n    ports:\n      - "5000:5000"\n    depends_on:\n      - db\n  web:\n    image: nginx:stable\n    ports:\n      - "80:80"\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_PASSWORD: example`,
        'deployment.yml': `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-deployment\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: backend-api\n  template:\n    metadata:\n      labels:\n        app: backend-api\n    spec:\n      containers:\n      - name: api\n        image: backend-image:v1`,
        'Dockerfile': `FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 5000\nCMD ["npm", "start"]`,
        'service.yml': `apiVersion: v1\nkind: Service\nmetadata:\n  name: api-service\nspec:\n  selector:\n    app: backend-api\n  ports:\n    - protocol: TCP\n      port: 80\n      targetPort: 5000`
    });

    const [stateApplication, formActionApplication, pendingCreateApplication] = useActionState(Create, { status: 200 });
    const [stateApplicationUpdate, formActionApplicationUpdate, pendingUpdateApplication] = useActionState(UpdateApplication, { status: 200 });
    const [stateApplicationDelete, formActionApplicationDelete, pendingDeleteApplication] = useActionState(DeleteApplication, { status: 200 });

    const [stateCreateInfrastructureComponent, formActionInfrastructureComponent, pendingCreateInfrastructureComponent] = useActionState(CreateInfrastructureComponent, { status: 200 });
    const [stateUpdateInfrastructureComponent, formActionUpdateInfrastructureComponent, pendingUpdateInfrastructureComponent] = useActionState(UpdateInfrastructureComponent, { status: 200 });
    const [stateDeleteInfrastructureComponent, formActionDeleteInfrastructureComponent, pendingDeleteInfrastructureComponent] = useActionState(DeleteInfrastructureComponent, { status: 200 });

    const [stateSignout, formSignout, pendingSignout] = useActionState(Signout, {});

    const [stateBuildInfrastructureComponent, formActionBuildInfrastructureComponent, pendingBuildInfrastructureComponent] = useActionState(BuildInfrastructureComponent, undefined);
    const [stateStopInfrastructureComponent, formActionStopInfrastructureComponent, pendingStopInfrastructureComponent] = useActionState(StopInfrastructureComponent, undefined);
    const [stateDestroyInfrastructureComponent, formActionDestroyInfrastructureComponent, pendingDestroyInfrastructureComponent] = useActionState(DestroyInfrastructureComponent, undefined);

    const propsFormCreateApplication = useForm<ApplicationCreate>({
        resolver: zodResolver(ApplicationValidator),
        defaultValues: {
            type: "NodePort",
            protocol: "TCP",
            replicas: "1",
            files: [],
            image_pull_policy: 'Always',
            position_x: 200 + Math.random() * 200,
            position_y: 200 + Math.random() * 100
        }
    });

    const propsFormCreateInfrastructureComponent = useForm<InfrastructureComponentCreate>({
        resolver: zodResolver(InfrastructureComponentValidator),
        defaultValues: {
            restart: "Always",
            commands: [],
            labels: [],
            networks: [],
            ports: [],
            volumes: [],
            environments: [],
            position_x: 200 + Math.random() * 200,
            position_y: 200 + Math.random() * 100
        }
    });

    const propsFormUpdateApplication = useForm<ApplicationUpdate>({
        resolver: zodResolver(ApplicationValidator),
        defaultValues: {
            files: []
        }
    });

    const propsFormUpdateInfrastructureComponent = useForm<InfrastructureComponentUpdate>({
        resolver: zodResolver(InfrastructureComponentValidator),
        defaultValues: {}
    });

    const typesInfrastructureComponent: any = {
        "db": "database",
        "mq": "service",
        "redis": "database",
        "sftr": "service" // software resource
    }

    useEffect(function () {
        setEdges(edgesSource.map(edge => {
            const newEdge = {
                id: `e-${edge.id}`,
                source: edge.source_id,
                target: edge.target_id
            };

            return newEdge;
        }));
        const nodesDefault = [
            ...infrastructureComponentsSource.map(result => ({
                id: `node-infra-${result.service_key.toLowerCase().replace(/\s+/g, '-')}`,
                // Se for WEB, usa 'container' (estilo escuro do Backend API)
                type: typesInfrastructureComponent[result.type],
                code: result.id,
                status: result.alive,
                data: {
                    label: result.service_key,
                    image: result.image,
                    port: result.ports.length > 0 ? result.ports.map(x => x.port_bind).join(",") : "-",
                    subType: result.type,
                    uptime: '0h',
                    cpu: '0%'
                },
                position: { x: result.position_x, y: result.position_y }
            })),
            ...applicationsSource.map(result => ({
                id: `node-${result.name.toLowerCase().replace(/\s+/g, '-')}`,
                code: result.id,
                status: false,
                // Se for WEB, usa 'container' (estilo escuro do Backend API)
                // type: state.data.type === 'web' ? 'container' : 'database',
                type: "container",
                data: {
                    label: result.name,
                    image: result.image,
                    port: result.port,
                    // subType: formData.type === 'web' ? 'api' : formData.subType,
                    subType: "container",
                    uptime: '0h',
                    cpu: '0%'
                },
                position: { x: result.position_x, y: result.position_y }
            }))
        ]
        const fileContentsDefault = [
            ...infrastructureComponentsSource.map(result => {
                const composeEntry = `\n  ${result.service_key.toLowerCase()}:\n    image: ${result.image}\n `;
                const updated: any = { ...fileContents };
                updated['docker-compose.yml'] = fileContents['docker-compose.yml'] + composeEntry;
                return updated;
            }),
            ...applicationsSource.map(result => {
                const composeEntry = `\n  ${result.name.toLowerCase()}:\n    image: ${result.image}\n    ports:\n      - "${result.port}:${result.port}"`;

                const updated: any = { ...fileContents };
                updated['docker-compose.yml'] = fileContents['docker-compose.yml'] + composeEntry;

                // if (formData.type === 'web') {

                // }
                updated[`${result.name.toLowerCase()}-deployment.yml`] = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${result.name.toLowerCase()}-deployment\nspec:\n  replicas: ${result.replicas}\n  selector:\n    matchLabels:\n      app: ${result.name.toLowerCase()}\n  template:\n    metadata:\n      labels:\n        app: ${result.name.toLowerCase()}\n    spec:\n      containers:\n      - name: ${result.name.toLowerCase()}\n        image: ${result.image}`;
                updated[`${result.name.toLowerCase()}-service.yml`] = `apiVersion: v1\nkind: Service\nmetadata:\n  name: ${result.name.toLowerCase()}-service\nspec:\n  selector:\n    app: ${result.name.toLowerCase()}\n  ports:\n    - protocol: TCP\n      port: 80\n      targetPort: ${result.port}`;

                return updated;
            })
        ]

        setFileContents(fileContentsDefault);
        setNodes(nodesDefault);
    }, [infrastructureComponentsSource, applicationsSource, edgesSource])

    const router = useRouter();

    useEffect(function () {
        if (stateCreateInfrastructureComponent.status == 200) {
            setShowAddModal(false);

            if (stateCreateInfrastructureComponent.data) {
                const serviceId = `node-infra-${stateCreateInfrastructureComponent.data.service_key.toLowerCase().replace(/\s+/g, '-')}`;

                // Configuração do novo Node com base no tipo
                const newNode = {
                    id: serviceId,
                    // Se for WEB, usa 'container' (estilo escuro do Backend API)
                    type: typesInfrastructureComponent[stateCreateInfrastructureComponent.data.type],
                    code: stateCreateInfrastructureComponent.data.id,
                    status: false,
                    data: {
                        label: stateCreateInfrastructureComponent.data.service_key,
                        image: stateCreateInfrastructureComponent.data.image,
                        port: "-",
                        subType: stateCreateInfrastructureComponent.data.type,
                        uptime: '0h',
                        cpu: '0%'
                    },
                    position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 100 }
                };

                const composeEntry = `\n  ${stateCreateInfrastructureComponent.data.service_key.toLowerCase()}:\n    image: ${stateCreateInfrastructureComponent.data.image}\n `;

                setFileContents((prev: any) => {
                    const updated: any = { ...prev };
                    updated['docker-compose.yml'] = prev['docker-compose.yml'] + composeEntry;
                    return updated;
                });

                setNodes((prev: any) => [...prev, newNode]);
                setShowAddModal(false);
                propsFormCreateApplication.reset({
                    type: "NodePort",
                    protocol: "TCP",
                    replicas: "1",
                    image_pull_policy: 'Always',
                    position_x: 200 + Math.random() * 200,
                    position_y: 200 + Math.random() * 100
                });
                propsFormCreateInfrastructureComponent.reset({
                    restart: "Always",
                    commands: [],
                    labels: [],
                    networks: [],
                    ports: [],
                    volumes: [],
                    environments: [],
                    position_x: 200 + Math.random() * 200,
                    position_y: 200 + Math.random() * 100
                })
                showNotify(`Serviço ${stateCreateInfrastructureComponent.data.service_key} registrado!`);
                router.refresh();
            }
        } else if (stateCreateInfrastructureComponent.message) {
            showNotify(stateCreateInfrastructureComponent.message);
        }
    }, [stateCreateInfrastructureComponent])

    useEffect(function () {
        if (stateDeleteInfrastructureComponent.status == 200 && stateDeleteInfrastructureComponent.data) {
            showNotify(`Serviço ${stateDeleteInfrastructureComponent.data.service_key} excluido!`);
            router.refresh();
        }
    }, [stateDeleteInfrastructureComponent])

    useEffect(function () {
        if (stateApplicationDelete.status == 200 && stateApplicationDelete.data) {
            showNotify(`Serviço ${stateApplicationDelete.data.name} excluido!`);
            router.refresh();
        }
    }, [stateApplicationDelete])

    useEffect(function () {
        if (stateApplication.status == 200) {
            setShowAddModal(false);

            if (stateApplication.data) {
                const serviceId = `node-${stateApplication.data.name.toLowerCase().replace(/\s+/g, '-')}`;

                // Configuração do novo Node com base no tipo
                const newNode = {
                    id: serviceId,
                    // Se for WEB, usa 'container' (estilo escuro do Backend API)
                    // type: state.data.type === 'web' ? 'container' : 'database',
                    code: stateApplication.data.id,
                    status: false,
                    type: "container",
                    data: {
                        label: stateApplication.data.name,
                        image: stateApplication.data.image,
                        port: stateApplication.data.port,
                        // subType: formData.type === 'web' ? 'api' : formData.subType,
                        subType: "container",
                        uptime: '0h',
                        cpu: '0%'
                    },
                    position: { x: stateApplication.data.position_x, y: stateApplication.data.position_y }
                };

                const composeEntry = `\n  ${stateApplication.data.name.toLowerCase()}:\n    image: ${stateApplication.data.image}\n    ports:\n      - "${stateApplication.data.port}:${stateApplication.data.port}"`;

                setFileContents((prev: any) => {
                    const updated: any = { ...prev };
                    updated['docker-compose.yml'] = prev['docker-compose.yml'] + composeEntry;

                    // if (formData.type === 'web') {

                    // }
                    updated[`${stateApplication.data.name.toLowerCase()}-deployment.yml`] = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${stateApplication.data.name.toLowerCase()}-deployment\nspec:\n  replicas: ${stateApplication.data.replicas}\n  selector:\n    matchLabels:\n      app: ${stateApplication.data.name.toLowerCase()}\n  template:\n    metadata:\n      labels:\n        app: ${stateApplication.data.name.toLowerCase()}\n    spec:\n      containers:\n      - name: ${stateApplication.data.name.toLowerCase()}\n        image: ${stateApplication.data.image}`;
                    updated[`${stateApplication.data.name.toLowerCase()}-service.yml`] = `apiVersion: v1\nkind: Service\nmetadata:\n  name: ${stateApplication.data.name.toLowerCase()}-service\nspec:\n  selector:\n    app: ${stateApplication.data.name.toLowerCase()}\n  ports:\n    - protocol: TCP\n      port: 80\n      targetPort: ${stateApplication.data.port}`;

                    return updated;
                });

                setNodes((prev: any) => [...prev, newNode]);
                setShowAddModal(false);
                propsFormCreateApplication.reset({
                    type: "NodePort",
                    protocol: "TCP",
                    replicas: "1",
                    image_pull_policy: 'Always',
                    position_x: 200 + Math.random() * 200,
                    position_y: 200 + Math.random() * 100
                });
                propsFormCreateInfrastructureComponent.reset({
                    restart: "Always",
                    commands: [],
                    labels: [],
                    networks: [],
                    ports: [],
                    volumes: [],
                    environments: []
                })
                showNotify(`Serviço ${stateApplication.data.name} registrado!`);
                router.refresh();
            }
        }
    }, [stateApplication])

    const propsFormCreateCommands = useForm<InfrastructureComponentCommandCreate>({
        resolver: zodResolver(InfrastructureComponentCommandValidator),
        defaultValues: {}
    });

    const propsFormCreatePorts = useForm<InfrastructureComponentPortCreate>({
        resolver: zodResolver(InfrastructureComponentPortValidator),
        defaultValues: {}
    });

    const propsFormCreateVolume = useForm<InfrastructureComponentVolumeCreate>({
        resolver: zodResolver(InfrastructureComponentVolumeValidator),
        defaultValues: {}
    });

    const propsFormCreateNetwork = useForm<InfrastructureComponentNetworkCreate>({
        resolver: zodResolver(InfrastructureComponentNetworkValidator),
        defaultValues: {}
    });


    const propsFormCreateLabel = useForm<InfrastructureComponentLabelCreate>({
        resolver: zodResolver(InfrastructureComponentLabelValidator),
        defaultValues: {}
    });


    const propsFormCreateEnvironment = useForm<InfrastructureComponentEnvironmentCreate>({
        resolver: zodResolver(InfrastructureComponentEnvironmentValidator),
        defaultValues: {}
    });

    const [showEditInfrastructureModal, setShowEditInfrastructureModal] = useState<boolean>(false);
    const [showEditApplicationModal, setShowEditAppplicationModal] = useState<boolean>(false);


    useEffect(function () {
        if (stateUpdateInfrastructureComponent.status == 200 && stateUpdateInfrastructureComponent.data) {
            setShowEditInfrastructureModal(false);
            showNotify(`Serviço ${stateUpdateInfrastructureComponent.service_key} atualizado!`);
            router.refresh();
        }
    }, [stateUpdateInfrastructureComponent])

    useEffect(function () {
        if (stateApplicationUpdate.status == 200 && stateApplicationUpdate.data) {
            setShowEditAppplicationModal(false);
            showNotify(`Serviço ${stateApplicationUpdate.data.name} atualizado!`);
            router.refresh();
        }
    }, [stateApplicationUpdate])

    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false); // Estado para o modal de confirmação

    const handleSyncCluster = () => {
        if (selectedNode.id.includes("infra")) {
            startTransition(() => {
                formActionDeleteInfrastructureComponent({
                    id: selectedNode.code
                });
            });
        } else {
            startTransition(() => {
                formActionApplicationDelete({
                    id: selectedNode.code
                });
            });
        }
    };

    const fileToBase64 = (file: File) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (reader.result == null) {
                    return resolve("");
                }
                return resolve(`${reader.result}`.replace(/^data:(.+;base64,)?/, ''))
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const fileInputRef = useRef<any>(null);
    const fileInputUpdateRef = useRef<any>(null);

    const handleFileChange = async (e: any) => {
        const files: File[] = Array.from(e.target.files);
        const applicationFiles: ApplicationFileCreate[] = [];
        for (let index = 0; index < files.length; index++) {
            const element = files[index];
            const elementParsed: string = await fileToBase64(element);

            applicationFiles.push({
                file: elementParsed,
                name: element.name
            });
        }

        propsFormCreateApplication.setValue("files", [...propsFormCreateApplication.watch("files"), ...applicationFiles]);
        // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
        e.target.value = '';
    };

    const handleFileChangeUpdate = async (e: any) => {
        const files: File[] = Array.from(e.target.files);
        const applicationFiles: ApplicationFileUpdate[] = [];
        for (let index = 0; index < files.length; index++) {
            const element = files[index];
            const elementParsed: string = await fileToBase64(element);

            applicationFiles.push({
                file: elementParsed,
                name: element.name
            });
        }

        propsFormUpdateApplication.setValue("files", [
            ...propsFormUpdateApplication.watch("files"),
            ...applicationFiles
        ]);

        e.target.value = '';
    };

    const removeFile = (index: number) => {
        propsFormUpdateApplication.setValue("files", propsFormUpdateApplication.watch("files").filter((x, indexFile) => indexFile != index));
    };

    const [dockerComposeDocument, setDockerComposeDocument] = useState<string>();

    const loadDockerCompose = async () => {
        //http://localhost:3000/api/read-file/docker-compose
        const requestResponse = await fetch("http://localhost:3000/api/read-file/docker-compose", { method: "GET" });
        const responseJson: { content: string } = await requestResponse.json();
        setDockerComposeDocument(responseJson.content);
    }

    const containerResizeRef = useRef<any>(null);
    const contentDetailsRef = useRef<any>(null);
    const [containerResizePositionMove, setContainerResizeModePosition] = useState<{ x: number, y: number } | undefined>();
    const contentPage = useRef<any>(null);

    useEffect(function () {
        if (stateSignout.status == 200 || stateSignout.status == 401 || stateSignout.status == 404) {
            redirect("/login");
        }
    }, [stateSignout]
    )
    useEffect(function () {
        if (containerResizePositionMove) {
            if (containerResizeRef != null && contentDetailsRef != null) {
                contentDetailsRef.current.style.width = `${containerResizePositionMove.x}px`
            }
        }
    }, [containerResizePositionMove])

    useEffect(function () {
        loadDockerCompose();
    }, [])

    const [showContentDetails, setShowContentDetails] = useState<boolean>(false);
    const [activedSelectNode, activeSelectNode] = useState<boolean>(false);
    const [scaleMap, setScaleMap] = useState<number>(1.0);

    // const [executingBuild, executeBuild] = useState<boolean>(false);
    const [localLogOfBuild, setLocalLogOfBuild] = useState<{ operation: string, resource: string, logs: Log[] }[]>([]);

    const buildInfrastructureComponent = async () => {
        isLoading(true);
        setIsDeploying(true);
        startTransition(function () {
            formActionBuildInfrastructureComponent(selectedNode.code);
        })
    }

    const [stopOperationLoading, setStopOperationLoading] = useState<boolean>(false);
    const [destroyOperationLoading, setDestroyOperationLoading] = useState<boolean>(false);

    const stopInfrastructureComponent = async () => {
        isLoading(true);
        setStopOperationLoading(true);
        setIsDeploying(true);
        startTransition(function () {
            formActionStopInfrastructureComponent(selectedNode.code);
        })
    }

    const destroyInfrastructureComponent = async () => {
        isLoading(true);
        setDestroyOperationLoading(true);
        setIsDeploying(true);
        startTransition(function () {
            formActionDestroyInfrastructureComponent(selectedNode.code);
        })
    }

    useEffect(function () {
        if (stateStopInfrastructureComponent && stateStopInfrastructureComponent.status == 200) {
            isLoading(false);
            setStopOperationLoading(false);
            setIsDeploying(false);
        }
    }, [stateStopInfrastructureComponent])

    useEffect(function () {
        if (stateDestroyInfrastructureComponent && stateDestroyInfrastructureComponent.status == 200) {
            isLoading(false);
            setDestroyOperationLoading(false);
            setIsDeploying(false);
        }
    }, [stateDestroyInfrastructureComponent])

    const [stateUpdateStateOfComponent, formActionUpdateStateOfComponent, pendingUpdateStateOfComponent] = useActionState(UpdateStateInfrastructureComponent, undefined);

    const [socket, setSocket] = useState<Socket | undefined>();

    useEffect(function () {
        if (socket) {
            socket.on(`logs-container`, (msg) => {
                var stream: { resource: string, operation: string, logs: Log[] }[] = JSON.parse(msg);
                setLocalLogOfBuild(stream);
            })
        }
    }, [socket])

    const [loading, isLoading] = useState<boolean>(false);

    const loadLogsOfService = async () => {
        isLoading(true);

        const request = await fetch(`${window.location.href}/api/logs/${selectedNode.code}`, { method: "GET" });
        const response: { resource: string, operation: string, logs: Log[] }[] = await request.json();
        setLocalLogOfBuild([...response]);

        isLoading(false);
    }

    useEffect(function () {
        if (selectedNode) {
            loadLogsOfService();
        }
    }, [selectedNodeId])

    useEffect(function () {
        if (localLogOfBuild.length > 0) {
            var isInfrastructureComponent = infrastructureComponentsSource.filter(x => x.service_key == localLogOfBuild[localLogOfBuild.length - 1].resource).length > 0;
            if (isInfrastructureComponent) {
                const lastStreamLog = localLogOfBuild[localLogOfBuild.length - 1];
                var infrastructureComponent = infrastructureComponentsSource.filter(x => x.service_key == localLogOfBuild[localLogOfBuild.length - 1].resource)[0];
                isLoading(true);

                if (lastStreamLog.operation == "start" && lastStreamLog.logs.filter(x => x.short_log.includes("start"))) {

                    startTransition(function () {
                        formActionUpdateStateOfComponent(infrastructureComponent.id);
                    })
                } else if (lastStreamLog.operation == "stop" && lastStreamLog.logs[lastStreamLog.logs.length - 1].short_log.includes("die")) {

                    startTransition(function () {
                        formActionUpdateStateOfComponent(infrastructureComponent.id);
                    })
                } else if (lastStreamLog.operation == "down" && lastStreamLog.logs[lastStreamLog.logs.length - 1].short_log.includes("destroy")) {


                    startTransition(function () {
                        formActionUpdateStateOfComponent(infrastructureComponent.id);
                    })
                } else {
                    isLoading(false);
                }
            }
        }
    }, [localLogOfBuild])

    useEffect(function () {
        if (stateUpdateStateOfComponent && stateUpdateStateOfComponent.status == 200) {
            isLoading(false);
            router.refresh();
        }
    }, [stateUpdateStateOfComponent])


    useEffect(function () {
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        return () => {
            newSocket.close();
        }
    }, []);

    useEffect(function () {
        if (stateBuildInfrastructureComponent && stateBuildInfrastructureComponent.status == 200) {
            isLoading(false);
            setIsDeploying(false);
            loadLogsOfService();
        }
    }, [stateBuildInfrastructureComponent])

    return (
        <div

            className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900 select-none animate-in animate-fade-in duration-700"
        >
            {
                loading && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in text-white">
                        <div className='flex flex-col justify-center items-center'>
                            <RefreshCw size={40} className="animate-spin" />
                            <p className='text-md'>Carregando...</p>
                        </div>
                    </div>
                )
            }
            {/* Notificação Toast */}
            {notification && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CheckCircle2 className="text-cyan-400" size={20} />
                    <span className="text-sm font-bold">{notification}</span>
                </div>
            )}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleSyncCluster}
                title="Dejese remover este recurso?"
                message="Esta ação irá remover o recurso de todos os manifestos YAML e reiniciar os serviços modificados. Deseja continuar?"
                type="warning"
            />

            {
                showEditInfrastructureModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <PlusCircle className="text-cyan-500" size={20} /> Editar Node
                                </h3>
                                <button onClick={() => setShowEditInfrastructureModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <form className="p-6 space-y-4">
                                <div className='max-h-[400px] overflow-y-auto overflow-x-hidden flex flex-col gap-4 px-2'>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Infra</label>
                                        <select
                                            {...propsFormUpdateInfrastructureComponent.register("type")}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium bg-white"
                                        >
                                            <option value="db">Banco de Dados (SQL/NoSQL)</option>
                                            <option value="redis">Cache (Redis/In-memory)</option>
                                            <option value="mq">Mensageria (RabbitMQ/Kafka)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Image: </label>
                                        <input required {...propsFormUpdateInfrastructureComponent.register("image")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                        {propsFormUpdateInfrastructureComponent.formState.errors.image && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateInfrastructureComponent.formState.errors.image?.message}</p>)}
                                    </div>
                                    <div className='flex gap-4'>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do componente: </label>
                                            <input required {...propsFormUpdateInfrastructureComponent.register("service_key")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                            {propsFormUpdateInfrastructureComponent.formState.errors.service_key && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateInfrastructureComponent.formState.errors.service_key?.message}</p>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do container: </label>
                                            <input required {...propsFormUpdateInfrastructureComponent.register("container_name")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                            {propsFormUpdateInfrastructureComponent.formState.errors.container_name && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateInfrastructureComponent.formState.errors.container_name?.message}</p>)}
                                        </div>
                                    </div>
                                    <div className='flex gap-4'>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ponto de entrada: </label>
                                            <input required {...propsFormUpdateInfrastructureComponent.register("entrypoint")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                            {propsFormUpdateInfrastructureComponent.formState.errors.entrypoint && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateInfrastructureComponent.formState.errors.entrypoint?.message}</p>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Reinicialização: </label>
                                            <input required {...propsFormUpdateInfrastructureComponent.register("restart")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                            {propsFormUpdateInfrastructureComponent.formState.errors.restart && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateInfrastructureComponent.formState.errors.restart?.message}</p>)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Commando único: </label>
                                        <input required {...propsFormUpdateInfrastructureComponent.register("command")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                        {propsFormUpdateInfrastructureComponent.formState.errors.command && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateInfrastructureComponent.formState.errors.command?.message}</p>)}
                                    </div>

                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Commandos: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateCommands.register("command")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='commando' />
                                                    {propsFormCreateCommands.formState.errors.command && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateCommands.formState.errors.command?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateCommands.trigger()) {
                                                            const commands = propsFormUpdateInfrastructureComponent.watch("commands");
                                                            propsFormUpdateInfrastructureComponent.setValue("commands", [...commands, propsFormCreateCommands.watch()])
                                                            propsFormCreateCommands.reset({
                                                                command: ""
                                                            })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormUpdateInfrastructureComponent.watch("commands").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const commands = propsFormUpdateInfrastructureComponent.watch("commands").filter((port, indexCommand) => indexCommand != index);
                                                        propsFormUpdateInfrastructureComponent.setValue("commands", [...commands])
                                                    }}><p className='text-sm font-semibold p-2'>* {x.command}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Portas: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreatePorts.register("port_bind")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='ex: 8080:3030' />
                                                    {propsFormCreatePorts.formState.errors.port_bind && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreatePorts.formState.errors.port_bind?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreatePorts.trigger()) {
                                                            const ports = propsFormUpdateInfrastructureComponent.watch("ports");
                                                            propsFormUpdateInfrastructureComponent.setValue("ports", [...ports, propsFormCreatePorts.watch()])
                                                            propsFormCreatePorts.reset({
                                                                port_bind: ""
                                                            })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormUpdateInfrastructureComponent.watch("ports").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const ports = propsFormUpdateInfrastructureComponent.watch("ports").filter((port, indexPort) => indexPort != index);
                                                        propsFormUpdateInfrastructureComponent.setValue("ports", [...ports])
                                                    }}><p className='text-sm font-semibold p-2'>* {x.port_bind}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Volumes: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateVolume.register("volume")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='ex: ./past1:/past2' />
                                                    {propsFormCreateVolume.formState.errors.volume && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateVolume.formState.errors.volume?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateVolume.trigger()) {
                                                            const volumes = propsFormUpdateInfrastructureComponent.watch("volumes");
                                                            propsFormUpdateInfrastructureComponent.setValue("volumes", [...volumes, propsFormCreateVolume.watch()])
                                                            propsFormCreateVolume.reset({ volume: "" });
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormUpdateInfrastructureComponent.watch("volumes").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const volumes = propsFormUpdateInfrastructureComponent.watch("volumes").filter((port, indexVolume) => indexVolume != index);
                                                        propsFormUpdateInfrastructureComponent.setValue("volumes", [...volumes])
                                                    }}><p className='text-sm font-semibold p-2'>* {x.volume}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Redes: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateNetwork.register("network")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='rede' />
                                                    {propsFormCreateNetwork.formState.errors.network && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateNetwork.formState.errors.network?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateNetwork.trigger()) {
                                                            const networks = propsFormUpdateInfrastructureComponent.watch("networks");
                                                            propsFormUpdateInfrastructureComponent.setValue("networks", [...networks, propsFormCreateNetwork.watch()])
                                                            propsFormCreateNetwork.reset({ network: "" })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormUpdateInfrastructureComponent.watch("networks").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const networks = propsFormUpdateInfrastructureComponent.watch("networks").filter((port, indexNetwork) => indexNetwork != index);
                                                        propsFormUpdateInfrastructureComponent.setValue("networks", [...networks])
                                                    }}><p className='text-sm font-semibold p-2'>* {x.network}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rótulo: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateLabel.register("label")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='rótulo' />
                                                    {propsFormCreateLabel.formState.errors.label && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateLabel.formState.errors.label?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateLabel.trigger()) {
                                                            const networks = propsFormUpdateInfrastructureComponent.watch("labels");
                                                            propsFormUpdateInfrastructureComponent.setValue("labels", [...networks, propsFormCreateLabel.watch()])
                                                            propsFormCreateLabel.reset({ label: "" })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormUpdateInfrastructureComponent.watch("labels").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const labels = propsFormUpdateInfrastructureComponent.watch("labels").filter((port, indexLabel) => indexLabel != index);
                                                        propsFormUpdateInfrastructureComponent.setValue("labels", [...labels])
                                                    }}><p className='text-sm font-semibold p-2'>* {x.label}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Váriaveis de ambiente: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateEnvironment.register("environment_name")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='chave' />
                                                    {propsFormCreateEnvironment.formState.errors.environment_name && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateEnvironment.formState.errors.environment_name?.message}</p>)}
                                                </div>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateEnvironment.register("environment_value")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                                                    {propsFormCreateEnvironment.formState.errors.environment_value && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateEnvironment.formState.errors.environment_value?.message}</p>)}
                                                </div>
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateEnvironment.trigger()) {
                                                            const environments = propsFormUpdateInfrastructureComponent.watch("environments");
                                                            propsFormUpdateInfrastructureComponent.setValue("environments", [...environments, propsFormCreateEnvironment.watch()])
                                                            propsFormCreateEnvironment.reset({ environment_name: "", environment_value: "" })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormUpdateInfrastructureComponent.watch("environments").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const environments = propsFormUpdateInfrastructureComponent.watch("environments").filter((port, indexEnvironment) => indexEnvironment != index);
                                                        propsFormUpdateInfrastructureComponent.setValue("environments", [...environments])
                                                    }}><p className='text-sm font-semibold p-2'>{x.environment_name} : {x.environment_value}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </div>

                                <button type="button" onClick={async () => {
                                    if (await propsFormUpdateInfrastructureComponent.trigger()) {
                                        startTransition(() => {
                                            formActionUpdateInfrastructureComponent(propsFormUpdateInfrastructureComponent.watch());
                                        });
                                    }
                                }} className="w-full py-3 mt-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-100 flex items-center justify-center gap-2">
                                    <Save size={18} /> Salvar no Cluster
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                showEditApplicationModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <PlusCircle className="text-cyan-500" size={20} /> Editar Node
                                </h3>
                                <button onClick={() => setShowEditAppplicationModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <form className="p-6 space-y-4">
                                <div className='max-h-[400px] overflow-y-auto flex flex-col gap-4 px-2'>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Serviço</label>
                                        <input required {...propsFormUpdateApplication.register("name")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: Auth-Service" />
                                        {propsFormUpdateApplication.formState.errors.name && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.name?.message}</p>)}
                                    </div>
                                    <p className='text-[12px] font-bold text-slate-600 uppercase ml-1'>Configurações de Servico: </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Porta Principal</label>
                                            <input required {...propsFormUpdateApplication.register("port")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                            <p className="text-[10px]">Porta do SERVICE dentro do cluster.</p>
                                            {propsFormUpdateApplication.formState.errors.port && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.port?.message}</p>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Porta do Nó</label>
                                            <input required {...propsFormUpdateApplication.register("node_port")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                            <p className="text-[10px]">Porta exposta em cada NODE do cluster. Permite acesso externo ao cluster.  (padrão: 30000-32767)</p>
                                            {propsFormUpdateApplication.formState.errors.node_port && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.node_port?.message}</p>)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Porta Corrente</label>
                                            <input required {...propsFormUpdateApplication.register("target_port")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                            <p className="text-[10px]">Porta do container (Pod) para onde o tráfego será encaminhado.</p>
                                            {propsFormUpdateApplication.formState.errors.target_port && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.target_port?.message}</p>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Protocolo</label>
                                            <input required {...propsFormUpdateApplication.register("protocol")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                            <p className="text-[10px]">Porta do container (Pod) para onde o tráfego será encaminhado.</p>
                                            {propsFormUpdateApplication.formState.errors.protocol && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.protocol?.message}</p>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de exposição</label>
                                            <input required {...propsFormUpdateApplication.register("type")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                            <p className="text-[10px]">Define como o Service será exposto na rede.</p>
                                            {propsFormUpdateApplication.formState.errors.type && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.type?.message}</p>)}
                                        </div>
                                    </div>
                                    <p className='text-[12px] font-bold text-slate-600 uppercase ml-1'>Configurações de Publicação: </p>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Imagem Docker: </label>
                                        <input required {...propsFormUpdateApplication.register("image")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium font-mono" placeholder="Ex: node:18-alpine" />
                                        {propsFormUpdateApplication.formState.errors.image && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.image?.message}</p>)}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do container: </label>
                                        <input required {...propsFormUpdateApplication.register("container_name")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium font-mono" placeholder="Ex: teste" />
                                        {propsFormUpdateApplication.formState.errors.container_name && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.container_name?.message}</p>)}
                                    </div>

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Réplicas (K8s)</label>
                                            <input type="number" min="1" {...propsFormUpdateApplication.register("replicas")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" />
                                            {propsFormUpdateApplication.formState.errors.replicas && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.replicas?.message}</p>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Politica de construção do container</label>
                                            <input required {...propsFormUpdateApplication.register("image_pull_policy")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                            <p className="text-[10px]">define quando o kubelet deve baixar a imagem do container do registry.</p>
                                            {propsFormUpdateApplication.formState.errors.image_pull_policy && (<p className='text-[12px] text-red-500 font-bold'>{propsFormUpdateApplication.formState.errors.image_pull_policy?.message}</p>)}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ficheiros de Configuração (.yaml, .env, etc)</label>
                                        <div
                                            onClick={() => fileInputUpdateRef.current?.click()}
                                            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-cyan-400 hover:bg-cyan-50/30 transition-all cursor-pointer group"
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                ref={fileInputUpdateRef}
                                                onChange={handleFileChangeUpdate}
                                            />
                                            <div className="p-3 bg-slate-100 rounded-full group-hover:bg-cyan-100 transition-colors">
                                                <UploadCloud size={24} className="text-slate-400 group-hover:text-cyan-600" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-slate-600">Clique para anexar ficheiros</p>
                                                <p className="text-[10px] text-slate-400 mt-1">Manifestos, Secrets, Dockerfiles...</p>
                                            </div>
                                        </div>

                                        {/* Lista de Ficheiros Anexados */}
                                        {propsFormUpdateApplication.watch("files").length > 0 && (
                                            <div className="grid grid-cols-1 gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                                {propsFormUpdateApplication.watch("files").map((file: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                <FileText size={16} className="text-cyan-600" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                                                {/* <span className="text-[9px] text-slate-400 uppercase">{(file.size / 1024).toFixed(1)} KB</span> */}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(idx)}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button type="button" onClick={async () => {
                                    if (await propsFormUpdateApplication.trigger()) {
                                        startTransition(() => {
                                            formActionApplicationUpdate(propsFormUpdateApplication.watch());
                                        });
                                    }
                                }} className="w-full py-3 mt-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-100 flex items-center justify-center gap-2">
                                    <Save size={18} /> Salvar no Cluster
                                </button>
                            </form>
                        </div>
                    </div>

                )
            }
            {/* Modal de Cadastro */}
            {showAddModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <PlusCircle className="text-cyan-500" size={20} /> Novo Registro
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'web' })} className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'web' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'}`}>SERVIÇO WEB (API)</button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'infra' })} className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'infra' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'}`}>INFRAESTRUTURA</button>
                            </div>

                            {formData.type === 'infra' && (
                                <div className='max-h-[400px] overflow-y-auto overflow-x-hidden flex flex-col gap-4 px-2'>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Infra</label>
                                        <select
                                            {...propsFormCreateInfrastructureComponent.register("type")}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium bg-white"
                                        >
                                            <option value="db">Banco de Dados (SQL/NoSQL)</option>
                                            <option value="redis">Cache (Redis/In-memory)</option>
                                            <option value="mq">Mensageria (RabbitMQ/Kafka)</option>
                                            <option value="sftr">Software Resource</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Image: </label>
                                        <input required {...propsFormCreateInfrastructureComponent.register("image")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                        {propsFormCreateInfrastructureComponent.formState.errors.image && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateInfrastructureComponent.formState.errors.image?.message}</p>)}
                                    </div>
                                    <div className='flex gap-4'>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do componente: </label>
                                            <input required {...propsFormCreateInfrastructureComponent.register("service_key")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                            {propsFormCreateInfrastructureComponent.formState.errors.service_key && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateInfrastructureComponent.formState.errors.service_key?.message}</p>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do container: </label>
                                            <input required {...propsFormCreateInfrastructureComponent.register("container_name")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                            {propsFormCreateInfrastructureComponent.formState.errors.container_name && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateInfrastructureComponent.formState.errors.container_name?.message}</p>)}
                                        </div>
                                    </div>
                                    <div className='flex gap-4'>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ponto de entrada: </label>
                                            <input required {...propsFormCreateInfrastructureComponent.register("entrypoint")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                            {propsFormCreateInfrastructureComponent.formState.errors.entrypoint && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateInfrastructureComponent.formState.errors.entrypoint?.message}</p>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Reinicialização: </label>
                                            <input required {...propsFormCreateInfrastructureComponent.register("restart")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                            {propsFormCreateInfrastructureComponent.formState.errors.restart && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateInfrastructureComponent.formState.errors.restart?.message}</p>)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Commando único: </label>
                                        <input required {...propsFormCreateInfrastructureComponent.register("command")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: example" />
                                        {propsFormCreateInfrastructureComponent.formState.errors.command && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateInfrastructureComponent.formState.errors.command?.message}</p>)}
                                    </div>

                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Commandos: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateCommands.register("command")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='commando' />
                                                    {propsFormCreateCommands.formState.errors.command && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateCommands.formState.errors.command?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateCommands.trigger()) {
                                                            const commands = propsFormCreateInfrastructureComponent.watch("commands");
                                                            propsFormCreateInfrastructureComponent.setValue("commands", [...commands, propsFormCreateCommands.watch()])
                                                            propsFormCreateCommands.reset({
                                                                command: ""
                                                            })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormCreateInfrastructureComponent.watch("commands").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const commands = propsFormCreateInfrastructureComponent.watch("commands").filter((port, indexB) => indexB != index);
                                                        propsFormCreateInfrastructureComponent.setValue("commands", [...commands])
                                                    }}><p className='text-sm font-semibold p-2'>{x.command}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Portas: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreatePorts.register("port_bind")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='ex: 8080:3030' />
                                                    {propsFormCreatePorts.formState.errors.port_bind && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreatePorts.formState.errors.port_bind?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreatePorts.trigger()) {
                                                            const ports = propsFormCreateInfrastructureComponent.watch("ports");
                                                            propsFormCreateInfrastructureComponent.setValue("ports", [...ports, propsFormCreatePorts.watch()])
                                                            propsFormCreatePorts.reset({
                                                                port_bind: ""
                                                            })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormCreateInfrastructureComponent.watch("ports").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const ports = propsFormCreateInfrastructureComponent.watch("ports").filter((port, indexB) => indexB != index);
                                                        propsFormCreateInfrastructureComponent.setValue("ports", [...ports])
                                                    }}><p className='text-sm font-semibold p-2'>* {x.port_bind}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Volumes: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateVolume.register("volume")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='ex: ./past1:/past2' />
                                                    {propsFormCreateVolume.formState.errors.volume && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateVolume.formState.errors.volume?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateVolume.trigger()) {
                                                            const volumes = propsFormCreateInfrastructureComponent.watch("volumes");
                                                            propsFormCreateInfrastructureComponent.setValue("volumes", [...volumes, propsFormCreateVolume.watch()])
                                                            propsFormCreateVolume.reset({
                                                                volume: ""
                                                            })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormCreateInfrastructureComponent.watch("volumes").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const volumes = propsFormCreateInfrastructureComponent.watch("volumes").filter((port, indexB) => indexB != index);
                                                        propsFormCreateInfrastructureComponent.setValue("volumes", [...volumes])
                                                    }}><p className='text-sm font-semibold p-2'>{x.volume}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Redes: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateNetwork.register("network")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='rede' />
                                                    {propsFormCreateNetwork.formState.errors.network && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateNetwork.formState.errors.network?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateNetwork.trigger()) {
                                                            const networks = propsFormCreateInfrastructureComponent.watch("networks");
                                                            propsFormCreateInfrastructureComponent.setValue("networks", [...networks, propsFormCreateNetwork.watch()])
                                                            propsFormCreateNetwork.reset({
                                                                network: ""
                                                            })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormCreateInfrastructureComponent.watch("networks").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const networks = propsFormCreateInfrastructureComponent.watch("networks").filter((port, indexB) => indexB != index);
                                                        propsFormCreateInfrastructureComponent.setValue("networks", [...networks])
                                                    }}><p className='text-sm font-semibold p-2'>{x.network}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rótulo: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateLabel.register("label")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='rótulo' />
                                                    {propsFormCreateLabel.formState.errors.label && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateLabel.formState.errors.label?.message}</p>)}
                                                </div>
                                                {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateLabel.trigger()) {
                                                            const networks = propsFormCreateInfrastructureComponent.watch("labels");
                                                            propsFormCreateInfrastructureComponent.setValue("labels", [...networks, propsFormCreateLabel.watch()])
                                                            propsFormCreateLabel.reset({
                                                                label: ""
                                                            })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormCreateInfrastructureComponent.watch("labels").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const labels = propsFormCreateInfrastructureComponent.watch("labels").filter((port, indexB) => indexB != index);
                                                        propsFormCreateInfrastructureComponent.setValue("labels", [...labels])
                                                    }}><p className='text-sm font-semibold p-2'>{x.label}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Váriaveis de ambiente: </label>
                                        <div className='flex flex-row gap-4'>
                                            <div className='flex flex-row gap-4'>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateEnvironment.register("environment_name")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='chave' />
                                                    {propsFormCreateEnvironment.formState.errors.environment_name && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateEnvironment.formState.errors.environment_name?.message}</p>)}
                                                </div>
                                                <div className="space-y-1">
                                                    <input type="text" {...propsFormCreateEnvironment.register("environment_value")} className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                                                    {propsFormCreateEnvironment.formState.errors.environment_value && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateEnvironment.formState.errors.environment_value?.message}</p>)}
                                                </div>
                                                <div className="space-y-1">
                                                    <button type='button' onClick={async () => {
                                                        if (await propsFormCreateEnvironment.trigger()) {
                                                            const environments = propsFormCreateInfrastructureComponent.watch("environments");
                                                            propsFormCreateInfrastructureComponent.setValue("environments", [...environments, propsFormCreateEnvironment.watch()])
                                                            propsFormCreateEnvironment.reset({
                                                                environment_name: "",
                                                                environment_value: ""
                                                            })
                                                        }
                                                    }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='bg-gray-100 rounded-lg p-2 flex-1 flex flex-row flex-wrap'>
                                            {
                                                propsFormCreateInfrastructureComponent.watch("environments").map((x, index) => (
                                                    <div className='flex flex-row items-center justify-center' key={index} onClick={() => {
                                                        const environments = propsFormCreateInfrastructureComponent.watch("environments").filter((port, indexB) => indexB != index);
                                                        propsFormCreateInfrastructureComponent.setValue("environments", [...environments])
                                                    }}><p className='text-sm font-semibold p-2'>{x.environment_name} : {x.environment_value}</p><button type='button' className='p-1 bg-red-400 text-white w-5 h-5 rounded-full flex flex-row items-center justify-center cursor-pointer hover:bg-red-500'><Minus size={12}></Minus></button></div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </div>
                            )}

                            {
                                formData.type === 'web' && (
                                    <div className='max-h-[400px] overflow-y-auto flex flex-col gap-4 px-2'>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Serviço</label>
                                            <input required {...propsFormCreateApplication.register("name")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: Auth-Service" />
                                            {propsFormCreateApplication.formState.errors.name && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.name?.message}</p>)}
                                        </div>
                                        <p className='text-[12px] font-bold text-slate-600 uppercase ml-1'>Configurações de Servico: </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Porta Principal</label>
                                                <input required {...propsFormCreateApplication.register("port")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                                <p className="text-[10px]">Porta do SERVICE dentro do cluster.</p>
                                                {propsFormCreateApplication.formState.errors.port && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.port?.message}</p>)}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Porta do Nó</label>
                                                <input required {...propsFormCreateApplication.register("node_port")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                                <p className="text-[10px]">Porta exposta em cada NODE do cluster. Permite acesso externo ao cluster.  (padrão: 30000-32767)</p>
                                                {propsFormCreateApplication.formState.errors.node_port && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.node_port?.message}</p>)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Porta Corrente</label>
                                                <input required {...propsFormCreateApplication.register("target_port")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                                <p className="text-[10px]">Porta do container (Pod) para onde o tráfego será encaminhado.</p>
                                                {propsFormCreateApplication.formState.errors.target_port && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.target_port?.message}</p>)}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Protocolo</label>
                                                <input required {...propsFormCreateApplication.register("protocol")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                                <p className="text-[10px]">Porta do container (Pod) para onde o tráfego será encaminhado.</p>
                                                {propsFormCreateApplication.formState.errors.protocol && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.protocol?.message}</p>)}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de exposição</label>
                                                <input required {...propsFormCreateApplication.register("type")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                                <p className="text-[10px]">Define como o Service será exposto na rede.</p>
                                                {propsFormCreateApplication.formState.errors.type && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.type?.message}</p>)}
                                            </div>
                                        </div>
                                        <p className='text-[12px] font-bold text-slate-600 uppercase ml-1'>Configurações de Publicação: </p>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Imagem Docker: </label>
                                            <input required {...propsFormCreateApplication.register("image")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium font-mono" placeholder="Ex: node:18-alpine" />
                                            {propsFormCreateApplication.formState.errors.image && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.image?.message}</p>)}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do container: </label>
                                            <input required {...propsFormCreateApplication.register("container_name")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium font-mono" placeholder="Ex: teste" />
                                            {propsFormCreateApplication.formState.errors.container_name && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.container_name?.message}</p>)}
                                        </div>

                                        <div className='grid grid-cols-2 gap-4'>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Réplicas (K8s)</label>
                                                <input type="number" min="1" {...propsFormCreateApplication.register("replicas")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" />
                                                {propsFormCreateApplication.formState.errors.replicas && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.replicas?.message}</p>)}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Politica de construção do container</label>
                                                <input required {...propsFormCreateApplication.register("image_pull_policy")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder="Ex: 8080" />
                                                <p className="text-[10px]">define quando o kubelet deve baixar a imagem do container do registry.</p>
                                                {propsFormCreateApplication.formState.errors.image_pull_policy && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.image_pull_policy?.message}</p>)}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ficheiros de Configuração (.yaml, .env, etc)</label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-cyan-400 hover:bg-cyan-50/30 transition-all cursor-pointer group"
                                            >
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                />
                                                <div className="p-3 bg-slate-100 rounded-full group-hover:bg-cyan-100 transition-colors">
                                                    <UploadCloud size={24} className="text-slate-400 group-hover:text-cyan-600" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-slate-600">Clique para anexar ficheiros</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">Manifestos, Secrets, Dockerfiles...</p>
                                                </div>
                                            </div>

                                            {/* Lista de Ficheiros Anexados */}
                                            {propsFormCreateApplication.watch("files").length > 0 && (
                                                <div className="grid grid-cols-1 gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                                    {propsFormCreateApplication.watch("files").map((file: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                    <FileText size={16} className="text-cyan-600" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                                                    <span className="text-[9px] text-slate-400 uppercase">{(file.size / 1024).toFixed(1)} KB</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(idx)}
                                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            <button type="button" onClick={async () => {
                                if (formData.type == "web") {
                                    if (await propsFormCreateApplication.trigger()) {
                                        startTransition(() => {
                                            formActionApplication(propsFormCreateApplication.watch());
                                        });
                                    }
                                } else if (formData.type == "infra") {
                                    if (await propsFormCreateInfrastructureComponent.trigger()) {
                                        startTransition(() => {
                                            formActionInfrastructureComponent(propsFormCreateInfrastructureComponent.watch());
                                        });
                                    }
                                }
                            }} className="w-full py-3 mt-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-100 flex items-center justify-center gap-2">
                                <Save size={18} /> Salvar no Cluster
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Sidebar - Menu Lateral */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-30">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="bg-cyan-500 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
                        <Layers className="text-white" size={20} />
                    </div>
                    <h1 className="font-bold text-white tracking-tight text-lg">CloudDeploy</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2 tracking-widest">Infraestrutura</p>
                    {[
                        { id: 'nodes-map', label: 'Mapa de Nodes', icon: Activity },
                        { id: 'files', label: 'Arquivos de Config', icon: FileCode },
                        { id: 'security', label: 'Políticas de Rede', icon: ShieldCheck },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (item.id == 'files') {
                                    setShowContentDetails(true);
                                }

                                if (item.id == 'nodes-map') {
                                    setShowContentDetails(false);
                                }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm ${activeTab === item.id ? 'bg-slate-800 text-white shadow-lg' : 'hover:bg-slate-800/50 text-slate-400'}`}
                        >
                            <item.icon size={18} className={activeTab === item.id ? 'text-cyan-400' : ''} />
                            {item.label}
                        </button>
                    ))}

                    {/* <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mt-6 mb-2 tracking-widest">Ambiente Ativado</p>
                    <div className="space-y-1">
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-cyan-500/10 text-cyan-400 text-sm">
                            <span className="flex items-center gap-2 font-medium"> <Globe size={16} /> Produção</span>
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                        </button>
                        <button onClick={() => console.log(process.env.NEXT_PUBLIC_ENVIRONMENT)} className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 text-sm opacity-60">
                            <Settings size={16} /> Staging
                        </button>
                    </div> */}

                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-xs">
                        <div className="flex justify-between items-center mb-2 text-slate-400">
                            <span className="flex items-center gap-1.5"><CardSim size={12} /> Memória Total</span>
                            <span className="text-cyan-400 font-bold">{computerMemory.freeSpace ? ((computerMemory.size / 1000000) * 0.001).toFixed(1) : computerMemory.size}gb</span>
                        </div>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div style={{
                                width: `${((((computerMemory.size / 1000000) * 0.001) - (computerMemory.freeSpace ? ((computerMemory.freeSpace / 1000000) * 0.001) : 0)) / ((computerMemory.size / 1000000) * 0.001)) * 100}%`
                            }} className="bg-cyan-500 h-full w-[42%] transition-all duration-1000"></div>
                        </div>
                    </div>
                    <div className="p-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full py-3 cursor-pointer bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-700/50 transition-colors"
                        >
                            <Plus size={18} /> Adicionar Serviço
                        </button>
                    </div>
                    <div className="p-4 border-t border-slate-800">
                        <button
                            type='button'
                            className="w-full py-3 cursor-pointer text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            onClick={() => {
                                startTransition(() => {
                                    formSignout()
                                })
                            }}
                        >
                            <LogOut size={16} /> Sair do Terminal
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main ref={contentPage} className="flex-1 flex flex-col relative overflow-hidden">

                {/* Header Superior */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-[100] shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="text-slate-400">
                            <ChevronRight size={20} />
                        </div>
                        <h2 className="text-lg font-semibold tracking-tight">
                            {activeTab === 'nodes-map' ? 'Visualização de Cluster' : 'Editor de Configuração'}
                        </h2>
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full text-[11px] font-bold text-green-600 border border-green-100 uppercase tracking-tighter">
                            <Activity size={12} /> CLUSTER: {process.env.NEXT_PUBLIC_CLUSTER_NAME}
                        </div>
                        {
                            process.env.NEXT_PUBLIC_ENVIRONMENT ?
                                <div className="flex items-center gap-2 bg-cyan-50 px-3 py-1 rounded-full text-[11px] font-bold text-cyan-600 border border-cyan-100 uppercase tracking-tighter">
                                    <Globe size={12} /> ENVIRONMENT: {process.env.NEXT_PUBLIC_ENVIRONMENT}
                                </div> : <></>
                        }
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showExportMenu ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Download size={16} /> Exportar
                            </button>

                            {showExportMenu && (
                                <>
                                    <div className="fixed inset-0 z-[10000]" onClick={() => setShowExportMenu(false)}></div>
                                    <div className="absolute right-0 z-[10000] mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={exportConfig}
                                            className="w-full flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><FileJson size={16} /></div>
                                            <div className="text-left">
                                                <div className="font-bold">Configurações</div>
                                                <div className="text-[10px] text-slate-400">Exportar estado atual (.json)</div>
                                            </div>
                                        </button>
                                        <div className="h-px bg-slate-100 mx-2 my-1"></div>
                                        <button
                                            onClick={exportMapImage}
                                            className="w-full flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><ImageIcon size={16} /></div>
                                            <div className="text-left">
                                                <div className="font-bold">Imagem do Mapa</div>
                                                <div className="text-[10px] text-slate-400">Exportar gráfico (.svg)</div>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-all active:scale-95">
                            <Save size={16} /> Salvar
                        </button> */}
                        <button
                            onClick={handleDeploy}
                            disabled={isDeploying}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer ${isDeploying ? 'bg-slate-400 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-200'
                                }`}
                        >
                            {isDeploying ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                            {isDeploying ? 'Deploying...' : 'Deploy'}
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden relative">

                    {/* Canvas Arrastável */}
                    <div className={`flex-1 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] overflow-hidden transition-all duration-500 ${activeTab !== 'nodes-map' ? 'opacity-30 scale-95 pointer-events-none' : 'opacity-100'}`}>
                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                            <button
                                type='button'
                                className="p-2 bg-white shadow-xl border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-transform active:scale-90"
                                onClick={() => {
                                    setScaleMap(scaleMap + 0.1);
                                }}
                            >
                                <Plus size={20} />
                            </button>
                            <button
                                type='button'
                                // disabled={scaleMap <= 1.0}
                                className="p-2 bg-white shadow-xl border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-transform active:scale-90"
                                onClick={() => {
                                    setScaleMap(scaleMap - 0.1);
                                }}
                            >
                                <Minus size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedNodeId(null);
                                    setShowContentDetails(false);
                                    activeSelectNode(!activedSelectNode);
                                }}
                                type={'button'}
                                className={cn(
                                    "p-2 shadow-xl border border-slate-200 rounded-lg transition-transform cursor-pointer",
                                    !activedSelectNode ?
                                        "bg-white text-slate-600 hover:bg-slate-50" :
                                        "bg-cyan-600 text-white scale-[1.1]"
                                )}
                            >
                                <MousePointer2 size={20} />
                            </button>
                            <button
                                onClick={() => setNodes(nodes.map(n => ({ ...n, position: { x: n.position.x + 5, y: n.position.y } })))}
                                className="p-2 bg-white shadow-xl border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-transform active:scale-90"
                            >
                                <Maximize2 size={20} />
                            </button>
                        </div>

                        {/* Nodes e Conexões */}
                        <MapInterator />

                        {/* Legenda Flutuante */}
                        <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest flex gap-4 z-20">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Service</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-800 border border-cyan-400"></div> Container</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Database</div>
                        </div>
                    </div>
                    {/* Sidebar de Detalhes / Editor */}
                    <div ref={contentDetailsRef} style={{ width: "800px" }} data-width={containerResizePositionMove ? containerResizePositionMove.x : 800} hidden={!showContentDetails} className={`relative border-l border-slate-200 bg-white flex flex-col shadow-2xl z-20 transform transition-transform duration-300 animate-fade-in-slide`}>
                        <div
                            className='bg-transparent w-5 hover:bg-gray-100 h-full absolute z-[1000] flex justify-center items-center cursor-col-resize text-transparent hover:text-black'
                            ref={containerResizeRef}
                            draggable
                            onDragEnd={(e) => {
                                const rect = contentPage.current.getBoundingClientRect();

                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;

                                setContainerResizeModePosition({
                                    x: rect.width - parseInt(x.toFixed(0)),
                                    y: parseInt(y.toFixed(0))
                                });
                            }}
                        >
                            <GripVertical />
                        </div>
                        {/* Abas do Editor */}
                        <div className="flex bg-slate-50 border-b border-slate-200 p-1 gap-1 overflow-x-auto overflow-y-hidden">
                            {Object.keys(fileTemplates).map(file => (
                                <button
                                    key={file}
                                    onClick={() => { setActiveFile(file); setActiveTab('files'); }}
                                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeFile === file && activeTab === 'files'
                                        ? 'bg-white text-cyan-600 shadow-sm border border-slate-200'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {file}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto">
                            {selectedNode && activeTab === 'nodes-map' ? (
                                /* Painel de Detalhes do Node Selecionado */
                                <div className="flex-1 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <span className="p-2 bg-slate-100 rounded-lg text-slate-600"><Settings size={20} /></span>
                                            Configuração do Node
                                        </h3>
                                        <div className='flex flex-row gap-2'>
                                            <button onClick={() => {
                                                setShowConfirmModal(true);
                                            }} className="p-1 hover:bg-red-100 rounded-full cursor-pointer text-red-400"><Trash size={20} /></button>
                                            <button onClick={() => {
                                                setSelectedNodeId(null)
                                                setShowContentDetails(false);
                                            }} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400"><X size={20} /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Métricas Atuais</div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Cpu size={14} /> CPU</div>
                                                    <div className="text-lg font-bold text-slate-800">{selectedNode.data.cpu}</div>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><HardDrive size={14} /> RAM</div>
                                                    <div className="text-lg font-bold text-slate-800">128MB</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Propriedades</label>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                                                    <span className="text-sm text-slate-500">Identificador</span>
                                                    <span className="text-sm font-mono font-bold text-slate-800">{selectedNode.id}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                                                    <span className="text-sm text-slate-500">Uptime</span>
                                                    <span className="text-sm font-bold text-green-600">{selectedNode.data.uptime}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            {/* <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors">
                                                <Terminal size={18} /> Abrir Terminal de Node
                                            </button> */}
                                            {
                                                localLogOfBuild.length > 0 && (
                                                    localLogOfBuild[0].logs.length > 0 &&
                                                    localLogOfBuild[0].operation == "start" &&
                                                    !localLogOfBuild[0].logs.map(x => x.short_log.split("-")[2].replaceAll(" ", "")).includes("die")
                                                ) ?
                                                    <div className='flex flex-row gap-4'>
                                                        <button
                                                            onClick={() => {
                                                                stopInfrastructureComponent();
                                                            }}
                                                            disabled={stopOperationLoading || destroyOperationLoading}
                                                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors cursor-pointer"
                                                        >
                                                            {stopOperationLoading ? <RefreshCw size={16} className="animate-spin" /> : <CircleSlash size={16} className="text-cyan-400" />}
                                                            {stopOperationLoading ? 'Stoping...' : 'Stop Deployment'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                destroyInfrastructureComponent();
                                                            }}
                                                            disabled={destroyOperationLoading || stopOperationLoading}
                                                            className="w-full items-center gap-2 flex items-center justify-center  py-3 rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer bg-red-600 disabled:bg-red-500 hover:bg-red-700 text-white shadow-red-200"
                                                        >
                                                            {destroyOperationLoading ? <RefreshCw size={16} className="animate-spin" /> : <CircleSlash size={16} className="text-white" />}
                                                            {destroyOperationLoading ? 'Destroying...' : 'Destroy Deployment'}
                                                        </button>
                                                    </div> :
                                                    <button
                                                        onClick={() => {
                                                            buildInfrastructureComponent();
                                                        }}
                                                        disabled={isDeploying || destroyOperationLoading || stopOperationLoading}
                                                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors cursor-pointer"
                                                    >
                                                        {isDeploying ? <RefreshCw size={16} className="animate-spin" /> : <Code size={16} className="text-cyan-400" />}
                                                        {isDeploying ? 'Deploying...' : 'Deploy'}
                                                    </button>
                                            }
                                            <button
                                                type='button'
                                                onClick={async () => {
                                                    if (selectedNode.id.includes("infra")) {
                                                        const serviceResponse = await fetch(`${window.location.href}/api/infrastructure-component/${selectedNode.code}`, { method: "GET" });
                                                        const responseJson: InfrastructureComponent = await serviceResponse.json();
                                                        propsFormUpdateInfrastructureComponent.reset({
                                                            ...responseJson
                                                        });

                                                        setShowEditInfrastructureModal(true);
                                                    } else {
                                                        const serviceResponse = await fetch(`${window.location.href}/api/applications/${selectedNode.code}`, { method: "GET" });
                                                        const responseJson: Application = await serviceResponse.json();
                                                        propsFormUpdateApplication.reset({
                                                            ...responseJson,
                                                            port: `${responseJson.port}`,
                                                            node_port: `${responseJson.node_port}`,
                                                            target_port: `${responseJson.target_port}`,
                                                            replicas: `${responseJson.replicas}`
                                                        });

                                                        setShowEditAppplicationModal(true);
                                                    }
                                                }}
                                                className="w-full py-3 border mt-2 cursor-pointer border-slate-900 text-slate-900 rounded-xl font-bold flex items-center cursor-pointer justify-center gap-2 hover:text-white hover:bg-slate-900 transition-colors"
                                                disabled={isDeploying || destroyOperationLoading || stopOperationLoading}
                                            >
                                                <Edit size={18} /> Editar Serviço
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Editor de Código */
                                <div className="flex-1 relative overflow-hidden group bg-slate-900">
                                    <textarea
                                        className="w-full h-full p-8 font-mono text-sm bg-slate-900 text-cyan-50/90 outline-none resize-none selection:bg-cyan-500/30 leading-relaxed scrollbar-hide"
                                        spellCheck="false"
                                        value={dockerComposeDocument}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Console Integrado */}
                        <div className="p-5 bg-white border-t border-slate-100">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Console de Eventos</span>
                                <span className="flex items-center gap-2 text-[10px] font-bold text-cyan-500">
                                    <div className={`w-1.5 h-1.5 rounded-full bg-cyan-500 ${isDeploying ? 'animate-ping' : ''}`}></div>
                                    {isDeploying ? 'EXECUTANDO DEPLOY' : 'SISTEMA PRONTO'}
                                </span>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-400 h-40 overflow-y-auto space-y-1.5 shadow-inner border border-slate-800">
                                {isDeploying ? (
                                    <>
                                        <p className="text-cyan-400 animate-pulse"># Iniciando pipeline de deploy...</p>
                                        <p className="text-slate-300">{" >> Building images from Dockerfile"}</p>
                                        <p className="text-slate-300">{" >> Pushing to gcr.io/clouddeploy/api:v1.2"}</p>
                                        <p className="text-green-500">{" >> Image build success!"}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-slate-500 opacity-80 italic"># Aguardando comandos...</p>
                                        <p className="flex gap-2"><span>[14:22:01]</span> <span className="text-slate-500">Ambiente de Produção carregado.</span></p>
                                        {
                                            localLogOfBuild.length > 0 ?
                                                localLogOfBuild.map((stream, indexStream) => {
                                                    return (
                                                        <div key={indexStream}>
                                                            <p>operation: {stream.operation}</p>
                                                            {
                                                                stream.logs.map((log, indexLog) => (
                                                                    <div key={indexLog}><p className="flex gap-2 text-cyan-500"><span>{`[${new Date(log.time * 1000).toLocaleDateString()}]`}</span>{log.short_log}</p></div>
                                                                ))
                                                            }
                                                        </div>
                                                    )
                                                }) :
                                                <></>
                                        }
                                        {/* {(localLogOfBuild.length > 0) && <p className="flex gap-2 text-cyan-500"><span>[14:25:42]</span> {localLogOfBuild.includes("\n") ? localLogOfBuild.split("\n").map(x => (<>{x} <br/></>)): localLogOfBuild}</p>} */}
                                    </>
                                )}
                                <p className="text-slate-500 animate-pulse">_</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Estilos Globais */}
        </div>
    );
}