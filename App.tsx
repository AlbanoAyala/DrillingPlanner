import React, { useState } from 'react';
import SingleWellAnalysis from './components/SingleWellAnalysis';
import AnnualBudget from './components/AnnualBudget';
import FileDropZone from './components/FileDropZone';
import { ChartBarIcon, CalculatorIcon, DocumentCheckIcon } from '@heroicons/react/24/solid';
import { SimulationParams } from './types';

export type ChartMode = 'total' | 'net' | 'both';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'single' | 'annual'>('single');
    const [filesLoaded, setFilesLoaded] = useState(false);

    // Persisted State for Single Well Analysis
    const [singleWellParams, setSingleWellParams] = useState<SimulationParams>({
        tdGuide: 600, 
        tdIsolation: 2200,
        dtm: 120, 
        isOfflineBOP: false,
        isNoLogging: false,
        adjustments: {}
    });
    
    const [chartMode, setChartMode] = useState<ChartMode>('total');

    return (
        <div className="h-screen bg-slate-50 text-slate-800 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 flex-none z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <CalculatorIcon className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Drilling Cost Planner <span className="text-xs font-normal text-slate-400 ml-1">v1.0</span></h1>
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
                                onClick={() => setActiveTab('annual')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <ChartBarIcon className="w-4 h-4" />
                                Annual Budget
                            </button>
                        </div>
                    )}
                    
                    <div className="text-xs text-slate-400">
                        Environment: <span className="font-semibold text-slate-600">Demo</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 py-6 overflow-hidden flex flex-col">
                {!filesLoaded ? (
                    <div className="max-w-2xl mx-auto mt-20 h-64">
                        <FileDropZone onFileLoaded={() => setFilesLoaded(true)} />
                        <div className="text-center mt-4">
                            <button 
                                onClick={() => setFilesLoaded(true)} 
                                className="text-sm text-blue-500 hover:underline"
                            >
                                Use Default Demo Data
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden h-full">
                        {activeTab === 'single' ? (
                            <SingleWellAnalysis 
                                params={singleWellParams}
                                setParams={setSingleWellParams}
                                chartMode={chartMode}
                                setChartMode={setChartMode}
                            />
                        ) : (
                            <AnnualBudget />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;