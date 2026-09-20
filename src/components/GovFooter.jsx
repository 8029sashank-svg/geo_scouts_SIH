import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function GovFooter() {
  const { t, isMarathi } = useLanguage();

  return (
    <footer className="w-full bg-gov-navy text-white mt-12 border-t-4 border-gov-saffron">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand/Identity */}
          <div className="space-y-4">
            <h3 className={`text-xl font-bold ${isMarathi ? 'font-devanagari' : ''}`}>
              {t('govTitleGovOfMah')}
            </h3>
            <p className="text-gov-border text-sm leading-relaxed">
              {t('govTitleApp')}
            </p>
            <p className="text-gov-border text-xs leading-relaxed mt-4">
              {t('footerDevelopedFor')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-gov-saffron">
              {isMarathi ? 'महत्त्वाचे दुवे' : 'Important Links'}
            </h4>
            <ul className="space-y-2 text-sm text-gov-border">
              <li><a href="#" className="hover:text-white transition-colors">{t('navHome')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('navServices')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('navSchemes')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('navDiseaseDetect')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('navContact')}</a></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-gov-saffron">
              {isMarathi ? 'धोरणे' : 'Policies'}
            </h4>
            <ul className="space-y-2 text-sm text-gov-border">
              <li><a href="#" className="hover:text-white transition-colors">{t('privacyPolicy')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('termsConditions')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Copyright Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hyperlinking Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/60">
          <p>
            &copy; {new Date().getFullYear()} {t('govTitleGovOfMah')}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span>Last Updated: 12 Sep 2026</span>
            <span>Visitors: 104,291</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
