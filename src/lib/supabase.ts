import { createClient } from '@supabase/supabase-js';

// Default project configuration provided by user
export const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://tzrsuftxpynkbjzkzplk.supabase.co',
  anonKey: 'sb_publishable_mGD1ugK4q9qqLuV8LSwtkw_WEdZsWSg',
  projectId: 'tzrsuftxpynkbjzkzplk',
};

const STORAGE_KEY = 'quickorder_supabase_config_v1';

export function getSupabaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved Supabase config:', e);
  }
  return DEFAULT_SUPABASE_CONFIG;
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  const config = {
    url: url.trim(),
    anonKey: anonKey.trim(),
    projectId: url.replace('https://', '').split('.')[0] || '',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  return config;
}

const currentConfig = getSupabaseConfig();

export const supabase = createClient(currentConfig.url, currentConfig.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
