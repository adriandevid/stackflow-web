'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import UpdateApplication from "@pedreiro-web/app/actions/application/update";
import { ApplicationFileUpdate, ApplicationUpdate, ApplicationValidator } from "@pedreiro-web/infrastructure/repository/types/application";
import { fileToBase64 } from "@pedreiro-web/util/inputFile";
import { FileText, PlusCircle, Save, Trash2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

export default function EditApplicationModal({
    showEditApplicationModal,
    setShowEditAppplicationModal,
    showNotify
}: {
    showEditApplicationModal: boolean
    setShowEditAppplicationModal: any
    showNotify: any
}) {
    const [stateApplicationUpdate, formActionApplicationUpdate, pendingUpdateApplication] = useActionState(UpdateApplication, { status: 200 });
    const router = useRouter();

    useEffect(function () {
        if (stateApplicationUpdate.status == 200 && stateApplicationUpdate.data) {
            setShowEditAppplicationModal(false);
            showNotify(`Serviço ${stateApplicationUpdate.data.name} atualizado!`);
            router.refresh();
        }
    }, [stateApplicationUpdate])

    const propsFormUpdateApplication = useForm<ApplicationUpdate>({
        resolver: zodResolver(ApplicationValidator),
        defaultValues: {
            files: []
        }
    });

    const fileInputUpdateRef = useRef<any>(null);

    const handleFileChange = async (e: any) => {
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

    if (!showEditApplicationModal) {
        return <></>
    }

    return (
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