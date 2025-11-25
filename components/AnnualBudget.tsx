import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DEFAULT_WELLS, INITIAL_PROGRAM } from '../constants';
import { calculateWellProgram } from '../services/calculationEngine';
import { SimulationParams } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AnnualBudget: React.FC = () => {
    // Global Drivers
    const [inflation, setInflation] = useState(0); // %
    const [efficiency, setEfficiency] = useState(0); // % (negative reduces cost/time)

    // Calculate Single Well baseline (using standard params for simplicity in this view)
    const baseParams: SimulationParams = {
        tdGuide: 400,
        tdIsolation: 1200,
        dtm: 100, // Average DTM
        isOfflineBOP: false,
        isNoLogging: false,
        adjustments: {}
    };

    const baseResult = calculateWellProgram(INITIAL_PROGRAM, baseParams);

    // Calculate Annual Cash Flow
    const cashFlowData = useMemo(() => {
        const monthlyCosts = new Array(12).fill(0);
        
        DEFAULT_WELLS.forEach(well => {
            const startDate = new Date(well.startDate);
            const startMonthIdx = startDate.getMonth();
            
            // Apply drivers
            const adjustedCost = baseResult.totalCost * (1 + inflation / 100) * (1 - efficiency / 100);
            const durationDays = baseResult.totalTimeDays * (1 - efficiency / 100);
            
            // Distribute cost over duration (Simplified: assume linear burn rate across involved months)
            // For MVP, we'll dump it in the start month + next month if long.
            // Better: Daily burn rate mapping.
            
            let remainingCost = adjustedCost;
            let currentMonth = startMonthIdx;
            
            // Simple distribution: 50% start month, 50% next (if > 15 days)
            if (durationDays > 15 && currentMonth < 11) {
                monthlyCosts[currentMonth] += adjustedCost * 0.6;
                monthlyCosts[currentMonth + 1] += adjustedCost * 0.4;
            } else if (currentMonth < 12) {
                monthlyCosts[currentMonth] += adjustedCost;
            }
        });

        return MONTHS.map((name, index) => ({
            name,
            cost: monthlyCosts[index]
        }));
    }, [baseResult, inflation, efficiency]);

    const totalBudget = cashFlowData.reduce((acc, curr) => acc + curr.cost, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Drivers Panel */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Global Drivers</h3>
                
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-600">Inflation Impact</label>
                            <span className="text-sm font-bold text-slate-800">{inflation}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="20" step="1"
                            value={inflation}
                            onChange={(e) => setInflation(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Applies to all service rates globally.</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-600">Efficiency Gain</label>
                            <span className="text-sm font-bold text-slate-800">{efficiency}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="30" step="1"
                            value={efficiency}
                            onChange={(e) => setEfficiency(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Reduction in total time due to learning curve.</p>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <div className="text-sm text-slate-500 mb-1">Total Annual Budget</div>
                        <div className="text-3xl font-bold text-slate-800">
                            ${(totalBudget / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Based on {DEFAULT_WELLS.length} planned wells</div>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Projected Cash Flow</h3>
                <div className="flex-1 min-h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tickFormatter={(val) => `$${val/1000000}M`}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                formatter={(val: number) => [`$${(val/1000).toFixed(1)}k`, 'Monthly Spend']}
                            />
                            <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            <ReferenceLine y={totalBudget/12} stroke="#ef4444" strokeDasharray="3 3" label="Avg" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnnualBudget;