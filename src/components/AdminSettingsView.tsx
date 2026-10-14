import React, { useState, useEffect } from 'react';
import { CompanySettings, SalesBoy, Product } from '../types';
import { sanitizeWhatsAppPhone } from '../utils/whatsapp';
import { SupabaseService, SUPABASE_SQL_SCHEMA } from '../services/supabaseService';
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import {
  Settings,
  Phone,
  Building,
  User,
  Lock,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Database,
  Check,
  Copy,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface AdminSettingsViewProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  salesBoys: SalesBoy[];
  onAddSalesBoy: (boy: Omit<SalesBoy, 'id'>) => void;
  onUpdateSalesBoy: (boy: SalesBoy) => void;
  onDeleteSalesBoy: (id: string) => void;
  onResetAllData: () => void;
  allProductsCount: number;
  allOrdersCount: number;
  onSyncWithSupabase?: () => Promise<void>;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  settings,
  onSaveSettings,
  salesBoys,
  onAddSalesBoy,
  onUpdateSalesBoy,
  onDeleteSalesBoy,
  onResetAllData,
  allProductsCount,
  allOrdersCount,
  onSyncWithSupabase,
}) => {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [adminPin, setAdminPin] = useState(settings.adminPin);
  const [currency, setCurrency] = useState(settings.currency || '₹');
  const [savedNotice, setSavedNotice] = useState(false);

  // Supabase states
  const [sbConfig, setSbConfig] = useState(getSupabaseConfig());
  const [sbStatus, setSbStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
    tablesExist?: boolean;
    loading?: boolean;
  }>({ tested: false });
  const [copiedSql, setCopiedSql] = useState(false);
  const [isEditingSbConfig, setIsEditingSbConfig] = useState(false);
  const [inputSbUrl, setInputSbUrl] = useState(sbConfig.url);
  const [inputSbKey, setInputSbKey] = useState(sbConfig.anonKey);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  // Sales boy modal state
  const [isBoyModalOpen, setIsBoyModalOpen] = useState(false);
  const [editingBoy, setEditingBoy] = useState<SalesBoy | null>(null);
  const [boyName, setBoyName] = useState('');
  const [boyMobile, setBoyMobile] = useState('');
  const [boyPin, setBoyPin] = useState('');
  const [boyActive, setBoyActive] = useState(true);

  // Automatically test Supabase on view mount
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    setSbStatus({ tested: true, loading: true });
    const res = await SupabaseService.testConnection();
    setSbStatus({
      tested: true,
      success: res.success,
      message: res.message,
      tablesExist: res.tablesExist,
      loading: false,
    });
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleSaveSbConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = saveSupabaseConfig(inputSbUrl, inputSbKey);
    setSbConfig(newConfig);
    setIsEditingSbConfig(false);
    testSupabaseConnection();
  };

  const handleSeedSupabase = async () => {
    setSeedLoading(true);
    setSeedNotice(null);
    const res = await SupabaseService.seedInitialData();
    setSeedLoading(false);
    if (res.success) {
      setSeedNotice(`Successfully synced ${res.count} products to Supabase!`);
      if (onSyncWithSupabase) await onSyncWithSupabase();
    } else {
      setSeedNotice('Tables not found yet. Please run the SQL schema in Supabase first.');
    }
    setTimeout(() => setSeedNotice(null), 4000);
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      companyName: companyName.trim(),
      whatsappNumber: whatsappNumber.trim(),
      adminPin: adminPin.trim() || '9999',
      currency: currency.trim() || '₹',
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const openAddBoyModal = () => {
    setEditingBoy(null);
    setBoyName('');
    setBoyMobile('');
    setBoyPin('1234');
    setBoyActive(true);
    setIsBoyModalOpen(true);
  };

  const openEditBoyModal = (boy: SalesBoy) => {
    setEditingBoy(boy);
    setBoyName(boy.name);
    setBoyMobile(boy.mobile);
    setBoyPin(boy.pin);
    setBoyActive(boy.active);
    setIsBoyModalOpen(true);
  };

  const handleSaveBoy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boyName.trim() || !boyMobile.trim()) return;

    if (editingBoy) {
      onUpdateSalesBoy({
        ...editingBoy,
        name: boyName.trim(),
        mobile: boyMobile.trim(),
        pin: boyPin.trim() || '1234',
        active: boyActive,
      });
    } else {
      onAddSalesBoy({
        name: boyName.trim(),
        mobile: boyMobile.trim(),
        pin: boyPin.trim() || '1234',
        active: boyActive,
      });
    }
    setIsBoyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* SUPABASE CLOUD DATABASE CONNECTION CARD */}
      <div className="bg-gradient-to-br from-emerald-950 to-teal-900 text-white rounded-2xl p-4.5 shadow-md border border-emerald-700/50 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-800/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-emerald-950 flex items-center justify-center font-black">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Supabase Cloud Database</h3>
              <p className="text-[11px] text-emerald-300 font-mono">
                Project: {sbConfig.projectId || 'tzrsuftxpynkbjzkzplk'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={testSupabaseConnection}
            disabled={sbStatus.loading}
            className="p-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
            title="Test Connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sbStatus.loading ? 'animate-spin' : ''}`} />
            <span>Test</span>
          </button>
        </div>

        {/* Status result */}
        {sbStatus.tested && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 border ${
              sbStatus.success && sbStatus.tablesExist
                ? 'bg-emerald-900/60 border-emerald-600 text-emerald-200'
                : sbStatus.success && !sbStatus.tablesExist
                ? 'bg-amber-950/70 border-amber-600 text-amber-200'
                : 'bg-rose-950/70 border-rose-600 text-rose-200'
            }`}
          >
            {sbStatus.success && sbStatus.tablesExist ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-bold block">
                {sbStatus.success && sbStatus.tablesExist
                  ? 'Connected & Synchronized!'
                  : sbStatus.success && !sbStatus.tablesExist
                  ? 'Connected to Project (Tables Pending)'
                  : 'Connection Issue'}
              </span>
              <span className="text-[11px] opacity-90 block mt-0.5">{sbStatus.message}</span>
            </div>
          </div>
        )}

        {/* 1-Click SQL Setup Step */}
        <div className="bg-emerald-900/40 border border-emerald-700/60 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Step 1: Run Safe SQL Migration & Atomic Order RPC</span>
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-950" />
                  <span>SQL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Migration</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-emerald-200 leading-relaxed">
            Go to your{' '}
            <a
              href={`https://supabase.com/dashboard/project/${sbConfig.projectId}/sql/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline font-bold inline-flex items-center"
            >
              Supabase SQL Editor <ExternalLink className="w-3 h-3 ml-0.5 inline" />
            </a>
            , paste the query and click <b>Run</b>. It adds atomic order transactions (<code className="font-mono text-[10px] bg-black/30 px-1 py-0.5 rounded">submit_sales_order</code>), central multi-device collision protection, idempotency duplicate prevention, and secure RLS policies without deleting any existing business data.
          </p>
        </div>

        {/* Seed Data Button */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            type="button"
            onClick={handleSeedSupabase}
            disabled={seedLoading}
            className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seedLoading ? 'animate-spin' : ''}`} />
            <span>Sync & Push Products to Supabase</span>
          </button>
        </div>

        {seedNotice && (
          <div className="p-2 bg-emerald-800/90 text-white rounded-lg text-[11px] font-semibold text-center animate-in fade-in">
            {seedNotice}
          </div>
        )}

        {/* Toggle Edit Credentials */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setIsEditingSbConfig(!isEditingSbConfig)}
            className="text-[11px] text-emerald-300 hover:text-white underline"
          >
            {isEditingSbConfig ? 'Hide API credentials' : 'Edit Supabase URL or Key'}
          </button>
        </div>

        {isEditingSbConfig && (
          <form onSubmit={handleSaveSbConfig} className="bg-black/30 p-3 rounded-xl space-y-2 border border-emerald-800 text-xs">
            <div>
              <label className="block text-[10px] text-emerald-200 font-bold uppercase">
                Supabase URL
              </label>
              <input
                type="text"
                required
                value={inputSbUrl}
                onChange={(e) => setInputSbUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black/40 border border-emerald-600 rounded-lg text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-emerald-200 font-bold uppercase">
                Anon / Publishable API Key
              </label>
              <input
                type="text"
                required
                value={inputSbKey}
                onChange={(e) => setInputSbKey(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black/40 border border-emerald-600 rounded-lg text-white font-mono text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs rounded-lg"
            >
              Update Credentials
            </button>
          </form>
        )}
      </div>

      {/* Company & WhatsApp Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
        <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-gray-100">
          <Building className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-base text-gray-900">Company & WhatsApp Settings</h3>
        </div>

        {savedNotice && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveCompanySettings} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Company / Business Name
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Shree Ganesh Wholesale Distributors"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-400 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Destination WhatsApp Number (Orders sent here) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 919876543210 (with country code)"
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-400 font-semibold"
              />
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              Clean format for WhatsApp: <b>+{sanitizeWhatsAppPhone(whatsappNumber) || 'None set'}</b>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Admin Master PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  maxLength={6}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="9999"
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="₹"
                className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-400 text-center"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* Sales Boys Management */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-gray-900">Sales Boys Staff</h3>
          </div>
          <button
            type="button"
            onClick={openAddBoyModal}
            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs rounded-lg flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sales Boy</span>
          </button>
        </div>

        <div className="space-y-2">
          {salesBoys.map((boy) => (
            <div
              key={boy.id}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                boy.active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-gray-900">{boy.name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      boy.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {boy.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  📱 {boy.mobile} • PIN: <span className="font-mono">{boy.pin}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => openEditBoyModal(boy)}
                  className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-md"
                  title="Edit Sales Boy"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove sales boy "${boy.name}"?`)) {
                      onDeleteSalesBoy(boy.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System & Data Tools */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-xs space-y-3">
        <h4 className="font-bold text-gray-700 uppercase tracking-wide">Data & Storage</h4>
        <div className="flex justify-between text-gray-600">
          <span>Active Products: <b>{allProductsCount}</b></span>
          <span>Stored Orders: <b>{allOrdersCount}</b></span>
        </div>
        <div className="pt-2 flex flex-col space-y-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset to official A.R SELLS catalog? All orders will be cleared and official products loaded.')) {
                onResetAllData();
              }
            }}
            className="w-full py-2 px-3 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Official A.R SELLS Catalog & Clean Orders</span>
          </button>
        </div>
      </div>

      {/* Sales Boy Modal */}
      {isBoyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-emerald-800 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm">
                {editingBoy ? 'Edit Sales Boy' : 'Add New Sales Boy'}
              </h4>
              <button
                onClick={() => setIsBoyModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBoy} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={boyName}
                  onChange={(e) => setBoyName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={boyMobile}
                  onChange={(e) => setBoyMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Login PIN *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={boyPin}
                  onChange={(e) => setBoyPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="boy-active"
                  checked={boyActive}
                  onChange={(e) => setBoyActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                />
                <label htmlFor="boy-active" className="text-xs font-bold text-gray-800">
                  Active Account
                </label>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBoyModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
