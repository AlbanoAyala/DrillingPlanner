import React, { useCallback } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface FileDropZoneProps {
    onFileLoaded: (fileName: string) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileLoaded }) => {
    // In a real app, we would use react-dropzone and parse CSV here.
    // For this frontend demo, we simulate the drop.
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        // Simulate processing
        setTimeout(() => {
            onFileLoaded("Program_Structure_v2.csv");
        }, 500);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    return (
        <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer h-full"
        >
            <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                <CloudArrowUpIcon className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">Drag & Drop Config Files</p>
            <p className="text-xs text-slate-400 mt-1">Supports CSV or Excel</p>
            
            <div className="mt-4 flex gap-2">
                <div className="flex items-center gap-1 text-[10px] bg-white border px-2 py-1 rounded text-slate-500">
                    <DocumentTextIcon className="w-3 h-3" /> Technical Lib
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-white border px-2 py-1 rounded text-slate-500">
                    <DocumentTextIcon className="w-3 h-3" /> Schedule
                </div>
            </div>
        </div>
    );
};

export default FileDropZone;