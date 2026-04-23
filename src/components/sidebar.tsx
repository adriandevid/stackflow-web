'use client';

import Signout from "@pedreiro-web/app/actions/authentication/signout";
import { Activity, CardSim, FileCode, Layers, LogOut, Plus, ServerCrash, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";

export default function Sidebar({
    setActiveTab,
    activeTab,
    setShowContentDetails,
    computerMemory,
    setShowAddModal
}: {
    setActiveTab: any
    activeTab: any
    setShowContentDetails: any
    computerMemory: any
    setShowAddModal: any
}) {

    const [stateSignout, formSignout, pendingSignout] = useActionState(Signout, {});


    useEffect(function () {
        if (stateSignout.status == 200 || stateSignout.status == 401 || stateSignout.status == 404) {
            redirect("/login");
        }
    }, [stateSignout])
    
    return (
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
                    { id: 'docker-images-hub', label: 'Repositórios de imagens', icon: ServerCrash }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            if (item.id == 'files' || item.id == 'docker-images-hub') {
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
                {/* <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-xs">
                    <div className="flex justify-between items-center mb-2 text-slate-400">
                        <span className="flex items-center gap-1.5"><CardSim size={12} /> Memória Total</span>
                        <span className="text-cyan-400 font-bold">{computerMemory.freeSpace ? ((computerMemory.size / 1000000) * 0.001).toFixed(1) : computerMemory.size}gb</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div style={{
                            width: `${((((computerMemory.size / 1000000) * 0.001) - (computerMemory.freeSpace ? ((computerMemory.freeSpace / 1000000) * 0.001) : 0)) / ((computerMemory.size / 1000000) * 0.001)) * 100}%`
                        }} className="bg-cyan-500 h-full w-[42%] transition-all duration-1000"></div>
                    </div>
                </div> */}
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
    )
}