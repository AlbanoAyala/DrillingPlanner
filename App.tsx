
import React, { useState, useEffect } from 'react';
import SingleWellAnalysis from './components/SingleWellAnalysis';
import AnnualBudget from './components/AnnualBudget';
import ScenarioPlanning from './components/ScenarioPlanning';
import FileDropZone from './components/FileDropZone';
import { ChartBarIcon, CalculatorIcon, DocumentCheckIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/solid';
import { SimulationParams, Well, ProgramLine, CostCatalogItem, Scenario } from './types';
import { MOCKED_ACTIVITY_SCHEDULE, INITIAL_PROGRAM, MOCKED_COST_CATALOG } from './constants';

export type ChartMode = 'total' | 'net' | 'both';

// Default parameters for a fresh well
const DEFAULT_PARAMS: SimulationParams = {
    tdGuide: 600, 
    tdIsolation: 2200,
    dtm: 120, 
    trailerHours: 10, // Default for trailer DTM
    equipmentType: 'H-202',
    isFirstWell: false,
    wellType: 'Convencional',
    isOfflineBOP: false,
    isNoLogging: false,
    isDirectional: false,
    hasGeologicalControl: false,
    adjustments: {},
    userNotes: ''
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'single' | 'annual' | 'scenario'>('single');
    const [filesLoaded, setFilesLoaded] = useState(false);

    // --- DATA STATE (From Files) ---
    const [scheduleData, setScheduleData] = useState<Well[]>([]);
    const [programData, setProgramData] = useState<ProgramLine[]>([]);
    const [costData, setCostData] = useState<CostCatalogItem[]>([]);

    // Selected Well for Analysis
    const [selectedWellId, setSelectedWellId] = useState<string>('');

    // Central Registry of Configurations (Well ID -> Params)
    const [wellConfigs, setWellConfigs] = useState<Record<string, SimulationParams>>({});

    // Scenario Registry (List of ALL Saved Snapshots)
    const [scenarios, setScenarios] = useState<Scenario[]>([]);

    // Budget Selection (List of Scenarios chosen for the Annual Budget)
    const [budgetScenarios, setBudgetScenarios] = useState<Scenario[]>([]);

    // Current Working Params (for the displayed well in Single View)
    const [currentParams, setCurrentParams] = useState<SimulationParams>(DEFAULT_PARAMS);
    
    // View States
    const [chartMode, setChartMode] = useState<ChartMode>('total');

    // Handle File Processing (Simulated or Real)
    const handleFilesProcessed = (activityFile: File | null, efficiencyFile: File | null, costFile: File | null) => {
        // If files are null, it means "Use Demo Data" was clicked
        if (!activityFile && !efficiencyFile && !costFile) {
            setScheduleData(MOCKED_ACTIVITY_SCHEDULE);
            setProgramData(INITIAL_PROGRAM);
            setCostData(MOCKED_COST_CATALOG);
            
            if (MOCKED_ACTIVITY_SCHEDULE.length > 0) {
                setSelectedWellId(MOCKED_ACTIVITY_SCHEDULE[0].id);
            }
            setFilesLoaded(true);
            return;
        }

        // TODO: In a real environment, read the Excel files here using a library like 'xlsx'
        console.log("Processing uploaded files:", activityFile?.name, efficiencyFile?.name, costFile?.name);
        
        setTimeout(() => {
            setScheduleData(MOCKED_ACTIVITY_SCHEDULE);
            setProgramData(INITIAL_PROGRAM);
            setCostData(MOCKED_COST_CATALOG);

            if (MOCKED_ACTIVITY_SCHEDULE.length > 0) {
                setSelectedWellId(MOCKED_ACTIVITY_SCHEDULE[0].id);
            }
            setFilesLoaded(true);
        }, 1500);
    };

    // When Selected Well changes, load its config or default
    useEffect(() => {
        const well = scheduleData.find(w => w.id === selectedWellId);
        
        if (selectedWellId && wellConfigs[selectedWellId]) {
            // Load existing config
            setCurrentParams(wellConfigs[selectedWellId]);
        } else if (well) {
            // New well, apply defaults but Sync Well Type AND Equipment from Schedule
            setCurrentParams({
                ...DEFAULT_PARAMS,
                wellType: well.type, 
                equipmentType: well.equipment || 'H-202',
                userNotes: ''
            });
        }
    }, [selectedWellId, wellConfigs, scheduleData]);

    // Handle creating a new snapshot from Single Well View
    const handleSaveScenario = (name: string) => {
        if (!selectedWellId) return;
        
        const newScenario: Scenario = {
            id: crypto.randomUUID(),
            wellId: selectedWellId,
            name: name,
            createdAt: Date.now(),
            params: JSON.parse(JSON.stringify(currentParams)) // Deep copy
        };

        setScenarios(prev => [...prev, newScenario]);
        
        // Also update local cache
        setWellConfigs(prev => ({
            ...prev,
            [selectedWellId]: currentParams
        }));
    };

    // Handle loading a scenario back into Single Well View
    const handleLoadScenario = (scenario: Scenario) => {
        setSelectedWellId(scenario.wellId);
        setCurrentParams(scenario.params);
        setActiveTab('single');
    };

    // Handle updating the Annual Budget list
    const handleUpdateBudget = (selectedScenarios: Scenario[]) => {
        setBudgetScenarios(selectedScenarios);
        setActiveTab('annual');
    };

    return (
        <div className="h-screen bg-slate-50 text-slate-800 flex flex-col overflow-hidden print:h-auto print:overflow-visible print:bg-white print:block">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 flex-none z-30 shadow-sm print:hidden">
                <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <CalculatorIcon className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Drilling Cost Planner <span className="text-xs font-normal text-slate-400 ml-1">v2.1</span></h1>
                    </div>
                    
                    {filesLoaded && (
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setActiveTab('single')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'single' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <DocumentCheckIcon className="w-4 h-4" />
                                Single Well
                            </button>
                            <button 
                                onClick={() => setActiveTab('scenario')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'scenario' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <ClipboardDocumentListIcon className="w-4 h-4" />
                                Scenario Planning
                            </button>
                            <button 
                                onClick={() => setActiveTab('annual')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <ChartBarIcon className="w-4 h-4" />
                                Annual Budget
                            </button>
                        </div>
                    )}
                    
                    <div className="text-xs text-slate-400 font-medium">
                        Desarrollado por <span className="text-slate-700 font-bold">Ing de perforación CGC</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 py-6 overflow-auto flex flex-col print:overflow-visible print:h-auto print:max-w-none print:p-0 print:block">
                {!filesLoaded ? (
                    <div className="max-w-4xl mx-auto mt-10 h-3/4">
                        <FileDropZone onFilesProcessed={handleFilesProcessed} />
                    </div>
                ) : (
                    <div className="flex-1 h-full print:overflow-visible print:h-auto print:block">
                        {activeTab === 'single' && (
                            <SingleWellAnalysis 
                                params={currentParams}
                                setParams={setCurrentParams}
                                chartMode={chartMode}
                                setChartMode={setChartMode}
                                wells={scheduleData}
                                selectedWellId={selectedWellId}
                                onSelectWell={setSelectedWellId}
                                onSaveScenario={handleSaveScenario}
                                programData={programData}
                                costData={costData}
                            />
                        )}
                        {activeTab === 'scenario' && (
                            <ScenarioPlanning 
                                wells={scheduleData}
                                programData={programData}
                                costData={costData}
                                scenarios={scenarios}
                                setScenarios={setScenarios}
                                onSendToBudget={handleUpdateBudget}
                                onLoadScenario={handleLoadScenario}
                            />
                        )}
                        {activeTab === 'annual' && (
                            <AnnualBudget 
                                wells={scheduleData}
                                budgetScenarios={budgetScenarios}
                                programData={programData}
                                costData={costData}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
