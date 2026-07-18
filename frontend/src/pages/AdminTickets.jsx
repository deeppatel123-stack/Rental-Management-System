import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MessageSquare, Send, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminTickets = () => {
    const { showToast } = useToast();
    const [tickets, setTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [newMsg, setNewMsg] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/support');
            if (res.data.success) {
                setTickets(res.data.tickets);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const loadTicketDetail = async (id) => {
        try {
            const res = await api.get(`/support/${id}`);
            if (res.data.success) {
                setActiveTicket(res.data.ticket);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePostReply = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !activeTicket) return;

        try {
            const res = await api.post(`/support/${activeTicket._id}/reply`, { message: newMsg });
            if (res.data.success) {
                setNewMsg('');
                loadTicketDetail(activeTicket._id);
                fetchTickets();
            }
        } catch (err) {
            showToast('Error sending reply.', 'error');
        }
    };

    const handleResolveTicket = async (id, status = 'Closed') => {
        try {
            const res = await api.put(`/support/${id}/status`, { status });
            if (res.data.success) {
                showToast(`Ticket status updated to ${status}!`, 'success');
                loadTicketDetail(id);
                fetchTickets();
            }
        } catch (err) {
            showToast('Error resolving status.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Customer Enquiries Ticketing</h2>
                    <p className="text-xs text-slate-500">Provide resolution support for client billing claims, late returns, and defective items reports.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                <div className="md:col-span-1 glass-panel rounded-3xl p-5 space-y-4">
                    <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3">Client Backlogs</h3>

                    {loading ? (
                        <p className="text-xs text-slate-400 animate-pulse">Consulting ticketing system...</p>
                    ) : tickets.length === 0 ? (
                        <p className="text-xs text-slate-400">No support requests filed.</p>
                    ) : (
                        <div className="space-y-3.5">
                            {tickets.map(t => (
                                <button
                                    key={t._id}
                                    onClick={() => loadTicketDetail(t._id)}
                                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${activeTicket?._id === t._id
                                        ? 'border-brand-500 bg-brand-500/5'
                                        : 'border-slate-200/50 dark:border-slate-800 bg-white/20 dark:bg-slate-900/10 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                                        <span>{t.category}</span>
                                        <span className={`px-2 py-0.5 rounded-full ${t.status === 'Closed' ? 'bg-slate-100 text-slate-500' : 'bg-brand-505/10 text-brand-655'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{t.subject}</h4>
                                    <p className="text-[10px] text-slate-450 pt-0.5 truncate">User: {t.customer?.name}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                <div className="md:col-span-2 glass-panel rounded-3xl p-5 flex flex-col justify-between min-h-[450px]">
                    {activeTicket ? (
                        <>

                            <div className="border-b border-slate-205 dark:border-slate-800/10 pb-3 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xs font-bold font-mono text-slate-655">ID: {activeTicket.ticketId}</h3>
                                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{activeTicket.subject}</h4>
                                    <p className="text-[10px] text-slate-450">User: {activeTicket.customer?.name} ({activeTicket.customer?.email})</p>
                                </div>

                                <div className="flex gap-2">
                                    {activeTicket.status !== 'Closed' ? (
                                        <button
                                            onClick={() => handleResolveTicket(activeTicket._id, 'Closed')}
                                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-505/20 text-emerald-500 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Settle Close
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleResolveTicket(activeTicket._id, 'Open')}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200/10 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" /> Reopen Ticket
                                        </button>
                                    )}
                                </div>
                            </div>


                            <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[300px] border-b border-slate-205 dark:border-slate-800/10 pr-2">
                                {activeTicket.messages?.map((m, idx) => {


                                    const isStaffSender = m.sender?.role !== 'Customer';
                                    return (
                                        <div key={idx} className={`flex flex-col ${isStaffSender ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-xs p-3 rounded-2xl text-xs leading-relaxed ${isStaffSender
                                                ? 'bg-brand-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-900 border border-slate-200/5 text-slate-700 dark:text-slate-350'
                                                }`}>
                                                {m.message}
                                            </div>
                                            <span className="text-[9px] text-slate-400 pt-1 px-1">
                                                {isStaffSender ? `You (${m.sender?.name || 'Staff'})` : `${m.sender?.name || 'Customer'}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>


                            <form onSubmit={handlePostReply} className="flex gap-2 pt-3">
                                <input
                                    type="text"
                                    value={newMsg}
                                    onChange={(e) => setNewMsg(e.target.value)}
                                    placeholder="Type reply response details to submit..."
                                    className="flex-1 glass-input text-xs"
                                    required
                                />
                                <button type="submit" className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-450 gap-2">
                            <MessageSquare className="w-10 h-10 text-slate-400" />
                            <p className="text-xs">Select any open ticket to review client messaging and update actions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default AdminTickets;
