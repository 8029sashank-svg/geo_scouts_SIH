import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { CheckCircle } from 'lucide-react';

export default function OfficerBooking() {
  const { t, isMarathi } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-gov-border rounded shadow-card p-8 text-center">
        <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gov-navy mb-2">
          {isMarathi ? 'विनंती यशस्वीरीत्या पाठवली!' : 'Request Sent Successfully!'}
        </h2>
        <p className="text-gov-textSec mb-6">
          {isMarathi 
            ? 'तुमची क्षेत्र भेटीची विनंती नोंदवली गेली आहे. कृषी अधिकारी लवकरच तुमच्याशी संपर्क साधतील.' 
            : 'Your field visit request has been recorded. An agriculture officer will contact you soon.'}
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="bg-gov-blue hover:bg-gov-navy text-white px-6 py-2 rounded transition-colors"
        >
          {isMarathi ? 'नवीन विनंती करा' : 'Make New Request'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gov-border rounded shadow-card overflow-hidden">
        <div className="bg-gov-bg border-b border-gov-border px-6 py-4">
          <h2 className={`text-xl font-bold text-gov-navy ${isMarathi ? 'font-devanagari' : ''}`}>
            {t('officerBookingTitle')}
          </h2>
          <p className="text-sm text-gov-textSec mt-1">
            {isMarathi 
              ? 'गंभीर रोग किंवा कीड प्रादुर्भावाच्या तपासणीसाठी कृषी अधिकाऱ्यांच्या भेटीची विनंती करा.' 
              : 'Request a visit from an agriculture officer for severe disease or pest outbreak inspection.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gov-text">{t('farmerName')}</label>
              <input required type="text" className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gov-text">{t('mobileNumber')}</label>
              <input required type="tel" className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gov-text">{t('district')}</label>
              <select required className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue">
                <option value="">{isMarathi ? 'निवडा' : 'Select'}</option>
                <option value="nashik">Nashik</option>
                <option value="ahmednagar">Ahmednagar</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gov-text">{t('taluka')}</label>
              <input required type="text" className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gov-text">{t('village')}</label>
              <input required type="text" className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gov-text">{t('cropName')}</label>
            <input required type="text" className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gov-text">{t('problemNature')}</label>
            <textarea required rows="3" className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gov-text">{t('prefDate')}</label>
              <input required type="date" className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gov-text">{t('prefTime')}</label>
              <select required className="w-full border border-gov-border rounded px-3 py-2 focus:outline-none focus:border-gov-blue">
                <option value="">{isMarathi ? 'निवडा' : 'Select'}</option>
                <option value="morning">{isMarathi ? 'सकाळ (८ ते १२)' : 'Morning (8 to 12)'}</option>
                <option value="afternoon">{isMarathi ? 'दुपार (१२ ते ४)' : 'Afternoon (12 to 4)'}</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gov-border mt-6">
            <button 
              type="submit"
              className="w-full bg-gov-saffron hover:bg-orange-500 text-white font-bold py-3 px-6 rounded shadow-sm transition-colors text-lg"
            >
              {t('sendRequest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
