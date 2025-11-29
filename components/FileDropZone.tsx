
import React, { useState } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, TableCellsIcon, CurrencyDollarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface FileDropZoneProps {
    onFilesProcessed: (activityFile: File | null, efficiencyFile: File | null, costFile: File | null) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesProcessed }) => {
    const [activityFile, setActivityFile] = useState<File | null>(null);
    const [efficiencyFile, setEfficiencyFile] = useState<File | null>(null);
    const [costFile, setCostFile] = useState<File | null>(null);

    const handleFileSelect = (type: 'activity' | 'efficiency' | 'cost') => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'activity') setActivityFile(file);
            if (type === 'efficiency') setEfficiencyFile(file);
            if (type === 'cost') setCostFile(file);
        }
    };

    const handleProcess = () => {
        onFilesProcessed(activityFile, efficiencyFile, costFile);
    };

    const handleUseDemo = () => {
        // Pass nulls to trigger demo loading logic in parent
        onFilesProcessed(null, null, null);
    };

    const FileCard = ({ title, icon: Icon, file, type }: { title: string, icon: any, file: File | null, type: 'activity' | 'efficiency' | 'cost' }) => (
        <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors h-48 relative ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
            <input 
                type="file" 
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect(type)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
                <CheckCircleIcon className="w-10 h-10 text-green-500 mb-2" />
            ) : (
                <div className="bg-blue-50 p-3 rounded-full mb-3">
                    <Icon className="w-6 h-6 text-blue-500" />
                </div>
            )}
            <p className="text-sm font-bold text-slate-700 text-center">{title}</p>
            <p className="text-xs text-slate-400 mt-1 text-center truncate w-full px-2">
                {file ? file.name : "Click to Upload (Excel/CSV)"}
            </p>
        </div>
    );

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Setup Project Data</h2>
                <p className="text-slate-500 mt-2">Please upload the required 3 configuration files to initialize the planner.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
                <FileCard 
                    title="1. Activity Schedule" 
                    icon={TableCellsIcon} 
                    file={activityFile} 
                    type="activity"
                />
                <FileCard 
                    title="2. Efficiency (Tech Lib)" 
                    icon={DocumentTextIcon} 
                    file={efficiencyFile} 
                    type="efficiency"
                />
                <FileCard 
                    title="3. Cost Catalog" 
                    icon={CurrencyDollarIcon} 
                    file={costFile} 
                    type="cost"
                />
            </div>

            <div className="mt-10 flex flex-col items-center gap-4">
                <button 
                    onClick={handleProcess}
                    disabled={!activityFile || !efficiencyFile || !costFile}
                    className={`px-8 py-3 rounded-lg text-sm font-bold shadow-lg transition-all ${
                        (!activityFile || !efficiencyFile || !costFile)
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1'
                    }`}
                >
                    Process Files & Start
                </button>
                
                <button 
                    onClick={handleUseDemo} 
                    className="text-sm text-slate-400 hover:text-blue-500 underline decoration-dotted"
                >
                    Or use Default Demo Data (for testing)
                </button>
            </div>
        </div>
    );
};

export default FileDropZone;
