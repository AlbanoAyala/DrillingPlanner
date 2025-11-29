
import React, { useState } from 'react';
import { Well, ProgramLine, CostCatalogItem, Scenario } from '../types';
import { calculateWellProgram } from '../services/calculationEngine';
import { TrashIcon, CheckCircleIcon, ArrowRightOnRectangleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

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

    return (
        <div className="flex flex-col gap-6 h-full p-4">
            
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Scenario Management</h2>
                    <p className="text-slate-500">Select scenarios to build your Annual Budget.</p>
                </div>
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
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
    );
};

export default ScenarioPlanning;
