'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import UpdateInfrastructureComponent from "@pedreiro-web/app/actions/infrastructure-component/update";
import { InfrastructureComponentCommandCreate, InfrastructureComponentCommandValidator, InfrastructureComponentEnvironmentCreate, InfrastructureComponentEnvironmentValidator, InfrastructureComponentFileUpdate, InfrastructureComponentLabelCreate, InfrastructureComponentLabelValidator, InfrastructureComponentNetworkCreate, InfrastructureComponentNetworkValidator, InfrastructureComponentPortCreate, InfrastructureComponentPortValidator, InfrastructureComponentUpdate, InfrastructureComponentValidator, InfrastructureComponentVolumeCreate, InfrastructureComponentVolumeValidator } from "@pedreiro-web/infrastructure/repository/types/infrastructure-component";
import { fileToBase64 } from "@pedreiro-web/util/inputFile";
import { PlusCircle, X, Plus, Minus, UploadCloud, FileText, Trash2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

export default function EditInfrastructureComponentModal({
    showEditInfrastructureModal,
    setShowEditInfrastructureModal,
    infrastructureComponent,
    showNotify
}: {
    showEditInfrastructureModal: boolean
    setShowEditInfrastructureModal: any
    infrastructureComponent: any
    showNotify: any
}) {
    const [stateUpdateInfrastructureComponent, formActionUpdateInfrastructureComponent, pendingUpdateInfrastructureComponent] = useActionState(UpdateInfrastructureComponent, { status: 200 });
    const router = useRouter();

    useEffect(function () {
        if (stateUpdateInfrastructureComponent.status == 200 && stateUpdateInfrastructureComponent.data) {
            setShowEditInfrastructureModal(false);
            showNotify(`Serviço ${stateUpdateInfrastructureComponent.service_key} atualizado!`);
            router.refresh();
        }
    }, [stateUpdateInfrastructureComponent])

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

    const propsFormUpdateInfrastructureComponent = useForm<InfrastructureComponentUpdate>({
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

    useEffect(function () {
        propsFormUpdateInfrastructureComponent.reset({ ...infrastructureComponent });
    }, [infrastructureComponent])

    const fileInputUpdateRef = useRef<any>(null);

    const removeFile = (index: number) => {
        propsFormUpdateInfrastructureComponent.setValue("files", propsFormUpdateInfrastructureComponent.watch("files").filter((x, indexFile) => indexFile != index));
    };

    const handleFileChange = async (e: any) => {
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

        propsFormUpdateInfrastructureComponent.setValue("files", [
            ...propsFormUpdateInfrastructureComponent.watch("files"),
            ...applicationFiles
        ]);

        e.target.value = '';
    };

    if (!showEditInfrastructureModal || infrastructureComponent.id  == undefined) {
        return <></>
    }

    return (
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
                                    <option value="sftr">Software Resource</option>
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
                            {propsFormUpdateInfrastructureComponent.watch("files").length > 0 && (
                                <div className="grid grid-cols-1 gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                    {propsFormUpdateInfrastructureComponent.watch("files").map((file: any, idx: number) => (
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