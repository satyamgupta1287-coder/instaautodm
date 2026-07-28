import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Activity, 
  ListOrdered,
  LogOut,
  Instagram,
  Sparkles
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { auth } from "../lib/firebase";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Automations', href: '/rules', icon: ListOrdered },
  { name: 'Activity', href: '/logs', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Sidebar */}
      <div className="w-[240px] flex-shrink-0 bg-[#f4f4f5] dark:bg-[#111111] border-r border-slate-200/60 dark:border-white/5 flex flex-col">
        <div className="h-14 flex items-center px-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span>InstaAutoDM</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 relative group",
                  isActive 
                    ? "text-slate-900 dark:text-white" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-white dark:bg-white/10 rounded-md shadow-sm border border-slate-200/50 dark:border-transparent"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-4 h-4 relative z-10 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-3">
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-2.5 px-2.5 py-1.5 w-full rounded-md text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-5xl mx-auto p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
