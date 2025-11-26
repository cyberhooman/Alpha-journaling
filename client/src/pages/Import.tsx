import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, CheckCircle, XCircle } from 'lucide-react';
import { importAPI } from '../lib/api';

export default function Import() {
  const queryClient = useQueryClient();
  const [csvData, setCsvData] = useState('');
  const [result, setResult] = useState<any>(null);

  const importMutation = useMutation({
    mutationFn: (data: string) => importAPI.uploadCSV(data),
    onSuccess: async (response) => {
      setResult(response.data);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['trades'] }),
        queryClient.refetchQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvData(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (csvData) {
      importMutation.mutate(csvData);
    }
  };

  const downloadTemplate = () => {
    const template = `Symbol,Side,Entry Date,Exit Date,Entry Price,Exit Price,Quantity,Stop Loss,Take Profit,Fees,Strategy,Notes
AAPL,LONG,2024-01-15T10:30:00Z,2024-01-15T14:30:00Z,150.50,152.75,10,149.00,153.00,2.50,Breakout,Good entry on volume spike
TSLA,SHORT,2024-01-16T09:00:00Z,,245.80,,5,250.00,240.00,1.25,Momentum,Shorting resistance level`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Import Trades</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Import trades from your broker via CSV file</p>
      </div>

      {/* Template Download */}
      <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex items-start gap-4">
          <Download className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">CSV Template</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Download our CSV template to ensure your data is formatted correctly
            </p>
            <button onClick={downloadTemplate} className="btn btn-primary text-sm">
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* CSV Format Guide */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Required Fields</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Required:</h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              <li>• Symbol</li>
              <li>• Side (LONG, SHORT, BUY, or SELL)</li>
              <li>• Entry Date (ISO format)</li>
              <li>• Entry Price</li>
              <li>• Quantity</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Optional:</h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              <li>• Exit Date</li>
              <li>• Exit Price</li>
              <li>• Stop Loss</li>
              <li>• Take Profit</li>
              <li>• Fees</li>
              <li>• Strategy, Notes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upload CSV File</h3>

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8">
          <div className="text-center">
            <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="btn btn-primary">Choose File</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">or drag and drop your CSV file here</p>
          </div>
        </div>

        {csvData && (
          <div className="mt-4">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">Preview:</p>
              <pre className="text-xs text-slate-600 dark:text-slate-300 overflow-x-auto max-h-40">
                {csvData.split('\n').slice(0, 5).join('\n')}
                {csvData.split('\n').length > 5 && '\n...'}
              </pre>
            </div>

            <button
              onClick={handleImport}
              className="btn btn-primary"
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? 'Importing...' : 'Import Trades'}
            </button>
          </div>
        )}
      </div>

      {/* Import Results */}
      {result && (
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Import Results</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">{result.imported} trades imported</span>
              </div>
              {result.errors > 0 && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">{result.errors} errors</span>
                </div>
              )}
            </div>

            {result.details.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Errors:</h4>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {result.details.errors.map((error: any, index: number) => (
                    <div key={index} className="text-sm text-red-700 dark:text-red-300">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
