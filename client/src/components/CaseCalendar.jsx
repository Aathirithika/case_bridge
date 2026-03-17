import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const STATUS_CONFIG = {
    submitted:    { label: 'Hired / Submitted', color: 'bg-amber-500',  dot: 'bg-amber-500',  text: 'text-amber-700',  light: 'bg-amber-50 border-amber-200' },
    under_review: { label: 'Under Review',       color: 'bg-blue-500',   dot: 'bg-blue-500',   text: 'text-blue-700',   light: 'bg-blue-50 border-blue-200' },
    in_progress:  { label: 'In Progress',        color: 'bg-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50 border-yellow-200' },
    closed:       { label: 'Closed',             color: 'bg-green-500',  dot: 'bg-green-500',  text: 'text-green-700',  light: 'bg-green-50 border-green-200' },
};

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function isSameDay(d1, d2) {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

// Build a map: "YYYY-MM-DD" → array of cases
function buildEventMap(cases) {
    const map = {};
    cases.forEach(c => {
        if (c.createdAt) {
            const key = new Date(c.createdAt).toDateString();
            if (!map[key]) map[key] = [];
            map[key].push({ ...c, eventType: 'submitted' });
        }
        if (c.updatedAt && c.status !== 'submitted') {
            const key = new Date(c.updatedAt).toDateString();
            if (!map[key]) map[key] = [];
            // Avoid duplicating same-day create+update
            const alreadyPresent = map[key].some(e => e._id === c._id && e.eventType === c.status);
            if (!alreadyPresent) {
                map[key].push({ ...c, eventType: c.status });
            }
        }
    });
    return map;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CaseCalendar({ cases = [] }) {
    const today = new Date();
    const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [selectedDay, setSelectedDay] = useState(null);

    const eventMap = buildEventMap(cases);

    const prevMonth = () => {
        setCurrent(p => {
            if (p.month === 0) return { year: p.year - 1, month: 11 };
            return { year: p.year, month: p.month - 1 };
        });
        setSelectedDay(null);
    };

    const nextMonth = () => {
        setCurrent(p => {
            if (p.month === 11) return { year: p.year + 1, month: 0 };
            return { year: p.year, month: p.month + 1 };
        });
        setSelectedDay(null);
    };

    const daysInMonth = getDaysInMonth(current.year, current.month);
    const firstDay    = getFirstDayOfMonth(current.year, current.month);

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const getEventsForDay = (day) => {
        if (!day) return [];
        const key = new Date(current.year, current.month, day).toDateString();
        return eventMap[key] || [];
    };

    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

    return (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4a3728] to-[#2d2926] px-6 py-5 flex items-center justify-between">
                <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <p className="text-white font-black text-lg tracking-wide">
                        {MONTH_NAMES[current.month]} {current.year}
                    </p>
                    <p className="text-white/60 text-xs mt-0.5 font-medium uppercase tracking-widest">Case Calendar</p>
                </div>
                <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Legend */}
            <div className="px-6 pt-4 pb-2 flex flex-wrap gap-3 border-b border-amber-50">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}></div>
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{cfg.label}</span>
                    </div>
                ))}
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 px-4 pt-3 pb-1">
                {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-stone-400 uppercase tracking-widest py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 px-4 pb-4 gap-y-1">
                {cells.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />;

                    const events   = getEventsForDay(day);
                    const isToday  = isSameDay(new Date(current.year, current.month, day), today);
                    const isSelected = selectedDay === day;
                    const hasEvents = events.length > 0;

                    // Pick dominant event color (most recent event status)
                    const dominantStatus = events[events.length - 1]?.eventType;
                    const cfg = STATUS_CONFIG[dominantStatus];

                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(isSelected ? null : day)}
                            className={`
                                relative flex flex-col items-center justify-start py-1.5 rounded-xl min-h-[48px] transition-all
                                ${isSelected    ? 'bg-[#4a3728] text-white shadow-md ring-2 ring-[#4a3728] ring-offset-1' : ''}
                                ${isToday && !isSelected ? 'bg-amber-50 ring-2 ring-amber-300' : ''}
                                ${hasEvents && !isSelected ? 'hover:bg-amber-50' : 'hover:bg-stone-50'}
                            `}
                        >
                            <span className={`text-sm font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-amber-700' : 'text-stone-800'}`}>
                                {day}
                            </span>
                            {/* Event dots */}
                            {hasEvents && (
                                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[32px]">
                                    {events.slice(0, 3).map((ev, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : STATUS_CONFIG[ev.eventType]?.dot || 'bg-stone-400'}`}
                                        />
                                    ))}
                                    {events.length > 3 && (
                                        <span className={`text-[8px] font-black ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>
                                            +{events.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected Day Event Panel */}
            {selectedDay && (
                <div className="border-t border-amber-100 px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-black text-stone-500 uppercase tracking-widest">
                            {MONTH_NAMES[current.month]} {selectedDay}, {current.year}
                        </p>
                        <button
                            onClick={() => setSelectedDay(null)}
                            className="text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {selectedEvents.length === 0 ? (
                        <p className="text-sm text-stone-400 italic">No case events on this day.</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {selectedEvents.map((ev, i) => {
                                const cfg = STATUS_CONFIG[ev.eventType] || STATUS_CONFIG.submitted;
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.light}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-stone-800 truncate">{ev.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${cfg.text}`}>
                                                    {cfg.label}
                                                </span>
                                                <span className="text-[10px] text-stone-400">•</span>
                                                <span className="text-[10px] text-stone-500 font-medium">{ev.caseType}</span>
                                                {ev.priority === 'high' && (
                                                    <>
                                                        <span className="text-[10px] text-stone-400">•</span>
                                                        <span className="text-[10px] font-black text-red-600 uppercase">Urgent</span>
                                                    </>
                                                )}
                                            </div>
                                            {ev.client?.name && (
                                                <p className="text-[10px] text-stone-400 mt-0.5">Client: {ev.client.name}</p>
                                            )}
                                            {ev.lawyer?.name && (
                                                <p className="text-[10px] text-stone-400 mt-0.5">Lawyer: Adv. {ev.lawyer.name}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
