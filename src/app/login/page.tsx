'use client';

import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Layers, Lock, ShieldCheck, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import Signin from "./actions/signin";
import { z } from 'zod';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
    password: z.string().min(1, { message: "Informe a senha do usuário!" }),
    user: z.string().min(1, { message: "Informe o usuário!" })
});

export default function Page() {
    const router = useRouter();

    const [stateSignin, formSignin, pendingSignin] = useActionState(Signin, {});

    const { watch, formState: { errors }, trigger, register, handleSubmit } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {}
    });

    useEffect(function () {
        if (stateSignin.status == 200) {
            router.replace("/")
        }
    }, [stateSignin])

    const query = useSearchParams();

    const [notification, setNotification] = useState<any>(null);

    const showNotify = (text: any) => {
        setNotification(text);
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(function () {
        var statusParam = query.get("status")
        if (statusParam != null) {
            showNotify("Usuário não autorizado!");
            router.replace('/login', { scroll: true });
        }
    }, [])

    return (
        <div className="h-screen w-full bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {notification && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CheckCircle2 className="text-cyan-400" size={20} />
                    <span className="text-sm font-bold">{notification}</span>
                </div>
            )}
            {/* Elementos Decorativos de Fundo */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full"></div>
                <div className="w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"></div>
            </div>

            <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl mb-6 shadow-2xl shadow-cyan-500/10">
                        <Layers size={48} className="text-cyan-400" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">CloudDeploy</h1>
                    <p className="text-slate-400 text-sm font-medium">Terminal de Gerenciamento de Infraestrutura</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                    <form onSubmit={handleSubmit((data) => {
                        startTransition(() => {
                            formSignin(data);
                        });
                    })} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    {...register("user")}
                                    placeholder="Usuário"
                                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all font-mono"
                                />
                            </div>
                            {errors.user && (
                                <p className="text-red-400 text-[10px] font-bold mt-2 ml-1 flex items-center gap-1 animate-pulse">
                                    <AlertTriangle size={12} /> {errors.user.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    autoFocus
                                    type="password"
                                    {...register("password")}
                                    placeholder="Insira seu token de acesso..."
                                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all font-mono"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-[10px] font-bold mt-2 ml-1 flex items-center gap-1 animate-pulse">
                                    <AlertTriangle size={12} /> {errors.password.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={pendingSignin}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-cyan-900/20 flex items-center justify-center gap-2 group active:scale-[0.98]"
                        >
                            Acessar Dashboard
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <ShieldCheck size={14} className="text-green-500" />
                            AES-256 ENCRYPTION
                        </div>
                        <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <Activity size={14} className="text-cyan-500" />
                            LIVE STATUS
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-600 text-[10px] font-bold tracking-widest uppercase">
                    Sistema Restrito &bull; Acesso Monitorado
                </p>
            </div>
        </div>
    )
}