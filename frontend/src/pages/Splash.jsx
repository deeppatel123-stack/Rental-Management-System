import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, Clock, BarChart3, Database, Key, Server, Cpu, CheckSquare, MessageSquare, Laptop, MessageCircle, Star, HelpCircle, Mail } from 'lucide-react';

export const Splash = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [contact, setContact] = useState({ name: '', email: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const features = [
        {
            icon: ShieldCheck,
            title: 'Escrow Security Deposit',
            desc: 'Protects assets by holding an automated deposit on checkout, releasing it only after returning physical equipment inspection.'
        },
        {
            icon: Truck,
            title: 'Verify Dispatch & OTP Logs',
            desc: 'Secure pickup verification code workflow. Orders are handed over after physical serial scanning confirmation.'
        },
        {
            icon: Clock,
            title: 'Automated Late Fee Cron',
            desc: 'Cron job script evaluates return times, tracks grace periods, and applies automated fees to delay schedules.'
        },
        {
            icon: BarChart3,
            title: 'Live Analytical Insights',
            desc: 'Track revenue, asset demand, active listings, and return ratios via unified graphs in real-time.'
        }
    ];

    const steps = [
        {
            num: '01',
            title: 'Browse & Checkout',
            desc: 'Browse our cameras, drones, audio devices, and checkout with glassmorphic cart experience.'
        },
        {
            num: '02',
            title: 'OTP Handover Check',
            desc: 'Verify pickup schedules at warehouse counters. Confirm serial barcodes and enter OTP verification codes.'
        },
        {
            num: '03',
            title: 'Active Operations',
            desc: 'Track rental agreements in real-time. Receive automated notifications and reminders of delay warnings.'
        },
        {
            num: '04',
            title: 'Secure Returns & Settlement',
            desc: 'Review item checkmarks for structural damages. Settle late return fees automatically with deposit release.'
        }
    ];

    const techStack = [
        { name: 'React (Vite)', category: 'Frontend UI Framework' },
        { name: 'Tailwind CSS', category: 'Styling Layer' },
        { name: 'Node.js & Express', category: 'Backend Server REST API' },
        { name: 'MongoDB & Mongoose', category: 'Database Storage Layer' },
        { name: 'Socket.IO', category: 'Real-time WebSocket Push' },
        { name: 'Framer Motion', category: 'Micro-animations Engine' }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-[calc(100vh-73px)] w-full relative overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
            {/* Background glowing ornaments */}
            <div className="absolute top-20 left-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
            <div className="absolute top-[800px] right-10 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

            {/* Hero Section */}
            <section className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto flex flex-col items-center text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold tracking-wider uppercase border border-brand-500/20"
                >
                    <ShieldCheck className="w-4 h-4 animate-spin-slow" /> Prime Rentals SaaS Platform
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl md:text-7xl font-extrabold tracking-tight leading-tight"
                >
                    Simplify Equipment Rental <br />
                    <span className="bg-gradient-to-r from-brand-500 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
                        Automate the Agreement Lifecycle
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-2xl text-slate-500 dark:text-slate-400 text-sm md:text-lg leading-relaxed"
                >
                    A unified digital system orchestrating stock asset catalogs, dynamic deposit escrows, automated delay return charges, support queues, and barcode verification.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md pt-4"
                >
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/25 transition-all text-xs tracking-wider uppercase transform hover:-translate-y-0.5"
                    >
                        Launch Portal Console
                    </button>
                    <button
                        onClick={() => navigate('/catalog')}
                        className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold rounded-2xl transition-all text-xs tracking-wider uppercase"
                    >
                        Product Catalogue
                    </button>
                </motion.div>
            </section>

            {/* Core Features */}
            <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-3">
                    <h2 className="text-2xl md:text-4xl font-extrabold">System Architecture Capabilities</h2>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Ensuring zero operational mismatch through integrated checks</p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {features.map((f, idx) => {
                        const Icon = f.icon;
                        return (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="glass-card rounded-[2.5rem] p-6 space-y-4 hover:shadow-lg transition-all border border-slate-200/50 dark:border-slate-800/30 flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 dark:text-brand-400 flex items-center justify-center">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{f.title}</h3>
                                    <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>

            {/* Operations Lifecycle Timeline */}
            <section className="py-20 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/40 dark:border-slate-800/40 px-6">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center space-y-3">
                        <h2 className="text-2xl md:text-4xl font-extrabold">Equipment Operational Lifecycle</h2>
                        <p className="text-xs md:text-sm text-slate-450">Step-by-step logic detailing how Prime Rentals prevents equipment loss</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {steps.map((st, idx) => (
                            <div key={idx} className="relative space-y-4">
                                <div className="font-mono text-5xl font-extrabold text-brand-500/20 dark:text-brand-500/10">
                                    {st.num}
                                </div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white">{st.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{st.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technical Stack Showcase */}
            <section className="py-20 px-6 max-w-6xl mx-auto space-y-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Robust System Integrity</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold">Engineered for Operational Accuracy</h2>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            The application is built using the MongoDB, Express, React, and Node.js (MERN) stack. It incorporates real-time server push events via Socket.io to trigger instant system-wide notifications, client portal updates, and status warning logs.
                        </p>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            It also implements automatic cron job routines to evaluate active return deadlines, computing delay late fees with configurable grace period parameters dynamically managed in the Admin Global Settings.
                        </p>
                    </div>

                    <div className="glass-panel rounded-3xl p-6 border border-slate-250 dark:border-slate-800/10 grid grid-cols-2 gap-4">
                        {techStack.map((tech, idx) => (
                            <div key={idx} className="p-4 bg-white/40 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-slate-800/10">
                                <div className="text-[10px] uppercase font-bold text-brand-500 tracking-wider">{tech.category}</div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{tech.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-3">
                    <h2 className="text-2xl md:text-4xl font-extrabold flex items-center justify-center gap-2">
                        <Star className="w-6 h-6 text-brand-500 fill-brand-500" /> What Enterprise Owners Say
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500">Trusted by over 450+ high-end studio gear and heavy industrial rentals organizations.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'Sarah Jenkins', role: 'Operations Lead, Apex Cine Club', comment: 'The escrow security deposit system saved us over $12,000 in repair disputes this quarter alone. Absolute game changer.' },
                        { name: 'Michael Chen', role: 'Director, Urban Heavy Tools Rental', comment: 'Assigning routes to our drivers and getting instant OTP verified returns at the counter has reduced our delays by 40%.' },
                        { name: 'Elena Rostova', role: 'Founder, Nord Sound & Stage', comment: 'The AI predictive maintenance tool automatically flags faulty stage lights. The custom coupon engine runs stage bundle promos flawlessly.' }
                    ].map((t, idx) => (
                        <div key={idx} className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/10 space-y-3">
                            <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed italic">"{t.comment}"</p>
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t.name}</h4>
                                <span className="text-[9px] text-slate-400 font-medium">{t.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-slate-100/30 dark:bg-slate-900/10 border-y border-slate-200/30 dark:border-slate-800/30 px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-3">
                        <h2 className="text-2xl md:text-4xl font-extrabold flex items-center justify-center gap-2">
                            <HelpCircle className="w-6 h-6 text-brand-500" /> Frequently Asked Questions
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500">Everything you need to know about agreements, pricing models, and returns.</p>
                    </div>
                    <div className="space-y-3">
                        {[
                            { q: 'How does the escrow security deposit workflow work?', a: 'When checking out items, a preset deposit is held. Once returned items pass physical damage verification scanners at our warehouse, the escrow ledger completes or issues partial deduction settlements.' },
                            { q: 'What late-return penalties are enforced automatically?', a: 'We track return coordinates via GPS and check against return deadlines. Late fees accumulate based on hourly, daily, or weekly rates configured in setting dashboards with client-specific grace periods.' },
                            { q: 'Can we assign multiple warehouse partners to routes?', a: 'Yes. The driver assignment module optimizes multi-stop logistics route waypoints, distributing delivery or pickup sheets to registered courier partners or drivers.' },
                            { q: 'Do you support customized quotes and agreements?', a: 'Yes, operators can formulate customized quotation proposals, send email sheets, check availability calendars, and generate complete rental agreements.' }
                        ].map((faq, idx) => (
                            <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/15">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full text-left px-5 py-4 font-bold text-xs flex justify-between items-center text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                >
                                    <span>{faq.q}</span>
                                    <span className="text-brand-500 font-extrabold text-sm">{openFaq === idx ? '−' : '+'}</span>
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-900 pt-3 bg-slate-50/50 dark:bg-slate-950/20">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Blog Section */}
            <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-3">
                    <h2 className="text-2xl md:text-4xl font-extrabold flex items-center justify-center gap-2">
                        <MessageCircle className="w-5 h-5 text-brand-500" /> Industry Resource Notes (Blog)
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500">Read our strategic reviews and tech updates on hardware logistics management.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'The Future of AI in Rental Asset Maintenance', desc: 'How machine learning determines device fatigue thresholds to dispatch repair tickets before failures occur.', date: 'July 18, 2026' },
                        { title: 'Optimizing Route Waypoints for Stage Rental Deliveries', desc: 'Solving structural staging delivery delays using mapping systems coordinates and dynamic OTP authorizations.', date: 'July 12, 2026' },
                        { title: 'A Checklist for Standard Escrow Settlements Compliance', desc: 'Best practices to structure deposit approvals, partial refunds, and damage claim invoices without losing customers.', date: 'June 30, 2026' }
                    ].map((post, idx) => (
                        <div key={idx} className="glass-card hover:shadow-xl transition-all rounded-3xl p-5 border border-slate-205 dark:border-slate-800/10 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                                <span className="text-[9px] uppercase font-bold text-brand-500 font-mono">{post.date}</span>
                                <h4 className="text-xs font-black leading-snug text-slate-800 dark:text-slate-100">{post.title}</h4>
                                <p className="text-[11px] text-slate-450 leading-relaxed">{post.desc}</p>
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 cursor-pointer">Read article →</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Page Section */}
            <section className="py-20 bg-slate-100/30 dark:bg-slate-900/5 border-t border-slate-200/30 dark:border-slate-800/30 px-6">
                <div className="max-w-xl mx-auto space-y-8 glass-panel p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/10 relative">
                    <div className="text-center space-y-2">
                        <Mail className="w-8 h-8 text-indigo-500 mx-auto" />
                        <h2 className="text-xl md:text-2xl font-black">Contact Rental Support</h2>
                        <p className="text-xs text-slate-450 leading-relaxed">Reach out to our compliance operations desk for customized deployment setups.</p>
                    </div>

                    {submitted ? (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-center space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                            <h4 className="font-bold text-xs text-emerald-600">Message Dispatched!</h4>
                            <p className="text-[10px] text-slate-400">Our customer support queue has registered your enquiry.</p>
                        </div>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 block font-bold">Your Name</span>
                                    <input
                                        type="text"
                                        required
                                        value={contact.name}
                                        onChange={e => setContact({ ...contact, name: e.target.value })}
                                        className="w-full glass-input"
                                        placeholder="Bob Smith"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 block font-bold">Email Address</span>
                                    <input
                                        type="email"
                                        required
                                        value={contact.email}
                                        onChange={e => setContact({ ...contact, email: e.target.value })}
                                        className="w-full glass-input"
                                        placeholder="bob@company.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 block font-bold">Enquiry Message</span>
                                <textarea
                                    required
                                    value={contact.message}
                                    onChange={e => setContact({ ...contact, message: e.target.value })}
                                    className="w-full glass-input h-20"
                                    placeholder="Write your system inquiry details..."
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-all shadow-md shadow-brand-500/10">
                                Send Message
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* Bottom Actions CTA */}
            <section className="py-20 text-center relative max-w-4xl mx-auto px-6">
                <div className="glass-panel rounded-[3rem] p-10 md:p-16 border border-brand-500/10 space-y-8 relative overflow-hidden bg-gradient-to-tr from-brand-600/5 to-indigo-600/5">
                    <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">Ready to Authenticate Console Sessions?</h2>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Register standard access credentials for Super Admin, Rental Partner, or Customer accounts, verify via local mock OTP tokens, and start testing.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 text-xs uppercase tracking-wider"
                        >
                            Register New Account
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold rounded-2xl transition-all text-xs uppercase tracking-wider"
                        >
                            Log In Here
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Splash;
