
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { FileData } from '../types';

interface FileUploadProps {
  files: FileData[];
  onFilesChange: (files: FileData[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesChange, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (incomingFiles: File[]) => {
    const validFiles = incomingFiles.filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      if (incomingFiles.length > 0) alert("Only PDF files are supported.");
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    const totalBytes = validFiles.reduce((acc, file) => acc + file.size, 0);
    let loadedBytes = 0;
    const duplicates: string[] = [];

    try {
      const filePromises = validFiles.map(async (file) => {
        const isDuplicate = files.some(
          (existingFile) => existingFile.name === file.name && existingFile.size === file.size
        );

        if (isDuplicate) {
          duplicates.push(file.name);
          loadedBytes += file.size;
          setUploadProgress(Math.round((loadedBytes / totalBytes) * 100));
          return null;
        }

        return new Promise<FileData>((resolve) => {
          const reader = new FileReader();
          let lastLoaded = 0;

          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              const delta = event.loaded - lastLoaded;
              lastLoaded = event.loaded;
              loadedBytes += delta;
              setUploadProgress(Math.min(99, Math.round((loadedBytes / totalBytes) * 100)));
            }
          };

          reader.onload = () => {
            const remaining = file.size - lastLoaded;
            if (remaining > 0) loadedBytes += remaining;
            setUploadProgress(Math.min(100, Math.round((loadedBytes / totalBytes) * 100)));

            const result = reader.result as string;
            const base64String = result.split(',')[1];
            resolve({
              name: file.name,
              base64: base64String,
              size: file.size
            });
          };

          reader.readAsDataURL(file);
        });
      });

      const processedResults = await Promise.all(filePromises);
      const newFiles = processedResults.filter((f): f is FileData => f !== null);

      if (duplicates.length > 0) {
        alert(`Skipped ${duplicates.length} duplicate(s).`);
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    } catch (err) {
      console.error("File processing error:", err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setUploadProgress(0);
      }, 500);
    }
  }, [files, onFilesChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files) as File[];
    processFiles(filesArray);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading && !isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading || isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      processFiles(filesArray);
    }
  };

  const removeFile = (originalIndex: number) => {
    const updated = [...files];
    updated.splice(originalIndex, 1);
    onFilesChange(updated);
  };

  const clearAllFiles = () => {
    if (window.confirm("Remove all departmental documents?")) {
      onFilesChange([]);
    }
  };

  const filteredFiles = useMemo(() => {
    return files
      .map((file, index) => ({ ...file, originalIndex: index }))
      .filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [files, searchQuery]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border-r border-slate-200 h-full overflow-hidden w-full md:w-80 shadow-sm">
      <div className="flex items-center justify-between shrink-0 mb-1">
        <div className="flex flex-col">
          <h2 className="text-sm font-black text-emerald-900 uppercase tracking-tight">Document Library</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Authorized Access Only</p>
        </div>
        <div className="flex items-center gap-2">
          {files.length > 1 && (
            <button 
              onClick={clearAllFiles}
              className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter transition-colors"
            >
              Flush All
            </button>
          )}
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
            {files.length}
          </span>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-8 py-2 border border-slate-100 rounded-lg bg-slate-50 text-[11px] focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium"
          />
        </div>
        <button 
          onClick={() => folderInputRef.current?.click()}
          className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-colors border border-slate-100"
          title="Upload folder"
          disabled={isLoading || isProcessing}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>
        <input 
          type="file" 
          ref={folderInputRef}
          className="hidden" 
          // @ts-ignore
          webkitdirectory="" 
          directory="" 
          multiple 
          onChange={handleFileChange}
        />
      </div>

      <label 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full shrink-0 transition-all duration-200 border-2 border-dashed rounded-xl cursor-pointer ${
          files.length === 0 ? 'h-32' : 'h-20'
        } ${
          isLoading || isProcessing
            ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60' 
            : isDragging 
              ? 'bg-emerald-50 border-emerald-500 border-solid scale-[1.02]' 
              : 'bg-slate-50 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-300'
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center px-4">
          <div className={`mb-1 rounded-full transition-colors ${isDragging ? 'bg-emerald-600 text-white p-1.5' : 'bg-emerald-100 text-emerald-700 p-1.5'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <p className="text-[10px] text-slate-600 font-bold">
            <span className="text-emerald-700">Add Internal PDFs</span>
          </p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          multiple 
          accept=".pdf" 
          onChange={handleFileChange} 
          disabled={isLoading || isProcessing}
        />
      </label>

      {/* Progress Section */}
      {(isProcessing || uploadProgress > 0) && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-tighter">Syncing Library</span>
            <span className="text-[10px] font-black text-emerald-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-emerald-700 h-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 mt-1 pr-1 custom-scrollbar">
        {filteredFiles.map((file) => (
          <div key={`${file.name}-${file.originalIndex}`} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg group animate-in fade-in slide-in-from-left-2 duration-300 hover:border-emerald-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="bg-red-50 p-1.5 rounded shrink-0">
                <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                <p className="text-[9px] text-slate-400 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => removeFile(file.originalIndex)}
              className="text-slate-300 hover:text-red-500 transition-colors p-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; opacity: 0.5; }
      `}</style>
    </div>
  );
};

export default FileUpload;
