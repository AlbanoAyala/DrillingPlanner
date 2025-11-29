
import React, { useMemo, useState } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateWellProgram } from '../services/calculationEngine';
import { Well, ProgramLine, CostCatalogItem, Scenario } from '../types';
import { PrinterIcon, PencilSquareIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface AnnualBudgetProps {
    wells: Well[];
    budgetScenarios: Scenario[]; // CHANGED: Now accepts scenarios instead of raw configs
    programData: ProgramLine[];
    costData: CostCatalogItem[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AnnualBudget: React.FC<AnnualBudgetProps> = ({ 
    wells, budgetScenarios, programData, costData
}) => {
    // Global Drivers
    const [inflation, setInflation] = useState(0); 
    const [efficiency, setEfficiency] = useState(0);

    // Calculate details for SELECTED SCENARIOS
    const budgetDetails = useMemo(() => {
        if (!programData || !costData || budgetScenarios.length === 0) return [];

        // Sort by Start Date
        const scenariosWithDates = budgetScenarios.map(scenario => {
            const well = wells.find(w => w.id === scenario.wellId);
            return {
                scenario,
                well,
                startDate: well ? new Date(well.startDate) : new Date() // Fallback
            };
        }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        return scenariosWithDates.map(({ scenario, well }) => {
            const result = calculateWellProgram(programData, scenario.params, costData);
            return { well, scenario, result };
        });
    }, [budgetScenarios, wells, programData, costData]);

    // Calculate Annual Cash Flow
    const cashFlowData = useMemo(() => {
        const monthlyCosts = new Array(12).fill(0);
        
        budgetDetails.forEach(({ well, result }) => {
            if (!well) return;
            const startDate = new Date(well.startDate);
            // Distribute cost over duration (Simplified linear)
            const adjustedCost = result.totalCost * (1 + inflation / 100) * (1 - efficiency / 100);
            const durationDays = result.totalTimeDays * (1 - efficiency / 100);
            const dailyCost = adjustedCost / durationDays;
            
            let currentDate = new Date(startDate);
            for (let i = 0; i < durationDays; i++) {
                const m = currentDate.getMonth();
                if (m >= 0 && m < 12) monthlyCosts[m] += dailyCost;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        let cumulativeAcc = 0;
        return MONTHS.map((name, index) => {
            const cost = monthlyCosts[index];
            cumulativeAcc += cost;
            return { name, cost, cumulative: cumulativeAcc };
        });
    }, [budgetDetails, inflation, efficiency]);

    const totalBudget = cashFlowData[cashFlowData.length - 1]?.cumulative || 0;

    const handlePrint = () => {
        window.print();
    };

    if (budgetScenarios.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <ExclamationCircleIcon className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">No Scenarios Selected</h3>
                <p className="mt-2 text-sm">Please go to the <b>Scenario Planning</b> tab and select scenarios to include in the Budget.</p>
            </div>
        );
    }

    return (
        // CHANGED: Removed h-full and overflow-hidden. Use block/auto to allow full page expansion.
        <div className="flex flex-col gap-6 w-full h-auto print:block">
            
            {/* Action Bar (Hidden in Print) */}
            <div className="flex justify-between items-center print:hidden flex-none">
                <h2 className="text-xl font-bold text-slate-800">Annual Budget Review</h2>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors shadow-sm text-sm font-medium"
                >
                    <PrinterIcon className="w-4 h-4" />
                    Export PDF Report
                </button>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-2">
                <div className="flex justify-between items-end">
                    <h1 className="text-xl font-bold text-slate-900">Drilling Cost Planner - Annual Budget Report</h1>
                    <p className="text-slate-600 text-xs font-semibold">Desarrollado por Ing de perforación CGC</p>
                </div>
            </div>

            {/* Layout Container */}
            <div className="flex gap-6 items-start w-full print:block">
                
                {/* Left: Drivers (Hidden in Print, Sticky on Screen) */}
                <div className="w-[300px] flex-none sticky top-6 print:hidden">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Global Drivers</h3>
                        <div className="space-y-6">
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
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <div className="text-sm text-slate-500 mb-1">Total Annual Budget</div>
                                <div className="text-3xl font-bold text-slate-800">
                                    ${(totalBudget / 1000000).toFixed(2)}M
                                </div>
                                <div className="text-xs text-slate-400 mt-1">Based on {budgetDetails.length} selected scenarios</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Content - Natural Flow (No overflow hidden) */}
                <div className="flex-1 flex flex-col gap-8 w-full min-w-0 print:block">
                    
                    {/* 1. Chart Area */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] print:h-[300px] print:mb-6 print:border print:border-slate-300 print:shadow-none print:break-inside-avoid">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 print:text-sm print:mb-2">Projected Cash Flow (2026)</h3>
                        <div className="flex-1 h-full min-h-0 relative pb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <YAxis 
                                        yAxisId="left"
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={(val) => `$${val/1000000}M`}
                                        label={{ value: 'Monthly', angle: -90, position: 'insideLeft', fontSize: 10 }}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis 
                                        yAxisId="right"
                                        orientation="right"
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`}
                                        label={{ value: 'Cumulative', angle: 90, position: 'insideRight', fontSize: 10 }}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <Tooltip 
                                        formatter={(val: number, name: string) => {
                                            if (name === 'Cumulative Cost') return [`$${(val/1000000).toFixed(2)}M`, 'Cumulative'];
                                            return [`$${(val/1000).toFixed(1)}k`, 'Monthly Spend'];
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar yAxisId="left" dataKey="cost" name="Monthly Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative Cost" stroke="#ef4444" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Premises Table (Full Expansion) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:h-auto print:border-none print:shadow-none print:mb-6 print:block">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 print:bg-white print:border-b-2 print:border-slate-800 print:px-0 print:py-2">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Premises Summary (Cuadro de Premisas)</h3>
                        </div>
                        {/* CHANGED: Removed overflow-y-auto and custom-scrollbar. Allowed full table rendering. */}
                        <div className="w-full">
                            <table className="w-full text-left text-xs print:text-[10px] print:border-collapse print:border print:border-slate-300">
                                <thead className="bg-white text-slate-500 uppercase font-medium print:text-slate-900 print:bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-slate-300">Well ID</th>
                                        <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-slate-300">Scenario Name</th>
                                        <th className="px-4 py-3 print:px-2 print:py-1 print:border print:border-slate-300">Start</th>
                                        <th className="px-4 py-3 text-center print:px-2 print:py-1 print:border print:border-slate-300">Rig</th>
                                        <th className="px-4 py-3 text-center print:px-2 print:py-1 print:border print:border-slate-300">Dir</th>
                                        <th className="px-4 py-3 text-center print:px-2 print:py-1 print:border print:border-slate-300">Geo</th>
                                        <th className="px-4 py-3 text-right print:px-2 print:py-1 print:border print:border-slate-300">TD Guide</th>
                                        <th className="px-4 py-3 text-right print:px-2 print:py-1 print:border print:border-slate-300">TD Isol</th>
                                        <th className="px-4 py-3 text-right print:px-2 print:py-1 print:border print:border-slate-300">Days</th>
                                        <th className="px-4 py-3 text-right print:px-2 print:py-1 print:border print:border-slate-300">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600 print:divide-slate-200">
                                    {budgetDetails.map(({ well, scenario, result }) => (
                                        <tr key={scenario.id} className="hover:bg-slate-50 print:hover:bg-transparent print:break-inside-avoid">
                                            <td className="px-4 py-2 font-medium text-slate-800 print:px-2 print:py-1 print:border print:border-slate-300">{well?.id || scenario.wellId}</td>
                                            <td className="px-4 py-2 font-semibold text-blue-700 print:px-2 print:py-1 print:border print:border-slate-300 print:text-black">{scenario.name}</td>
                                            <td className="px-4 py-2 font-mono print:px-2 print:py-1 print:border print:border-slate-300">{well?.startDate}</td>
                                            <td className="px-4 py-2 text-center print:px-2 print:py-1 print:border print:border-slate-300">{scenario.params.equipmentType}</td>
                                            <td className="px-4 py-2 text-center print:px-2 print:py-1 print:border print:border-slate-300">
                                                {scenario.params.isDirectional ? <span className="font-bold text-blue-600 print:text-black">YES</span> : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-center print:px-2 print:py-1 print:border print:border-slate-300">
                                                {scenario.params.hasGeologicalControl ? <span className="font-bold text-orange-600 print:text-black">YES</span> : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono print:px-2 print:py-1 print:border print:border-slate-300">{scenario.params.tdGuide}</td>
                                            <td className="px-4 py-2 text-right font-mono print:px-2 print:py-1 print:border print:border-slate-300">{scenario.params.tdIsolation}</td>
                                            <td className="px-4 py-2 text-right font-mono font-bold text-blue-600 print:text-black print:px-2 print:py-1 print:border print:border-slate-300">{result.totalTimeDays.toFixed(1)}</td>
                                            <td className="px-4 py-2 text-right font-mono print:px-2 print:py-1 print:border print:border-slate-300">${(result.totalCost/1000).toFixed(0)}k</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Notes Section (Natural Block Flow) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:border-none print:shadow-none print:w-full print:block print:px-0">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 print:border-slate-800">
                            <PencilSquareIcon className="w-5 h-5 text-slate-500 print:hidden" />
                            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide print:text-sm">Well Specific Notes & Premises</h3>
                        </div>

                        <div className="space-y-4">
                             {budgetDetails.filter(d => d.scenario.params.userNotes).length === 0 && (
                                 <div className="text-sm text-slate-400 italic">No specific notes recorded for any selected scenario.</div>
                             )}

                             {budgetDetails.map(({ well, scenario }) => {
                                 if (!scenario.params.userNotes) return null;
                                 return (
                                     <div key={scenario.id} className="border-l-4 border-slate-200 pl-4 py-2 print:border-l-2 print:border-slate-800 print:break-inside-avoid print:mb-4">
                                         <h4 className="font-bold text-sm text-slate-900 mb-1">{well?.id || scenario.wellId} - {scenario.name}</h4>
                                         <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed print:text-xs">{scenario.params.userNotes}</p>
                                     </div>
                                 )
                             })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AnnualBudget;
