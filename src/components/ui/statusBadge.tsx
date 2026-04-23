export default function StatusBadge({ active }: any) {
    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
            {active ? 'ATIVO' : 'OFFLINE'}
        </div>
    )
};