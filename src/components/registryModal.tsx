'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import Create from "@pedreiro-web/app/actions/application/create";
import CreateInfrastructureComponent from "@pedreiro-web/app/actions/infrastructure-component/create";
import { ApplicationCreate, ApplicationFileCreate, ApplicationUpdate, ApplicationValidator } from "@pedreiro-web/infrastructure/repository/types/application";
import { InfrastructureComponentCommandCreate, InfrastructureComponentCommandValidator, InfrastructureComponentCreate, InfrastructureComponentEnvironmentCreate, InfrastructureComponentEnvironmentValidator, InfrastructureComponentFileUpdate, InfrastructureComponentLabelCreate, InfrastructureComponentLabelValidator, InfrastructureComponentNetworkCreate, InfrastructureComponentNetworkValidator, InfrastructureComponentPortCreate, InfrastructureComponentPortValidator, InfrastructureComponentValidator, InfrastructureComponentVolumeCreate, InfrastructureComponentVolumeValidator } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { fileToBase64 } from "@pedreiro-web/util/inputFile";
import { FileText, Minus, Plus, PlusCircle, Save, Trash2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export default function RegistryModal({
    showAddModal,
    setShowAddModal,
    setFileContents,
    setNodes,
    showNotify
}: {
    showAddModal: boolean
    setShowAddModal: any
    setFileContents: any
    setNodes: any
    showNotify: any
}) {
    const [stateApplication, formActionApplication, pendingCreateApplication] = useActionState(Create, { status: 200 });
    const [stateCreateInfrastructureComponent, formActionInfrastructureComponent, pendingCreateInfrastructureComponent] = useActionState(CreateInfrastructureComponent, { status: 200 });

    const router = useRouter();


    const typesInfrastructureComponent: any = {
        "db": "database",
        "mq": "service",
        "redis": "database",
        "sftr": "service" // software resource
    }

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
            files: [],
            position_x: 200 + Math.random() * 200,
            position_y: 200 + Math.random() * 100
        }
    });

    const [formData, setFormData] = useState({
        name: '',
        type: 'web',
        subType: 'db',
        image: '',
        port: '',
        replicas: '1'
    });

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

    const handleFileChangeCreateInfrastructureComponent = async (e: any) => {
        const files: File[] = Array.from(e.target.files);
        const applicationFiles: InfrastructureComponentFileUpdate[] = [];
        for (let index = 0; index < files.length; index++) {
            const element = files[index];
            const elementParsed: string = await fileToBase64(element);

            applicationFiles.push({
                file: elementParsed,
                name: element.name
            });
        }

        propsFormCreateInfrastructureComponent.setValue("files", [
            ...propsFormCreateInfrastructureComponent.watch("files"),
            ...applicationFiles
        ]);

        e.target.value = '';
    };

    const propsFormUpdateApplication = useForm<ApplicationUpdate>({
        resolver: zodResolver(ApplicationValidator),
        defaultValues: {
            files: []
        }
    });

    const removeFile = (index: number) => {
        propsFormUpdateApplication.setValue("files", propsFormUpdateApplication.watch("files").filter((x, indexFile) => indexFile != index));
    };

    const removeFileInfrastructureComponent = (index: number) => {
        propsFormCreateInfrastructureComponent.setValue("files", propsFormCreateInfrastructureComponent.watch("files").filter((x, indexFile) => indexFile != index));
    };

    if (!showAddModal) {
        return <></>;
    }

    return (
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
                                        onChange={handleFileChangeCreateInfrastructureComponent}
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
                                {propsFormCreateInfrastructureComponent.watch("files").length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                        {propsFormCreateInfrastructureComponent.watch("files").map((file: any, idx: number) => (
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
                                                    onClick={() => removeFileInfrastructureComponent(idx)}
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
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Segredo de imagem: </label>
                                    <input required {...propsFormCreateApplication.register("image_pull_secret")} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium font-mono" placeholder="Ex: example" />
                                    {propsFormCreateApplication.formState.errors.image_pull_secret && (<p className='text-[12px] text-red-500 font-bold'>{propsFormCreateApplication.formState.errors.image_pull_secret?.message}</p>)}
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
    )
}