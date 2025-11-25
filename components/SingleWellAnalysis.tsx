import React, { useMemo } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { INITIAL_PROGRAM } from '../constants';
import { SimulationParams, SimulationResult, LineType } from '../types';
import { calculateWellProgram } from '../services/calculationEngine';
import { ArrowDownTrayIcon, BeakerIcon, AdjustmentsHorizontalIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline';
import { ChartMode } from '../App';

interface SingleWellAnalysisProps {
    params: SimulationParams;
    setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
    chartMode: ChartMode;
    setChartMode: React.Dispatch<React.SetStateAction<ChartMode>>;
}

const SingleWellAnalysis: React.FC<SingleWellAnalysisProps> = ({ params, setParams, chartMode, setChartMode }) => {
    
    // Derived State (Calculated Result)
    const result: SimulationResult = useMemo(() => {
        return calculateWellProgram(INITIAL_PROGRAM, params);
    }, [params]);

    // Handlers
    const handleInputChange = (field: keyof SimulationParams, value: number | boolean) => {
        setParams(prev => ({ ...prev, [field]: value }));
    };

    const handleAdjustment = (lineId: string, type: 'ABSOLUTE_VALUE' | 'PERCENTAGE_TIME', value: number) => {
        setParams(prev => ({
            ...prev,
            adjustments: {
                ...prev.adjustments,
                [lineId]: { type, value }
            }
        }));
    };

    const handleExportExcel = () => {
        const headers = ['ID', 'Phase', 'Activity', 'Duration (hrs)', 'Cost (USD)', 'Days From Spud', 'Total Cum. Days', 'Cumulative Cost (USD)'];
        
        const rows = result.lines.map(line => [
            line.id,
            `"${line.phase}"`,
            `"${line.activity}"`,
            line.calculatedDuration.toFixed(2),
            line.calculatedCost.toFixed(2),
            line.daysFromSpud.toFixed(2),
            line.cumulativeTime.toFixed(2),
            line.cumulativeCost.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Drilling_Program_Export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            
            {/* Left Column: Inputs & Optimization - Fixed Width */}
            <div className="w-full lg:w-[320px] flex-none flex flex-col gap-4 h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                
                    {/* Inputs Panel */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <AdjustmentsHorizontalIcon className="w-4 h-4" /> 
                            Parameters
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold">TD Guide (m)</label>
                                <input 
                                    type="number" 
                                    value={params.tdGuide} 
                                    onChange={(e) => handleInputChange('tdGuide', Number(e.target.value))}
                                    className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold">TD Isol. (m)</label>
                                <input 
                                    type="number" 
                                    value={params.tdIsolation} 
                                    onChange={(e) => handleInputChange('tdIsolation', Number(e.target.value))}
                                    className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] uppercase text-slate-500 font-bold">DTM Dist. (km)</label>
                                <input 
                                    type="number" 
                                    value={params.dtm} 
                                    onChange={(e) => handleInputChange('dtm', Number(e.target.value))}
                                    className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={params.isOfflineBOP} 
                                    onChange={(e) => handleInputChange('isOfflineBOP', e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-xs text-slate-600 font-medium">Offline BOP Test (Item 8)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={params.isNoLogging} 
                                    onChange={(e) => handleInputChange('isNoLogging', e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-xs text-slate-600 font-medium">No Logging (Items 11 & 13)</span>
                            </label>
                        </div>
                    </div>

                    {/* Optimization Panel */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <BeakerIcon className="w-4 h-4" />
                            Fine-Tuning
                        </h3>
                        <div className="space-y-3">
                            {INITIAL_PROGRAM.map((line) => {
                                const isSkipped = (params.isOfflineBOP && line.isOfflineCapable) || 
                                                  (params.isNoLogging && (line.type === LineType.LOGGING || line.id === '11'));
                                
                                if (isSkipped) return null;

                                const isSpeedBased = line.type === LineType.DRILLING || line.type === LineType.CASING || line.type === LineType.TRIPPING;
                                const adjustment = params.adjustments[line.id];
                                const currentValue = adjustment ? adjustment.value : 0;
                                const adjustType = isSpeedBased ? 'ABSOLUTE_VALUE' : 'PERCENTAGE_TIME';

                                return (
                                    <div key={line.id} className="p-2 bg-slate-50 rounded border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold text-slate-700 w-3/4 truncate" title={line.activity}>
                                                {line.id}. {line.activity}
                                            </span>
                                            <span className="text-[9px] bg-slate-200 px-1 py-0.5 rounded text-slate-600">{line.phase}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] text-slate-500 whitespace-nowrap w-12">
                                                {isSpeedBased ? 'Speed:' : 'Time %:'}
                                            </label>
                                            <input 
                                                type="range" 
                                                min={isSpeedBased ? "-20" : "-50"} 
                                                max={isSpeedBased ? "20" : "50"} 
                                                step={isSpeedBased ? "1" : "5"}
                                                value={currentValue}
                                                onChange={(e) => handleAdjustment(line.id, adjustType, Number(e.target.value))}
                                                className={`w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer ${isSpeedBased ? 'accent-blue-600' : 'accent-orange-500'}`}
                                            />
                                            <div className="relative">
                                                 <input
                                                    type="number"
                                                    value={currentValue}
                                                    onChange={(e) => handleAdjustment(line.id, adjustType, Number(e.target.value))}
                                                    className={`w-12 text-[10px] text-right font-mono bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none px-0.5 ${
                                                        isSpeedBased 
                                                            ? (currentValue > 0 ? 'text-green-600' : 'text-slate-600') 
                                                            : (currentValue < 0 ? 'text-green-600' : 'text-slate-600')
                                                    }`}
                                                />
                                                <span className="absolute right-[-8px] top-0 text-[10px] text-slate-400 pointer-events-none">
                                                    {isSpeedBased ? '' : '%'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Center & Right Column: Visualization & Results */}
            <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden min-w-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
                
                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-xs text-slate-500 uppercase font-semibold">Total Cost</div>
                            <div className="text-2xl font-bold text-slate-800 mt-1">
                                ${(result.totalCost / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}k
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-xs text-slate-500 uppercase font-semibold">Total Days</div>
                            <div className="text-2xl font-bold text-blue-600 mt-1">
                                {result.totalTimeDays.toFixed(2)} <span className="text-sm font-normal text-slate-400">days</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-xs text-slate-500 uppercase font-semibold">Final Depth</div>
                            <div className="text-2xl font-bold text-slate-800 mt-1">
                                {result.timeCurve[result.timeCurve.length - 1].depth} <span className="text-sm font-normal text-slate-400">m</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96 relative flex flex-col">
                        <div className="flex justify-between items-center mb-4 z-10">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <ChartBarSquareIcon className="w-5 h-5 text-slate-400"/>
                                Depth vs. Time
                            </h3>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                {[
                                    { id: 'total', label: 'Total Time' },
                                    { id: 'net', label: 'Net (No DTM)' },
                                    { id: 'both', label: 'Both' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setChartMode(opt.id as ChartMode)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                            chartMode === opt.id 
                                            ? 'bg-white text-blue-600 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis 
                                        type="number"
                                        dataKey="time"
                                        domain={[0, 'auto']}
                                        label={{ value: 'Days', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#94a3b8' }} 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    {/* Left Y Axis: Depth (Inverted) */}
                                    <YAxis 
                                        yAxisId="left" 
                                        reversed 
                                        label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#94a3b8' }} 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    {/* Right Y Axis: Cost */}
                                    {(chartMode === 'total' || chartMode === 'both') && (
                                        <YAxis 
                                            yAxisId="right" 
                                            orientation="right" 
                                            tickFormatter={(val) => `$${val/1000}k`}
                                            label={{ value: 'Cum. Cost (USD)', angle: 90, position: 'insideRight', fontSize: 12, fill: '#94a3b8' }} 
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                        />
                                    )}
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                                        formatter={(value: number, name: string) => {
                                            if(String(name).includes('Cost')) return [`$${value.toLocaleString()}`, name];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }}/>

                                    {/* Area only makes sense for Total view timeline usually */}
                                    {(chartMode === 'total' || chartMode === 'both') && (
                                        <Area 
                                            yAxisId="right" 
                                            data={result.timeCurve} 
                                            type="monotone" 
                                            dataKey="cost" 
                                            name="Cumulative Cost" 
                                            fill="#dbeafe" 
                                            stroke="#3b82f6" 
                                            strokeWidth={1} 
                                            fillOpacity={0.4} 
                                        />
                                    )}

                                    {/* Curve: Total Time */}
                                    {(chartMode === 'total' || chartMode === 'both') && (
                                        <Line 
                                            yAxisId="left" 
                                            data={result.timeCurve} 
                                            dataKey="depth" 
                                            name="Depth (Total)" 
                                            stroke="#0d9488" 
                                            strokeWidth={2} 
                                            dot={false} 
                                            activeDot={{ r: 4 }}
                                        />
                                    )}

                                    {/* Curve: Net Time */}
                                    {(chartMode === 'net' || chartMode === 'both') && (
                                        <Line 
                                            yAxisId="left" 
                                            data={result.timeCurveNet} 
                                            dataKey="depth" 
                                            name="Depth (Net/No DTM)" 
                                            stroke="#ef4444" 
                                            strokeWidth={2} 
                                            strokeDasharray={chartMode === 'both' ? "5 5" : ""} 
                                            dot={false}
                                            activeDot={{ r: 4 }}
                                        />
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-700">Detailed Program</h3>
                            <button 
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Export Excel
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">Phase</th>
                                        <th className="px-4 py-3">Activity</th>
                                        <th className="px-4 py-3 text-right">Dur (hrs)</th>
                                        <th className="px-4 py-3 text-right">Cost ($)</th>
                                        <th className="px-4 py-3 text-right bg-blue-50/50">Days From Spud</th>
                                        <th className="px-4 py-3 text-right">Cum. Days (Total)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {result.lines.map((line) => (
                                        <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-xs text-slate-400">{line.id}</td>
                                            <td className="px-4 py-3 text-xs font-medium text-slate-500">{line.phase}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800 text-xs sm:text-sm">{line.activity}</td>
                                            <td className="px-4 py-3 text-right font-mono">{line.calculatedDuration.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-600">${line.calculatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-blue-700 bg-blue-50/30">
                                                {line.type === 'MOVING' || line.id === '0' 
                                                    ? '-' 
                                                    : line.daysFromSpud.toFixed(2)
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-500">
                                                {line.cumulativeTime.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleWellAnalysis;