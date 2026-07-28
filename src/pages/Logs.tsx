import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, Filter, RefreshCw, Activity } from "lucide-react";
import { Log } from "../types";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "logs"),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username || "unknown",
          comment: data.commentText || "",
          status: data.status || "pending",
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          ruleId: data.ruleId
        };
      }) as Log[];
      
      setLogs(fetchedLogs);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const getStatusIcon = (status: Log['status']) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: Log['status']) => {
    switch (status) {
      case 'sent': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">Sent</span>;
      case 'failed': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/50 dark:border-red-500/20">Failed</span>;
      case 'pending': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-500/20">Pending</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Activity Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time monitoring of all automated DMs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-white dark:bg-[#111111] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
        <ul className="divide-y divide-slate-200/60 dark:divide-white/5">
          {logs.map((log, i) => (
            <motion.li 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={log.id} 
              className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-default"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5 p-1.5 bg-slate-50 dark:bg-white/5 rounded-md border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                    {getStatusIcon(log.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-slate-900 dark:text-white">@{log.username}</p>
                      <span className="text-slate-300 dark:text-slate-600 text-xs">•</span>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400">{format(log.timestamp, 'MMM d, h:mm a')}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-[13px] text-slate-600 dark:text-slate-400">
                        Commented: <span className="font-medium text-slate-800 dark:text-slate-200">"{log.comment}"</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  {getStatusBadge(log.status)}
                </div>
              </div>
            </motion.li>
          ))}
          {logs.length === 0 && (
            <li className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">No activity yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] mx-auto">Logs will appear here once your rules are triggered.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
