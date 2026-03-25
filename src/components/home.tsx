'use client';

import io, { Socket } from 'socket.io-client';
import { useState, useEffect, useMemo, useRef, useActionState, startTransition } from 'react';
import {
    Zap,
    RefreshCw,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { Application, ApplicationUpdate, ApplicationValidator } from '@pedreiro-web/infrastructure/repository/types/application';
import { zodResolver } from '@hookform/resolvers/zod';
import {  useForm } from 'react-hook-form';
import { Edge } from '@pedreiro-web/infrastructure/repository/types';
import { InfrastructureComponent, InfrastructureComponentUpdate, InfrastructureComponentValidator, Log } from '@pedreiro-web/infrastructure/repository/types/infrastructure-component';
import { useRouter } from 'next/navigation';
import DeleteInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/delete';
import DeleteApplication from '@pedreiro-web/app/actions/application/delete';
import { MemoryInformations } from '@pedreiro-web/util/plataform';
import UpdateStateInfrastructureComponent from '@pedreiro-web/app/actions/infrastructure-component/updateState';
import UpdateStateApplication from '@pedreiro-web/app/actions/application/updateState';
import ContentArea from './contentArea';
import HeaderContent from './headerContent';
import RegistryModal from './registryModal';
import Sidebar from './sidebar';
import EditInfrastructureComponentModal from './editInfrastructureComponentModal';
import EditApplicationModal from './editApplicationModal';

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

    const [notification, setNotification] = useState<any>(null);

    const showNotify = (text: any) => {
        setNotification(text);
        setTimeout(() => setNotification(null), 3000);
    };

    const canvasRef = useRef<any>(null);

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    
    const [fileContents, setFileContents] = useState<any>({
        'docker-compose.yml': `version: '3.8'\nservices:\n  api:\n    build: ./backend\n    ports:\n      - "5000:5000"\n    depends_on:\n      - db\n  web:\n    image: nginx:stable\n    ports:\n      - "80:80"\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_PASSWORD: example`,
        'deployment.yml': `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-deployment\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: backend-api\n  template:\n    metadata:\n      labels:\n        app: backend-api\n    spec:\n      containers:\n      - name: api\n        image: backend-image:v1`,
        'Dockerfile': `FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 5000\nCMD ["npm", "start"]`,
        'service.yml': `apiVersion: v1\nkind: Service\nmetadata:\n  name: api-service\nspec:\n  selector:\n    app: backend-api\n  ports:\n    - protocol: TCP\n      port: 80\n      targetPort: 5000`
    });

    
    const [stateApplicationDelete, formActionApplicationDelete, pendingDeleteApplication] = useActionState(DeleteApplication, { status: 200 });
    const [stateDeleteInfrastructureComponent, formActionDeleteInfrastructureComponent, pendingDeleteInfrastructureComponent] = useActionState(DeleteInfrastructureComponent, { status: 200 });

    const propsFormUpdateApplication = useForm<ApplicationUpdate>({
        resolver: zodResolver(ApplicationValidator),
        defaultValues: {
            files: []
        }
    });

    const propsFormUpdateInfrastructureComponent = useForm<InfrastructureComponentUpdate>({
        resolver: zodResolver(InfrastructureComponentValidator),
        defaultValues: {
            files: []
        }
    });

    const router = useRouter();

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

    const [showEditInfrastructureModal, setShowEditInfrastructureModal] = useState<boolean>(false);
    const [showEditApplicationModal, setShowEditAppplicationModal] = useState<boolean>(false);

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

    const [dockerComposeDocument, setDockerComposeDocument] = useState<string>();

    const loadDockerCompose = async () => {
        //http://localhost:3000/api/read-file/docker-compose
        const requestResponse = await fetch("http://localhost:3000/api/read-file/docker-compose", { method: "GET" });
        const responseJson: { content: string } = await requestResponse.json();
        setDockerComposeDocument(responseJson.content);
    }

    const contentPage = useRef<any>(null);

    useEffect(function () {
        loadDockerCompose();
    }, [])

    const [showContentDetails, setShowContentDetails] = useState<boolean>(false);

    const [localLogOfBuild, setLocalLogOfBuild] = useState<{ operation: string, resource: string, logs: Log[] }[]>([]);

    const [stateUpdateStateOfComponent, formActionUpdateStateOfComponent, pendingUpdateStateOfComponent] = useActionState(UpdateStateInfrastructureComponent, undefined);
    const [stateUpdateStateOfApplication, formActionUpdateStateOfApplication, pendingUpdateStateOfApplication] = useActionState(UpdateStateApplication, undefined);

    const [socket, setSocket] = useState<Socket | undefined>();

    useEffect(function () {
        if (socket) {
            socket.on(`logs-container`, (msg) => {
                var stream: { resource: string, operation: string, logs: Log[] }[] = JSON.parse(msg);
                setLocalLogOfBuild(stream);
            })

            socket.on("update-state-resource", (message: { resource: string; state: string }) => {
                var infrastructureComponent = infrastructureComponentsSource.filter(x => x.service_key == message.resource)[0];
                var application = applicationsSource.filter(x => x.name == message.resource)[0];

                if (infrastructureComponent) {
                    startTransition(function () {
                        formActionUpdateStateOfComponent(infrastructureComponent.id);
                    })
                }

                if (application) {
                    startTransition(function () {
                        formActionUpdateStateOfApplication({
                            id: application.id!,
                            state: message.state
                        });
                    })
                }
            })
        }
    }, [socket])

    const [loading, isLoading] = useState<boolean>(false);

    const loadLogsOfService = async () => {
        if (selectedNode.id.includes("infra")) {
            const request = await fetch(`${window.location.href}/api/logs/infrastructure-component/${selectedNode.code}`, { method: "GET" });
            const response: { resource: string, operation: string, logs: Log[] }[] = await request.json();
            setLocalLogOfBuild([...response]);
        } else {
            const request = await fetch(`${window.location.href}/api/logs/application/${selectedNode.code}`, { method: "GET" });
            const response: { resource: string, operation: string, logs: Log[] }[] = await request.json();
            setLocalLogOfBuild([...response]);
        }
    }

    useEffect(function () {
        if (selectedNode) {
            loadLogsOfService();
        }
    }, [selectedNodeId])

    useEffect(function () {
        if (stateUpdateStateOfComponent && stateUpdateStateOfComponent.status == 200) {
            router.refresh();
            isLoading(false);
        }
    }, [stateUpdateStateOfComponent])

    useEffect(function () {
        if (stateUpdateStateOfApplication && stateUpdateStateOfApplication.status == 200) {
            router.refresh();
            isLoading(false);
        }
    }, [stateUpdateStateOfApplication])


    useEffect(function () {
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        return () => {
            newSocket.close();
        }
    }, []);

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

            <EditInfrastructureComponentModal
                showEditInfrastructureModal={showEditInfrastructureModal}
                setShowEditInfrastructureModal={setShowEditInfrastructureModal}
                showNotify={showNotify}
            />

            <EditApplicationModal 
                showEditApplicationModal={showEditApplicationModal} 
                setShowEditAppplicationModal={setShowEditAppplicationModal} 
                showNotify={showNotify}
            />

            {/* Modal de Cadastro */}
            <RegistryModal
                showAddModal={showAddModal}
                setShowAddModal={setShowAddModal}
                setFileContents={setFileContents}
                setNodes={setNodes}
                showNotify={showNotify}
            />

            {/* Sidebar - Menu Lateral */}
            <Sidebar
                setActiveTab={setActiveTab}
                activeTab={activeTab}
                setShowContentDetails={setShowContentDetails}
                computerMemory={computerMemory}
                setShowAddModal={setShowAddModal}
            />

            {/* Main Content */}
            <main ref={contentPage} className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header Superior */}
                <HeaderContent
                    setIsDeploying={setIsDeploying}
                    activeTab={activeTab}
                    nodes={nodes}
                    showNotify={showNotify}
                    fileTemplates={fileTemplates}
                    canvasRef={canvasRef}
                    isDeploying={isDeploying}
                />

                {/* Content Area */}
                <ContentArea
                    nodes={nodes}
                    showNotify={showNotify}
                    setNodes={setNodes}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedNode={selectedNode}
                    setSelectedNodeId={setSelectedNodeId}
                    setShowConfirmModal={setShowConfirmModal}
                    loading={loading}
                    isLoading={isLoading}
                    canvasRef={canvasRef}
                    setIsDeploying={setIsDeploying}
                    isDeploying={isDeploying}
                    editResourceAction={async function (resourceId: string) {
                        if (resourceId.includes("infra")) {
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
                    contentPage={contentPage}
                    dockerComposeDocument={dockerComposeDocument}
                    localLogOfBuild={localLogOfBuild}
                    loadLogsOfService={loadLogsOfService}
                    fileTemplates={fileTemplates}
                    edgesSource={edgesSource}
                    infrastructureComponentsSource={infrastructureComponentsSource}
                    applicationsSource={applicationsSource}
                    fileContents={fileContents}
                    setFileContents={setFileContents}
                    selectedNodeId={selectedNodeId}
                    setShowContentDetails={setShowContentDetails}
                    showContentDetails={showContentDetails}
                />
            </main>
        </div>
    );
}