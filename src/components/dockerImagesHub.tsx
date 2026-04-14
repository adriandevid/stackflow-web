'use client';

import { Plus, Settings, Trash, X } from "lucide-react";

export default function DockerImagesHub() {
    return (
        <div className="flex-1 p-6 animate-in fade-in slide-in-from-right-4 duration-300 w-[100rem] h-full bg-white">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3">
                    <span className="p-2 bg-slate-100 rounded-lg text-slate-600"><Settings size={20} /></span>
                    Docker image registres
                </h3>
                <div className='flex flex-row gap-2'>
                    <button onClick={() => {
                        //setShowConfirmModal(true);
                    }} className="p-1 hover:bg-red-100 rounded-full cursor-pointer text-red-400"><Trash size={20} /></button>
                    <button onClick={() => {
                        //setSelectedNodeId(null)
                        //setShowContentDetails(false);
                    }} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400"><X size={20} /></button>
                </div>
            </div>
            <div className='flex flex-row gap-4'>
                <div className='flex flex-row gap-4'>
                    <div className="space-y-1">
                        <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='ex: ./past1:/past2' />
                    </div>
                    {/* <div className="space-y-1">
                          <input type="text" className=" w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm font-medium" placeholder='valor' />
                        </div> */}
                    <div className="space-y-1">
                        <button type='button' onClick={async () => { }} className='text-sm bg-sky-500 flex-1 rounded-lg text-white w-10 h-10 flex flex-row justify-center items-center'><Plus size={20}></Plus></button>
                    </div>
                </div>
            </div>
        </div>
    )
}