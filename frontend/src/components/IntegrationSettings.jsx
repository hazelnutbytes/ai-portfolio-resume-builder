import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  Sheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Key,
  ShieldCheck,
  FileCode,
  Info,
} from 'lucide-react';
import { api } from '../services/api';

export default function IntegrationSettings({
  integrations,
  onRefreshIntegrations,
}) {
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const logs = await api.getSheetsLogs(5);
      setSyncLogs(logs);
    } catch (err) {
      console.error('Failed to fetch sync logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncLoading(true);
      setSyncResult(null);
      const res = await api.syncSheets();
      setSyncResult(res);
      onRefreshIntegrations();
      fetchLogs();
    } catch (err) {
      setSyncResult({
        success: false,
        message: err.message || 'Google Sheets sync failed.',
        status: err.data?.status || 'ERROR',
      });
      fetchLogs();
    } finally {
      setSyncLoading(false);
    }
  };

  const gemini = integrations?.gemini || {};
  const sheets = integrations?.google_sheets || {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">External Integrations & Settings</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Verify configuration for Google Gemini AI and Google Sheets synchronization. All secrets are kept on the Python backend.
        </p>
      </div>

      {/* Grid of 2 Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini AI Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Google Gemini AI</h3>
                  <span className="text-[11px] text-slate-500 font-mono">google-genai SDK</span>
                </div>
              </div>

              {gemini.configured ? (
                <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Rule Fallback</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {gemini.message}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs font-mono">
              <div className="text-slate-500 text-[11px]">Active Model:</div>
              <div className="text-slate-900 font-semibold">{gemini.model || 'gemini-2.5-flash'}</div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Obtain an API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline inline-flex items-center">Google AI Studio <ExternalLink className="w-3 h-3 ml-0.5" /></a> and set <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">GEMINI_API_KEY</code> in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">.env</code>.
          </div>
        </div>

        {/* Google Sheets Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Google Sheets Synchronization</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Google Sheets API v4</span>
                </div>
              </div>

              {sheets.configured ? (
                <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  Unconfigured
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {sheets.message}
            </p>

            {sheets.spreadsheet_url && (
              <a
                href={sheets.spreadsheet_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
              >
                <span>Open Linked Google Spreadsheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {sheets.service_account_email && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] font-mono text-slate-700 truncate">
                <span className="text-slate-400">SA Email: </span>
                {sheets.service_account_email}
              </div>
            )}
          </div>

          {/* Sync CTA button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleManualSync}
              disabled={syncLoading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
              <span>{syncLoading ? 'Syncing Category Tabs...' : 'Sync to Google Sheets Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Output Banner if triggered */}
      {syncResult && (
        <div
          className={`p-4 rounded-2xl border text-xs space-y-1 ${
            syncResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="font-bold flex items-center space-x-1.5">
            {syncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            )}
            <span>{syncResult.success ? 'Sync Successful' : `Status: ${syncResult.status || 'Sync Notice'}`}</span>
          </div>
          <p className="leading-relaxed">{syncResult.message}</p>
          {syncResult.spreadsheet_url && (
            <a
              href={syncResult.spreadsheet_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 font-bold underline pt-1 text-emerald-800"
            >
              <span>View Updated Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Sync Audit History Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Recent Sync Audit Logs</h3>
          <button
            onClick={fetchLogs}
            disabled={logsLoading}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {syncLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">No synchronization events recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs gap-2"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.status === 'UNCONFIGURED'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="font-medium text-slate-800">{log.message}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">{log.created_at}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step-by-Step Setup Guide */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">College Project Setup & Configuration Guide</h3>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-purple-600" />
              <span>1. How to Configure Google Gemini API</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
              <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google AI Studio</a> and log in with your Google account.</li>
              <li>Click <strong>Create API Key</strong> and copy the generated key.</li>
              <li>Open the project root <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.env</code> file.</li>
              <li>Set <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY=AIzaSy...</code> and save the file.</li>
              <li>Restart the Flask backend (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">python backend/app.py</code>).</li>
            </ol>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Sheet className="w-4 h-4 text-emerald-600" />
              <span>2. How to Configure Google Sheets Synchronization</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Cloud Console</a> and create or select a project.</li>
              <li>Under <strong>APIs & Services &gt; Library</strong>, search for <strong>Google Sheets API</strong> and click <strong>Enable</strong>.</li>
              <li>Go to <strong>IAM & Admin &gt; Service Accounts</strong> and click <strong>Create Service Account</strong>.</li>
              <li>Under <strong>Keys &gt; Add Key &gt; Create new key</strong>, choose <strong>JSON</strong> and download the key file.</li>
              <li>Place the downloaded key file at <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">backend/service_account.json</code> (it is already in <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.gitignore</code> to protect credentials).</li>
              <li>Create a new spreadsheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline">sheets.new</a>.</li>
              <li>Click <strong>Share</strong> and add your Service Account's email address as an <strong>Editor</strong>.</li>
              <li>Copy the Spreadsheet ID from the URL (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">https://docs.google.com/spreadsheets/d/&lt;SPREADSHEET_ID&gt;/edit</code>) and set <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">GOOGLE_SPREADSHEET_ID=...</code> in <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.env</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
