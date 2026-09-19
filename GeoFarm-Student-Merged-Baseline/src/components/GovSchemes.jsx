import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { ChevronRight } from 'lucide-react';

export default function GovSchemes() {
  const { t, isMarathi } = useLanguage();

  const schemes = [
    {
      title: isMarathi ? 'प्रधानमंत्री पीक विमा योजना (PMFBY)' : 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      eligibility: isMarathi ? 'सर्व शेतकरी' : 'All farmers',
      benefits: isMarathi ? 'नैसर्गिक आपत्तींमुळे झालेल्या पिकाच्या नुकसानीसाठी आर्थिक मदत.' : 'Financial support for crop loss due to natural calamities.',
      docs: isMarathi ? '७/१२ उतारा, आधार कार्ड, बँक पासबुक' : '7/12 Extract, Aadhaar Card, Bank Passbook'
    },
    {
      title: isMarathi ? 'मागेल त्याला शेततळे' : 'Magel Tyala Shettale',
      eligibility: isMarathi ? 'किमान ०.६० हेक्टर जमीन असणारे शेतकरी' : 'Farmers with at least 0.60 hectare land',
      benefits: isMarathi ? 'शेततळे खोदण्यासाठी ५०,००० रुपयांपर्यंत अनुदान.' : 'Subsidy up to ₹50,000 for farm pond excavation.',
      docs: isMarathi ? '७/१२ उतारा, ८ अ, आधार कार्ड' : '7/12 Extract, 8A, Aadhaar Card'
    },
    {
      title: isMarathi ? 'भाऊसाहेब फुंडकर फळबाग लागवड योजना' : 'Bhausaheb Fundkar Phalbag Lagvad Yojana',
      eligibility: isMarathi ? 'अल्प व अत्यल्प भूधारक शेतकरी' : 'Small and marginal farmers',
      benefits: isMarathi ? 'फळबाग लागवडीसाठी १००% अनुदान (३ वर्षांत विभागून).' : '100% subsidy for fruit tree plantation (split over 3 years).',
      docs: isMarathi ? '७/१२, ८ अ, जात प्रमाणपत्र (लागू असल्यास)' : '7/12, 8A, Caste Certificate (if applicable)'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className={`text-2xl font-bold text-gov-navy border-b-2 border-gov-saffron pb-2 ${isMarathi ? 'font-devanagari' : ''}`}>
        {t('govSchemesTitle')}
      </h2>

      <div className="grid gap-6">
        {schemes.map((scheme, idx) => (
          <div key={idx} className="bg-white border border-gov-border rounded shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="bg-gov-bg border-b md:border-b-0 md:border-r border-gov-border p-4 md:w-1/3 shrink-0">
              <h3 className="font-bold text-gov-navy text-lg leading-snug">{scheme.title}</h3>
            </div>
            <div className="p-4 flex-1 space-y-3 text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-semibold text-gov-textSec">{isMarathi ? 'पात्रता:' : 'Eligibility:'}</span>
                <span className="text-gov-text">{scheme.eligibility}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-semibold text-gov-textSec">{isMarathi ? 'फायदे:' : 'Benefits:'}</span>
                <span className="text-gov-text">{scheme.benefits}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-semibold text-gov-textSec">{isMarathi ? 'कागदपत्रे:' : 'Documents:'}</span>
                <span className="text-gov-text">{scheme.docs}</span>
              </div>
              
              <div className="pt-3 border-t border-gov-border mt-3">
                <button className="text-gov-blue font-semibold hover:text-gov-saffron flex items-center gap-1 transition-colors">
                  {t('moreInfo')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
