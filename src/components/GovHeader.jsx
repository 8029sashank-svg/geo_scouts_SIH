import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { Languages, Phone, User, Search, Menu } from 'lucide-react';

export default function GovHeader({ onMenuClick, activePanel, navItems, setActivePanel }) {
  const { t, language, toggleLanguage, isMarathi } = useLanguage();

  return (
    <header className="w-full bg-white border-b border-gov-border shadow-sm flex flex-col z-30 sticky top-0">
      {/* Top Utility Bar */}
      <div className="bg-gov-navy text-white text-xs lg:text-sm py-1.5 px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="font-semibold tracking-wide">
            {t('govTitleGovOfMah')}
          </span>
          <span className="hidden md:inline-block opacity-75">|</span>
          <span className="hidden md:inline-block">कृषी विभाग</span>
        </div>
        
        <div className="flex items-center gap-3 lg:gap-5">
          {/* Accessibility controls (visual mock) */}
          <div className="hidden lg:flex items-center gap-2 border-r border-white/20 pr-4">
            <span className="cursor-pointer hover:text-gov-saffron">A-</span>
            <span className="cursor-pointer hover:text-gov-saffron font-bold">A</span>
            <span className="cursor-pointer hover:text-gov-saffron text-base">A+</span>
            <button className="ml-2 bg-black text-white px-2 py-0.5 rounded border border-white/50 text-[10px] hover:bg-yellow-400 hover:text-black transition-colors">
              High Contrast
            </button>
          </div>
          
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 hover:text-gov-saffron transition-colors font-medium"
          >
            <Languages size={14} />
            <span>{language === 'en' ? 'मराठी' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Main Header area */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 bg-white">
        <div className="flex items-center gap-4">
          {/* Government Emblem Placeholder */}
          <div className="w-12 h-16 lg:w-16 lg:h-20 flex flex-col items-center justify-center border-2 border-gov-navy rounded-t-full bg-gov-bg p-1 text-[8px] text-center font-bold text-gov-navy uppercase leading-tight shrink-0">
            Govt<br/>of<br/>Maha
          </div>
          
          <div>
            <h1 className={`text-lg lg:text-2xl font-bold text-gov-navy leading-tight ${isMarathi ? 'font-devanagari' : ''}`}>
              DEPARTMENT OF AGRICULTURE
            </h1>
            <h2 className="text-sm lg:text-base text-gov-textSec font-medium mt-1">
              (Government of Maharashtra)
            </h2>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {/* Circular seals mock */}
          <div className="w-10 h-10 rounded-full border-2 border-yellow-500 bg-yellow-400 opacity-80 flex items-center justify-center text-[8px] font-bold text-white text-center">Seal</div>
          <div className="w-10 h-10 rounded-full border-2 border-green-600 bg-white opacity-80 flex items-center justify-center text-[8px] font-bold text-green-700 text-center">Logo</div>
          <div className="w-10 h-10 rounded-full border-2 border-green-600 bg-green-50 opacity-80 flex items-center justify-center text-[8px] font-bold text-green-700 text-center">Logo</div>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder={isMarathi ? 'शोधा...' : 'Search...'} 
              className="border border-gov-border rounded-full pl-4 pr-10 py-1.5 text-sm w-48 focus:outline-none focus:border-gov-blue"
            />
            <Search size={16} className="absolute right-3 top-2 text-gov-textSec" />
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden text-gov-navy p-2 bg-gov-bg rounded-md"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Title Bar - Mahapocra Style */}
      <div className="w-full bg-mahapocra-green py-2 px-4 lg:px-8 text-white font-medium text-lg">
        {t('govTitleApp')}
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex bg-white text-gov-text w-full overflow-x-auto border-b border-gov-border">
        <div className="flex items-center px-4 lg:px-8 h-12">
          {navItems.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
              className={`px-4 h-full py-2 font-medium transition-colors border-b-4 whitespace-nowrap ${
                activePanel === key
                  ? 'border-mahapocra-green text-mahapocra-green font-bold bg-mahapocra-bg/30'
                  : 'border-transparent hover:bg-mahapocra-bg/50 hover:text-mahapocra-green'
              } ${isMarathi ? 'font-devanagari text-base' : 'text-sm'}`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
