import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Send, MessageSquare, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const Support = () => {
    const { showToast } = useToast();
    const [tickets, setTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [newMsg, setNewMsg] = useState('');
    const [loading, setLoading] = useState(true);


    const [showCreate, setShowCreate] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Billing');

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

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/support', { subject, description, category });
            if (res.data.success) {
                setSubject('');
                setDescription('');
                setShowCreate(false);
                fetchTickets();
                showToast('Ticket created! Staff will reply shortly.', 'success');
            }
        } catch (err) {
            showToast('Failed to register support request.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Support Operations Desk</h2>
                    <p className="text-xs text-slate-500">Submit claims regarding late return adjustments, deposit hold disputes, or camera glitches.</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                    <Plus className="w-4 h-4" /> Create Ticket
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                <div className="md:col-span-1 glass-panel rounded-3xl p-5 space-y-4">
                    <h3 className="font-extrabold text-sm border-b border-slate-205 dark:border-slate-800/10 pb-3">Open Enquiries</h3>

                    {loading ? (
                        <p className="text-xs text-slate-400 animate-pulse">Querying support logs...</p>
                    ) : tickets.length === 0 ? (
                        <p className="text-xs text-slate-400">No support requests filed yet.</p>
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
                                        <span className={`px-2 py-0.5 rounded-full ${t.status === 'Closed' ? 'bg-slate-100 text-slate-500' : 'bg-brand-500/10 text-brand-655'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 cursor-pointer truncate">{t.subject}</h4>
                                    <span className="text-[9px] text-slate-400 block pt-1">ID: {t.ticketId}</span>
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
                                    <h3 className="text-xs font-bold font-mono text-slate-655 dark:text-brand-400">TKT: {activeTicket.ticketId}</h3>
                                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{activeTicket.subject}</h4>
                                </div>
                                <span className="text-[10px] text-slate-400">Category: {activeTicket.category}</span>
                            </div>


                            <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[300px] border-b border-slate-205 dark:border-slate-800/10 pr-2">
                                {activeTicket.messages?.map((m, idx) => {
                                    const isStaff = m.sender?.role !== 'Customer';
                                    return (
                                        <div key={idx} className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}>
                                            <div className={`max-w-xs p-3 rounded-2xl text-xs leading-relaxed ${isStaff
                                                ? 'bg-slate-100 dark:bg-slate-900 border border-slate-200/5 text-slate-700 dark:text-slate-300'
                                                : 'bg-brand-600 text-white'
                                                }`}>
                                                {m.message}
                                            </div>
                                            <span className="text-[9px] text-slate-400 pt-1 px-1">
                                                {isStaff ? `${m.sender?.name || 'Support Staff'} (Agent)` : 'You'}
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
                                    placeholder="Type reply message details..."
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
                            <p className="text-xs">Select any support ticket to query response trails or append messages.</p>
                        </div>
                    )}
                </div>
            </div>


            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md glass-panel p-6 rounded-3xl space-y-6">
                        <h3 className="font-extrabold text-sm">Register Support Ticket</h3>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-450 font-semibold">Subject Category</span>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full glass-input text-xs"
                                >
                                    <option value="Billing">Billing & Deposits Hold</option>
                                    <option value="Grace Period">Grace Period Adjustments</option>
                                    <option value="Hardware Return">Return Scanning Checkmarks</option>
                                    <option value="Equipment Damaged">Damaged Asset Claim Dispute</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-455 font-semibold">Issue Subject Title</span>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Sony FX3 Gimbal ring bracket missing"
                                    className="w-full glass-input text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-460 font-semibold">Brief Explanation Details</span>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe details regarding damage audits, camera defects, shipping failures..."
                                    className="w-full glass-input text-xs aspect-[4]"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200/10 text-xs font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl"
                                >
                                    Register
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Support;
