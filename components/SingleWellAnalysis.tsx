
import React, { useMemo, useState } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SimulationParams, SimulationResult, LineType, Well, ProgramLine, CostCatalogItem } from '../types';
import { calculateWellProgram } from '../services/calculationEngine';
import { ArrowDownTrayIcon, BeakerIcon, AdjustmentsHorizontalIcon, ChartBarSquareIcon, CircleStackIcon, TruckIcon, ExclamationTriangleIcon, TableCellsIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ChartMode } from '../App';

interface SingleWellAnalysisProps {
    params: SimulationParams;
    setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
    chartMode: ChartMode;
    setChartMode: React.Dispatch<React.SetStateAction<ChartMode>>;
    wells: Well[];
    selectedWellId: string;
    onSelectWell: (id: string) => void;
    onSaveScenario: (name: string) => void;
    
    // Injected Data
    programData: ProgramLine[];
    costData: CostCatalogItem[];
}

const SingleWellAnalysis: React.FC<SingleWellAnalysisProps> = ({ 
    params, setParams, chartMode, setChartMode, 
    wells, selectedWellId, onSelectWell, onSaveScenario,
    programData, costData
}) => {
    const [scenarioName, setScenarioName] = useState('');

    // Derived State (Calculated Result)
    const result: SimulationResult = useMemo(() => {
        if (!programData || !costData) {
            return { lines: [], totalTimeDays: 0, totalCost: 0, timeCurve: [], timeCurveNet: [], costSummary: [], warnings: [] };
        }
        return calculateWellProgram(programData, params, costData);
    }, [params, programData, costData]);

    // Handlers
    const handleInputChange = (field: keyof SimulationParams, value: number | boolean | string) => {
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

    const handleSaveClick = () => {
        if (!scenarioName.trim()) {
            alert('Please enter a name for this scenario');
            return;
        }
        onSaveScenario(scenarioName);
        setScenarioName(''); // Clear input
        alert('Scenario Saved!');
    };

    const handleExportExcel = () => {
        const headers = ['ID', 'Phase', 'Activity', 'Duration (hrs)', 'Cost (USD)', 'Days From Spud', 'Total Cum. Days', 'Cumulative Cost (USD)'];
        const rows = result.lines.map(line => [
            line.id, `"${line.phase}"`, `"${line.activity}"`,
            line.calculatedDuration.toFixed(2),
            line.calculatedCost.toFixed(2),
            line.daysFromSpud.toFixed(2),
            line.cumulativeTime.toFixed(2),
            line.cumulativeCost.toFixed(2)
        ]);

        // Add BOM for Excel UTF-8 compatibility
        const BOM = "\uFEFF";
        const csvContent = BOM + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedWellId}_Drilling_Program.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const currentWell = wells.find(w => w.id === selectedWellId);
    
    // Group Cost Summary by "Group" for Display
    const groupedCostSummary = useMemo(() => {
        const groups: Record<string, typeof result.costSummary> = {};
        result.costSummary.forEach(row => {
            if (!groups[row.group]) groups[row.group] = [];
            groups[row.group].push(row);
        });
        return groups;
    }, [result.costSummary]);

    const hasWarnings = result.warnings && result.warnings.length > 0;

    return (
        <div className="flex flex-col gap-4 h-full overflow-hidden">
            
            {/* Top Bar: Well Selection & Global Actions */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between flex-none">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Well Analysis</span>
                        <div className="flex items-center gap-2">
                             <CircleStackIcon className="w-5 h-5 text-blue-500" />
                            <select 
                                value={selectedWellId} 
                                onChange={(e) => onSelectWell(e.target.value)}
                                className="bg-transparent text-lg font-bold text-slate-800 outline-none cursor-pointer hover:text-blue-700 transition-colors"
                            >
                                {wells.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right mr-4 border-r border-slate-200 pr-4">
                        <div className="text-[10px] text-slate-400">Start Date</div>
                        <div className="text-sm font-mono font-medium">{currentWell?.startDate || '-'}</div>
                    </div>
                     <div className="text-right mr-4">
                        <div className="text-[10px] text-slate-400">Well Type</div>
                        <div className="text-sm font-medium text-slate-600 bg-slate-100 px-2 rounded">{params.wellType}</div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                        <input 
                            type="text" 
                            value={scenarioName}
                            onChange={(e) => setScenarioName(e.target.value)}
                            placeholder="Scenario Name..."
                            className="bg-white text-sm border border-slate-200 rounded px-2 py-1.5 w-40 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                            onClick={handleSaveClick}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-all flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Save Scenario
                        </button>
                    </div>
                </div>
            </div>

            {hasWarnings && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-3 flex flex-col gap-1 rounded-r shadow-sm flex-none">
                    <div className="flex items-center gap-2 text-orange-800 font-semibold text-xs">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Data Warnings:
                    </div>
                    <ul className="list-disc list-inside text-[10px] text-orange-700">
                        {result.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Left Column: Inputs & Optimization - Fixed Width */}
                <div className="w-full lg:w-[320px] flex-none flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    
                        {/* Inputs Panel */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <AdjustmentsHorizontalIcon className="w-4 h-4" /> 
                                Design Parameters
                            </h3>
                            
                            {/* Equipment Selection */}
                            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <TruckIcon className="w-4 h-4 text-slate-500" />
                                    <label className="text-[10px] uppercase text-slate-500 font-bold">RIG</label>
                                </div>
                                <select 
                                    value={params.equipmentType} 
                                    onChange={(e) => handleInputChange('equipmentType', e.target.value)}
                                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="H-202">H-202</option>
                                    <option value="H-203">H-203</option>
                                </select>
                                
                                <div className="mt-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={params.isFirstWell} 
                                            onChange={(e) => handleInputChange('isFirstWell', e.target.checked)}
                                            className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                                        />
                                        <span className="text-xs text-slate-700">First Well (Mobilization Cost)</span>
                                    </label>
                                </div>
                            </div>

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
                                    <label className="text-[10px] uppercase text-slate-500 font-bold">Real DTM (km)</label>
                                    <input 
                                        type="number" 
                                        value={params.dtm} 
                                        onChange={(e) => handleInputChange('dtm', Number(e.target.value))}
                                        className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold">DTM Trailer Hours</label>
                                    <input 
                                        type="number" 
                                        value={params.trailerHours} 
                                        onChange={(e) => handleInputChange('trailerHours', Number(e.target.value))}
                                        className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <label className="flex items-center space-x-3 cursor-pointer p-1 hover:bg-slate-50 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={params.isOfflineBOP} 
                                        onChange={(e) => handleInputChange('isOfflineBOP', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-slate-700 font-medium">Offline BOP Test</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer p-1 hover:bg-slate-50 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={params.isNoLogging} 
                                        onChange={(e) => handleInputChange('isNoLogging', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-slate-700 font-medium">No Logging</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer p-1 hover:bg-slate-50 rounded bg-blue-50/50">
                                    <input 
                                        type="checkbox" 
                                        checked={params.isDirectional} 
                                        onChange={(e) => handleInputChange('isDirectional', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-800 font-bold">Directional Well</span>
                                        <span className="text-[9px] text-slate-500">Increases complexity & tool cost</span>
                                    </div>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer p-1 hover:bg-slate-50 rounded bg-orange-50/50">
                                    <input 
                                        type="checkbox" 
                                        checked={params.hasGeologicalControl} 
                                        onChange={(e) => handleInputChange('hasGeologicalControl', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-800 font-bold">Geological Control</span>
                                        <span className="text-[9px] text-slate-500">Add. mud logging unit</span>
                                    </div>
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
                                {programData.map((line) => {
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
                                                        className={`w-12 text-[10px] text-right font-mono bg-slate-50 border-b border-dashed border-slate-300 focus:border-blue-500 outline-none px-0.5 ${
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
                                    {result.timeCurve.length > 0 ? result.timeCurve[result.timeCurve.length - 1].depth : 0} <span className="text-sm font-normal text-slate-400">m</span>
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
                                        <YAxis 
                                            yAxisId="left" 
                                            reversed 
                                            label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#94a3b8' }} 
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                        />
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

                        {/* Detailed Program Table */}
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
                                                    {line.type === 'MOVING' || line.id === '0' ? '-' : line.daysFromSpud.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-500">{line.cumulativeTime.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                         {/* Cost Summary Table (AFE View) */}
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <TableCellsIcon className="w-4 h-4" />
                                    Cost Summary (AFE View) - {params.equipmentType}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Group AFE</th>
                                            <th className="px-4 py-3">Item AFE</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3 text-center">Unit</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                            <th className="px-4 py-3 text-right">Qty</th>
                                            <th className="px-4 py-3 text-right">Amount ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(groupedCostSummary).map(([groupName, rows]) => (
                                            <React.Fragment key={groupName}>
                                                <tr className="bg-slate-100/50">
                                                    <td colSpan={7} className="px-4 py-2 font-bold text-xs text-slate-700 uppercase tracking-wide">
                                                        {groupName}
                                                    </td>
                                                </tr>
                                                {rows.map((row, idx) => (
                                                    <tr key={`${groupName}-${idx}`} className="hover:bg-slate-50">
                                                        <td className="px-4 py-2 text-xs text-slate-400"></td>
                                                        <td className="px-4 py-2 text-xs font-medium text-slate-600">{row.item}</td>
                                                        <td className="px-4 py-2 text-xs text-slate-800">{row.description}</td>
                                                        <td className="px-4 py-2 text-center text-xs font-mono">{row.unit}</td>
                                                        <td className="px-4 py-2 text-right font-mono text-xs">${row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-2 text-right font-mono text-xs">{row.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-2 text-right font-mono font-medium text-slate-700 text-xs">
                                                            ${row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Subtotal for Group */}
                                                <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                                                     <td colSpan={6} className="px-4 py-2 text-right text-xs text-slate-600">Total {groupName}</td>
                                                     <td className="px-4 py-2 text-right text-xs text-slate-800">
                                                         ${rows.reduce((sum, r) => sum + r.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                     </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Well Premises & Notes (Text Area) */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <PencilSquareIcon className="w-4 h-4" />
                                    Well Premises & Notes
                                </h3>
                            </div>
                            <div className="p-4">
                                <textarea
                                    value={params.userNotes || ''}
                                    onChange={(e) => handleInputChange('userNotes', e.target.value)}
                                    placeholder="Enter specific operational premises, risks, or assumptions for this well here..."
                                    className="w-full h-32 p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleWellAnalysis;
