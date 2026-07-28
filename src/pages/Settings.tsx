import { motion } from "motion/react";
import { User, Bell, Shield, Key } from "lucide-react";

export function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account preferences and integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-transparent">
            <User className="w-4 h-4" /> Account
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Shield className="w-4 h-4" /> Privacy
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Key className="w-4 h-4" /> API Keys
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-6"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Profile Information</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Update your personal details here.</p>
            
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  defaultValue="Alex Developer"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="alex@example.com"
                  disabled
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-md text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="pt-2">
                <button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
