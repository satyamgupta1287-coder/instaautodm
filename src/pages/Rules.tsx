import { Plus, Search, MoreHorizontal, Play, Square, Settings2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Rule } from "../types";
import { motion } from "motion/react";
import { db } from "../lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function Rules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    // In a real app we might filter by accountId or userId
    const q = query(collection(db, "rules"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rule[];
      setRules(fetchedRules);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const toggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "rules", ruleId), {
        isActive: !currentStatus
      });
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const createDummyRule = async () => {
    try {
      await addDoc(collection(db, "rules"), {
        name: "Welcome Message",
        keyword: "send link",
        matchType: "contains",
        template: "Here is your requested link: https://example.com",
        isActive: true,
        createdAt: new Date().toISOString(),
        userId: user?.uid,
        accountId: "dummy_account_id"
      });
    } catch (error) {
      console.error("Error creating rule:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Automations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your active comment-to-DM rules.</p>
        </div>
        <button 
          onClick={createDummyRule}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Rule
        </button>
      </div>

      <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200/60 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search automations..." 
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-500/50 dark:text-white"
            />
          </div>
          <button className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/5">
             <Settings2 className="w-4 h-4" />
          </button>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/60 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#111111]">
              <th className="px-5 py-3 w-[40%]">Rule Details</th>
              <th className="px-5 py-3">Trigger Keyword</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 bg-white dark:bg-[#111111]">
            {rules.map((rule, i) => (
              <motion.tr 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={rule.id} 
                className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-[14px] text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer">{rule.name}</div>
                  <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-md">{rule.template}</div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 font-mono">
                    {rule.matchType === 'exact' ? '=' : '≈'} "{rule.keyword}"
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                      {rule.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleRule(rule.id, rule.isActive)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors" title={rule.isActive ? "Pause rule" : "Activate rule"}
                    >
                      {rule.isActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                   <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                     <ListOrdered className="w-6 h-6 text-slate-400" />
                   </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">No automations yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] mx-auto mb-4">Create your first rule to start automating your DMs.</p>
                  <button className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Create Rule
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
