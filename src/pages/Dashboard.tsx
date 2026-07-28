import { Instagram, Activity, Zap, CheckCircle, BarChart3, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function Dashboard() {
  const [stats, setStats] = useState({ rulesCount: '0', logsCount: '0', successRate: '100%' });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      try {
        const rulesSnapshot = await getDocs(collection(db, "rules"));
        const logsSnapshot = await getDocs(collection(db, "logs"));
        
        const totalLogs = logsSnapshot.docs.length;
        const sentLogs = logsSnapshot.docs.filter(doc => doc.data().status === 'sent').length;
        const successRate = totalLogs > 0 ? ((sentLogs / totalLogs) * 100).toFixed(1) + '%' : '100%';
        
        setStats({
          rulesCount: rulesSnapshot.docs.length.toString(),
          logsCount: totalLogs.toString(),
          successRate
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, [user]);

  const statsCards = [
    { name: 'Total Automations', value: stats.rulesCount, change: '+1', icon: Zap, trend: 'up' },
    { name: 'DMs Sent (30d)', value: stats.logsCount, change: '+12%', icon: Activity, trend: 'up' },
    { name: 'Success Rate', value: stats.successRate, change: '0%', icon: CheckCircle, trend: 'up' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your Instagram automations today.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20">
          <Instagram className="w-4 h-4" />
          Connect Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statsCards.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.name} 
            className="bg-white dark:bg-[#111111] p-5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <stat.icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                {stat.change}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200/60 dark:border-white/10 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              Message Delivery Activity
            </h3>
          </div>
          <div className="p-5 flex-1 flex items-center justify-center min-h-[250px] bg-slate-50/50 dark:bg-transparent">
             {/* Chart placeholder */}
             <div className="text-center">
               <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                 <Activity className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
               </div>
               <p className="text-sm font-medium text-slate-900 dark:text-white">Not enough data yet</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] mx-auto">Connect your account and create a rule to start seeing activity.</p>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200/60 dark:border-white/10">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Instagram className="w-4 h-4 text-slate-400" />
              Connected Accounts
            </h3>
          </div>
          <div className="p-2 flex-1">
            {accounts.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No accounts connected.
              </div>
            ) : (
              accounts.map((acc, i) => (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-default group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 rounded-full flex items-center justify-center p-[2px]">
                      <div className="w-full h-full bg-white dark:bg-black rounded-full flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-slate-900 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">@{acc.username}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Professional Account</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </div>
              ))
            )}
            
            <button 
              onClick={handleConnect}
              className="w-full mt-2 py-2 px-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors border border-dashed border-slate-200 dark:border-white/10"
            >
              <Plus className="w-3 h-3" /> Add another account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
