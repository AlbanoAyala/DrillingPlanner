
import React, { useState, useMemo } from 'react';
import { Well, ProgramLine, CostCatalogItem, Scenario } from '../types';
import { calculateWellProgram } from '../services/calculationEngine';
import { TrashIcon, CheckCircleIcon, ArrowRightOnRectangleIcon, PencilSquareIcon, ScaleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ScenarioPlanningProps {
    wells: Well[];
    programData: ProgramLine[];
    costData: CostCatalogItem[];
    scenarios: Scenario[];
    setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
    onSendToBudget: (selectedScenarios: Scenario[]) => void;
    onLoadScenario: (scenario: Scenario) => void;
}

const ScenarioPlanning: React.FC<ScenarioPlanningProps> = ({ 
    wells, programData, costData, scenarios, setScenarios, onSendToBudget, onLoadScenario
}) => {
    const [selectedScenarioIds, setSelectedScenarioIds] = useState<Set<string>>(new Set());
    const [showComparison, setShowComparison] = useState(false);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedScenarioIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedScenarioIds(newSet);
    };

    const handleDeleteScenario = (id: string) => {
        setScenarios(prev => prev.filter(s => s.id !== id));
        const newSet = new Set(selectedScenarioIds);
        newSet.delete(id);
        setSelectedScenarioIds(newSet);
    };

    const handleSendToBudget = () => {
        const selected = scenarios.filter(s => selectedScenarioIds.has(s.id));
        if (selected.length === 0) {
            alert("Please select at least one scenario to include in the budget.");
            return;
        }
        onSendToBudget(selected);
    };

    // Calculate data for comparison view
    const comparisonData = useMemo(() => {
        if (!showComparison) return [];
        return scenarios
            .filter(s => selectedScenarioIds.has(s.id))
            .map(scenario => {
                const well = wells.find(w => w.id === scenario.wellId);
                const result = calculateWellProgram(programData, scenario.params, costData);
                return { scenario, well, result };
            });
    }, [scenarios, selectedScenarioIds, showComparison, wells, programData, costData]);

    // Helpers for Highlighting Best Stats
    const minCost = Math.min(...comparisonData.map(d => d.result.totalCost));
    const minDays = Math.min(...comparisonData.map(d => d.result.totalTimeDays));

    return (
        <div className="flex flex-col gap-6 h-full p-4 relative">
            
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-4 flex-none">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Scenario Management</h2>
                    <p className="text-slate-500">Select scenarios to build your Annual Budget or Compare them.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowComparison(!showComparison)}
                        disabled={selectedScenarioIds.size < 2}
                        className={`px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2 ${
                            selectedScenarioIds.size >= 2 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {showComparison ? <XMarkIcon className="w-5 h-5" /> : <ScaleIcon className="w-5 h-5" />}
                        {showComparison ? 'Close Comparison' : `Compare Selected (${selectedScenarioIds.size})`}
                    </button>

                    <button 
                        onClick={handleSendToBudget}
                        disabled={selectedScenarioIds.size === 0}
                        className={`px-6 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2 ${
                            selectedScenarioIds.size > 0 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Send to Annual Budget ({selectedScenarioIds.size})
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 relative">
                
                {/* COMPARISON VIEW OVERLAY */}
                {showComparison && (
                    <div className="absolute inset-0 z-20 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <ScaleIcon className="w-5 h-5 text-indigo-500" />
                                Side-by-Side Comparison
                            </h3>
                            <button onClick={() => setShowComparison(false)} className="text-slate-400 hover:text-slate-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-3 border-b-2 border-slate-200 bg-white sticky top-0 left-0 z-10 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Parameter</th>
                                        {comparisonData.map((d) => (
                                            <th key={d.scenario.id} className="p-3 border-b-2 border-slate-200 bg-slate-50 min-w-[200px] text-center">
                                                <div className="font-bold text-slate-800 text-base">{d.scenario.name}</div>
                                                <div className="text-xs text-slate-500 font-normal">{d.well?.name}</div>
                                                <div className="mt-1 text-xs text-slate-400">{new Date(d.scenario.createdAt).toLocaleDateString()}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {/* KPIs Section */}
                                    <tr className="bg-slate-50/50"><td colSpan={comparisonData.length + 1} className="p-2 font-bold text-xs uppercase text-slate-400 tracking-wider">Key Performance Indicators</td></tr>
                                    
                                    <tr>
                                        <td className="p-3 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">Total Cost</td>
                                        {comparisonData.map((d) => (
                                            <td key={d.scenario.id} className={`p-3 text-center font-mono font-bold text-lg ${d.result.totalCost === minCost ? 'text-green-600 bg-green-50' : 'text-slate-800'}`}>
                                                ${(d.result.totalCost / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k
                                                {d.result.totalCost === minCost && <span className="block text-[10px] font-normal text-green-600">Lowest Cost</span>}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-slate-700 sticky left-0 bg-white border-r border-slate-100">Total Days</td>
                                        {comparisonData.map((d) => (
                                            <td key={d.scenario.id} className={`p-3 text-center font-mono font-bold text-lg ${d.result.totalTimeDays === minDays ? 'text-green-600 bg-green-50' : 'text-blue-600'}`}>
                                                {d.result.totalTimeDays.toFixed(1)} d
                                                {d.result.totalTimeDays === minDays && <span className="block text-[10px] font-normal text-green-600">Fastest</span>}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">Final Depth</td>
                                        {comparisonData.map((d) => (
                                            <td key={d.scenario.id} className="p-3 text-center font-mono text-slate-600">
                                                {d.result.timeCurve[d.result.timeCurve.length - 1]?.depth} m
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Cost Breakdown */}
                                    <tr className="bg-slate-50/50"><td colSpan={comparisonData.length + 1} className="p-2 font-bold text-xs uppercase text-slate-400 tracking-wider">Cost Breakdown</td></tr>
                                    
                                    {['02.01 EQUIPO', '02.02 SERVICIOS', '02.03 MATERIALES'].map(group => (
                                        <tr key={group}>
                                            <td className="p-3 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">{group.substring(6)}</td>
                                            {comparisonData.map((d) => {
                                                const groupCost = d.result.costSummary
                                                    .filter(c => c.group === group)
                                                    .reduce((acc, curr) => acc + curr.total, 0);
                                                return (
                                                    <td key={d.scenario.id} className="p-3 text-center font-mono text-slate-600">
                                                        ${(groupCost / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}

                                    {/* Design Parameters */}
                                    <tr className="bg-slate-50/50"><td colSpan={comparisonData.length + 1} className="p-2 font-bold text-xs uppercase text-slate-400 tracking-wider">Design Parameters</td></tr>
                                    
                                    <tr>
                                        <td className="p-3 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">Rig</td>
                                        {comparisonData.map((d) => (
                                            <td key={d.scenario.id} className="p-3 text-center text-slate-800 bg-slate-50 rounded m-1">
                                                {d.scenario.params.equipmentType}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">Directional</td>
                                        {comparisonData.map((d) => (
                                            <td key={d.scenario.id} className="p-3 text-center">
                                                {d.scenario.params.isDirectional 
                                                    ? <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">YES</span> 
                                                    : <span className="text-slate-400">-</span>
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">Geo Control</td>
                                        {comparisonData.map((d) => (
                                            <td key={d.scenario.id} className="p-3 text-center">
                                                {d.scenario.params.hasGeologicalControl 
                                                    ? <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">YES</span> 
                                                    : <span className="text-slate-400">-</span>
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">TD Guide / Isol</td>
                                        {comparisonData.map((d) => (
                                            <td key={d.scenario.id} className="p-3 text-center font-mono text-xs text-slate-600">
                                                {d.scenario.params.tdGuide}m / {d.scenario.params.tdIsolation}m
                                            </td>
                                        ))}
                                    </tr>
                                     <tr>
                                        <td className="p-3 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">DTM Dist</td>
                                        {comparisonData.map((d) => (
                                            <td key={d.scenario.id} className="p-3 text-center font-mono text-xs text-slate-600">
                                                {d.scenario.params.dtm} km
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* STANDARD TABLE VIEW */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-10 text-center">
                                        <input type="checkbox" disabled className="rounded border-slate-300" />
                                    </th>
                                    <th className="px-4 py-3">Well Name</th>
                                    <th className="px-4 py-3">Scenario Name</th>
                                    <th className="px-4 py-3 text-center">Rig</th>
                                    <th className="px-4 py-3 text-center">Dir</th>
                                    <th className="px-4 py-3 text-right">Est. Cost</th>
                                    <th className="px-4 py-3 text-right">Est. Days</th>
                                    <th className="px-4 py-3 text-center">Created</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {scenarios.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">
                                            No saved scenarios found. Go to "Single Well" to create and save scenarios.
                                        </td>
                                    </tr>
                                )}
                                {scenarios.map((scenario) => {
                                    const well = wells.find(w => w.id === scenario.wellId);
                                    const result = calculateWellProgram(programData, scenario.params, costData);
                                    const isSelected = selectedScenarioIds.has(scenario.id);

                                    return (
                                        <tr key={scenario.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-4 py-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected} 
                                                    onChange={() => toggleSelection(scenario.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{well?.name || scenario.wellId}</td>
                                            <td className="px-4 py-3 font-semibold text-blue-700">{scenario.name}</td>
                                            <td className="px-4 py-3 text-center bg-slate-100 rounded mx-2">{scenario.params.equipmentType}</td>
                                            <td className="px-4 py-3 text-center text-xs">
                                                {scenario.params.isDirectional ? <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">DIR</span> : <span className="text-slate-400">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-700">
                                                ${(result.totalCost / 1000).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}k
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-600">
                                                {result.totalTimeDays.toFixed(1)} d
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-slate-400">
                                                {new Date(scenario.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 flex justify-center gap-2">
                                                <button 
                                                    onClick={() => onLoadScenario(scenario)}
                                                    className="p-1 text-slate-400 hover:text-blue-600 tooltip" 
                                                    title="Load into Editor"
                                                >
                                                    <PencilSquareIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteScenario(scenario.id)}
                                                    className="p-1 text-slate-400 hover:text-red-500 tooltip" 
                                                    title="Delete Scenario"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScenarioPlanning;
