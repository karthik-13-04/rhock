"use client";

import React, { useEffect, useState } from 'react';
import { useAdminStore } from "@/store/useAdminStore";
import { coinsService } from "@/services/admin/coins.service";
import { Wallet, ArrowUpRight, ArrowDownLeft, User as UserIcon, Calendar, Loader2, Coins } from "lucide-react";
import { cn } from "@/utils/cn";

export default function CoinsPage() {
  const { coinTransactions, setCoinTransactions, isLoading, setLoading, setError } = useAdminStore();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await coinsService.getTransactions(page, 20);
      setCoinTransactions(data.transactions || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">Coin Economy</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Audit all coin transfers and redemptions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Participants</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 text-admin-primary animate-spin" />
                      <span className="text-zinc-500">Auditing blockchain ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : coinTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                coinTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          tx.type === 'transfer' ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-orange-500"
                        )}>
                          {tx.type === 'transfer' ? <ArrowUpRight size={18} /> : <Coins size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                            {tx.type}
                          </p>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">
                            REF: {tx._id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-zinc-400 uppercase w-10">From:</span>
                           <span className="text-xs font-bold text-zinc-700">{tx.senderName || 'System'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-zinc-400 uppercase w-10">To:</span>
                           <span className="text-xs font-bold text-zinc-700">{tx.receiverName || 'User'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">
                      {tx.coins} Coins
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        tx.status === 'completed' ? "bg-green-50 text-green-700 border-green-200" : 
                        tx.status === 'pending' ? "bg-yellow-50 text-yellow-700 border-yellow-200" : 
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="px-3 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm text-zinc-500 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="px-3 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm text-zinc-500 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
