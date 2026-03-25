import React from 'react';
import { motion } from 'motion/react';
import { Palette, Sun, Moon, Monitor, Type, Eye, ArrowLeft, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

interface AppearanceSettingsProps {
  onBack: () => void;
}

export function AppearanceSettings({ onBack }: AppearanceSettingsProps) {
  const { t, theme, contrastMode, zoomLevel, colorBlindFilter, toggleTheme, setContrastMode, zoomIn, zoomOut, resetZoom, setColorBlindFilter } = useAccessibilityStore();

  const themes = [
    { id: 'light', label: t('settings.appearance.light'), icon: <Sun className="w-5 h-5" />, active: theme === 'light' },
    { id: 'dark', label: t('settings.appearance.dark'), icon: <Moon className="w-5 h-5" />, active: theme === 'dark' },
    { id: 'system', label: t('settings.appearance.system'), icon: <Monitor className="w-5 h-5" />, active: false },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Back Button (Mobile) */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex lg:hidden items-center gap-2 text-[#6B7280] hover:text-[#111827] transition-all w-fit"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{t('common.back') || 'Retour'}</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827]">{t('settings.tabs.appearance')}</h2>
            <p className="text-xs text-[#6B7280]">{t('settings.appearance.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-10"
      >
        {/* Theme Selection */}
        <div>
          <h3 className="text-sm font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#0EA5E9]" />
            {t('settings.appearance.theme')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={th.id === 'system' ? undefined : toggleTheme}
                className={`flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all group ${
                  th.active
                    ? 'border-[#0EA5E9] bg-sky-50/30 ring-4 ring-sky-500/5'
                    : 'border-gray-50 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  th.active ? 'bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20' : 'bg-white text-gray-400 group-hover:text-gray-600'
                }`}>
                  {th.icon}
                </div>
                <div className="flex items-center gap-2">
                   <span className={`text-xs font-bold uppercase tracking-widest ${th.active ? 'text-sky-700' : 'text-gray-500'}`}>
                     {th.label}
                   </span>
                   {th.active && <Check className="w-3.5 h-3.5 text-sky-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Font Size Selector (Mapped to Zoom Level) */}
        <div>
          <h3 className="text-sm font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Type className="w-4 h-4 text-[#0EA5E9]" />
            {t('settings.appearance.zoom')}
          </h3>
          <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Minimal ({zoomLevel}%)</span>
              <div className="flex items-center gap-3">
                  <button 
                  onClick={zoomOut}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-[#0EA5E9] hover:border-[#0EA5E9] transition-all shadow-sm"
                 >
                    <ZoomOut className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={resetZoom}
                   className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#0EA5E9] hover:border-[#0EA5E9] transition-all shadow-sm"
                 >
                    {t('accessibilityPanel.resetZoom')}
                 </button>
                 <button 
                  onClick={zoomIn}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-[#0EA5E9] hover:border-[#0EA5E9] transition-all shadow-sm"
                 >
                    <ZoomIn className="w-4 h-4" />
                 </button>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maximal</span>
            </div>
            
            <div className="relative h-2 bg-gray-200 rounded-full">
               <motion.div 
                 className="absolute top-0 bottom-0 left-0 bg-[#0EA5E9] rounded-full"
                 animate={{ width: `${((zoomLevel - 75) / (150 - 75)) * 100}%` }}
               />
            </div>
            <p className="text-[10px] font-medium text-gray-500 mt-4 leading-relaxed">
               {t('accessibilityPanel.announcements.zoomSet', { level: zoomLevel })}
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Extra Accessibility */}
        <div>
          <h3 className="text-sm font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#0EA5E9]" />
            {t('accessibilityPanel.vision')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <button 
                onClick={() => setContrastMode(contrastMode === 'high' ? 'off' : 'high')}
                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${contrastMode === 'high' ? 'border-[#0EA5E9] bg-sky-50/30' : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-200'}`}
             >
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg ${contrastMode === 'high' ? 'bg-[#0EA5E9] text-white' : 'bg-white text-gray-400'}`}>
                      <Eye size={18} />
                   </div>
                   <div className="text-left">
                      <p className="text-sm font-bold text-[#111827]">{t('settings.appearance.contrast')}</p>
                      <p className="text-[10px] font-medium text-gray-500">{t('settings.appearance.contrastDesc')}</p>
                   </div>
                </div>
                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${contrastMode === 'high' ? 'bg-[#0EA5E9]' : 'bg-gray-300'}`}>
                   <div className={`w-3 h-3 rounded-full bg-white transition-transform ${contrastMode === 'high' ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
             </button>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Color Blind Filters */}
        <div>
          <h3 className="text-sm font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#0EA5E9]" />
            {t('settings.appearance.colorBlind')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
             {[
               { id: 'none', label: t('accessibilityPanel.colorBlindFilters.none') },
               { id: 'protanopia', label: t('accessibilityPanel.colorBlindFilters.protanopia') },
               { id: 'deuteranopia', label: t('accessibilityPanel.colorBlindFilters.deuteranopia') },
               { id: 'tritanopia', label: t('accessibilityPanel.colorBlindFilters.tritanopia') },
               { id: 'achromatopsia', label: t('accessibilityPanel.colorBlindFilters.achromatopsia') }
             ].map((filter) => (
               <button
                  key={filter.id}
                  onClick={() => setColorBlindFilter(filter.id as any)}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all font-bold text-[10px] uppercase tracking-wider ${
                    colorBlindFilter === filter.id 
                      ? 'border-[#0EA5E9] bg-sky-50 text-sky-700' 
                      : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200 hover:bg-white'
                  }`}
               >
                  {filter.label}
               </button>
             ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
