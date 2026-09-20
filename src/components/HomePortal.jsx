import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { ScanLine, Bug, ShieldCheck, HelpCircle, FileText, Stethoscope } from 'lucide-react';

export default function HomePortal({ onNavigate }) {
  const { t, isMarathi } = useLanguage();

  const services = [
    { key: 'scanner', icon: ScanLine, titleKey: 'serviceDisease', desc: isMarathi ? 'पानाचा फोटो अपलोड करून रोग ओळखा' : 'Upload leaf image for detection' },
    { key: 'pestForecast', icon: Bug, titleKey: 'servicePest', desc: isMarathi ? 'सध्याच्या वातावरणातील किडीचा धोका' : 'Current weather pest risks' },
    { key: 'scanner', icon: Stethoscope, titleKey: 'serviceTreatment', desc: isMarathi ? 'रोगावरील शिफारस केलेले उपाय' : 'Recommended actions for diseases' },
    { key: 'schemes', icon: FileText, titleKey: 'serviceSchemes', desc: isMarathi ? 'शेतकऱ्यांसाठीच्या शासकीय योजना' : 'Govt schemes for farmers' },
    { key: 'officerBooking', icon: ShieldCheck, titleKey: 'serviceOfficer', desc: isMarathi ? 'कृषी अधिकाऱ्यांची क्षेत्र भेट बुक करा' : 'Book field visit from officer' },
    { key: 'overview', icon: HelpCircle, titleKey: 'serviceAdvice', desc: isMarathi ? 'तज्ज्ञांचा सल्ला आणि मार्गदर्शन' : 'Expert advice and guidance' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <section className="bg-white border border-gov-border rounded-md shadow-card overflow-hidden">
        <div className="bg-gov-blue text-white px-6 py-8 md:py-12 flex flex-col items-center text-center">
          <h2 className={`text-2xl md:text-4xl font-bold mb-4 ${isMarathi ? 'font-devanagari' : ''}`}>
            {t('heroTitle')}
          </h2>
          <p className="text-sm md:text-base max-w-2xl opacity-90 mb-8">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => onNavigate('scanner')}
              className="bg-gov-saffron hover:bg-orange-500 text-white font-bold py-3 px-6 rounded shadow-md transition-colors text-lg"
            >
              {t('btnUpload')}
            </button>
            <button 
              className="bg-white/10 hover:bg-white/20 border border-white/50 text-white font-medium py-3 px-6 rounded transition-colors"
            >
              {t('btnAdvisory')}
            </button>
          </div>
        </div>
      </section>

      {/* Quick Services */}
      <section>
        <h3 className={`text-xl font-bold text-gov-navy mb-4 border-l-4 border-gov-saffron pl-3 ${isMarathi ? 'font-devanagari' : ''}`}>
          {t('farmerServices')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-gov-border rounded-md p-5 hover:shadow-header hover:border-gov-blue transition-all cursor-pointer flex gap-4 items-start group"
              onClick={() => onNavigate(service.key)}
            >
              <div className="w-12 h-12 shrink-0 bg-gov-bg rounded flex items-center justify-center text-gov-blue group-hover:bg-gov-blue group-hover:text-white transition-colors">
                <service.icon size={24} />
              </div>
              <div>
                <h4 className={`font-semibold text-gov-navy text-base mb-1 ${isMarathi ? 'font-devanagari' : ''}`}>
                  {t(service.titleKey)}
                </h4>
                <p className="text-xs text-gov-textSec mb-2">{service.desc}</p>
                <span className="text-xs font-medium text-gov-blue group-hover:text-gov-saffron transition-colors">
                  {t('moreInfo')} &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notices */}
      <section>
        <h3 className={`text-xl font-bold text-gov-navy mb-4 border-l-4 border-gov-saffron pl-3 ${isMarathi ? 'font-devanagari' : ''}`}>
          {t('importantNotices')}
        </h3>
        <div className="bg-white border border-gov-border rounded-md shadow-card divide-y divide-gov-border">
          {[
            { tag: 'NEW', type: 'info', text: isMarathi ? 'खरीप हंगामासाठी सुधारित बियाणे वाटप' : 'Revised seed distribution for Kharif season', date: '12 Sep 2026' },
            { tag: 'NOTICE', type: 'warning', text: isMarathi ? 'नाशिक जिल्ह्यात भुरी रोगाचा प्रादुर्भाव वाढण्याची शक्यता' : 'High chance of Powdery Mildew outbreak in Nashik district', date: '10 Sep 2026' },
            { tag: 'UPDATE', type: 'success', text: isMarathi ? 'नवीन कृषी योजनांसाठी अर्ज सुरू' : 'Applications open for new agricultural schemes', date: '05 Sep 2026' },
          ].map((notice, idx) => (
            <div key={idx} className="p-4 flex gap-4 items-center hover:bg-gov-bg transition-colors">
              <span className={`text-[10px] font-bold px-2 py-1 rounded text-white ${
                notice.type === 'warning' ? 'bg-orange-600' : notice.type === 'success' ? 'bg-green-700' : 'bg-gov-blue'
              }`}>
                {notice.tag}
              </span>
              <p className="text-sm font-medium flex-1">{notice.text}</p>
              <span className="text-xs text-gov-textSec whitespace-nowrap">{notice.date}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
