'use client';

import BuildAllComponents from "@pedreiro-web/app/actions/build_all";
import { Activity, ChevronRight, Download, FileJson, Globe, ImageIcon, Play, RefreshCw } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { Node } from "./mapInterator";
import { domToPng } from 'modern-screenshot';

export default function HeaderContent({
    setIsDeploying,
    activeTab,
    nodes,
    fileTemplates,
    showNotify,
    canvasRef,
    isDeploying
}: {
    setIsDeploying: any
    activeTab: string
    nodes: Node[]
    showNotify: any
    fileTemplates: any
    canvasRef: any
    isDeploying: boolean
}) {

    const [stateBuildAllComponents, formActionBuildAllComponents, pendingBuildAllComponents] = useActionState(BuildAllComponents, undefined);
    const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

    const handleDeploy = () => {
        setIsDeploying(true);

        startTransition(function () {
            formActionBuildAllComponents();
        })
    };


    const exportMapImage = () => {
        if (!canvasRef.current) return;

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


    return (
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
    )
}