import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ShieldCheck, Briefcase, Landmark, User, 
  Mic, MicOff, CheckCircle2, AlertCircle, ChevronRight, 
  ChevronLeft, Plus, Trash2, Save, Download, FileSpreadsheet,
  Archive, FileCheck, Globe
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import LanguageToggle from './LanguageToggle';
import SavingsCalculator from './SavingsCalculator';
import LeadMagnetPopup from './LeadMagnetPopup';
import './App.css';

const TABS = [
  { id: 'business', label: t.nav.business || 'Business & Legal', icon: FileText },
  { id: 'license', label: t.nav.license || 'Licenses & Compliance', icon: ShieldCheck },
  { id: 'practice', label: t.nav.practice || 'Practice Details', icon: Briefcase },
  { id: 'banking', label: t.nav.banking || 'Banking', icon: Landmark },
  { id: 'providers', label: t.nav.providers || 'Providers', icon: User },
  { id: 'finish', label: t.nav.finish || 'Review & Finish', icon: Archive },
];

function App() {
  const [activeTab, setActiveTab] = useState('business');
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('mbmb_form_data');
    return saved ? JSON.parse(saved) : {
      business: {},
      license: {},
      practice: {},
      banking: {},
      providers: [{ id: Date.now() }],
    };
  });

  useEffect(() => {
    localStorage.setItem('mbmb_form_data', JSON.stringify(formData));
  }, [formData]);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastFocusedInput, setLastFocusedInput] = useState(null);

  // Web Speech API initialization
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript.toLowerCase();
        setTranscript(resultTranscript);
        
        if (event.results[current].isFinal) {
          // Attempt keyword matching if not focused, or just fill focused
          if (lastFocusedInput) {
            fillField(lastFocusedInput, resultTranscript.trim());
          } else {
            // Basic keyword auto-filling
            if (resultTranscript.includes('ein is')) {
              const val = resultTranscript.split('ein is')[1].trim();
              fillField('business.ein', val);
            } else if (resultTranscript.includes('company name is')) {
              const val = resultTranscript.split('company name is')[1].trim();
              fillField('business.legalName', val);
            } else if (resultTranscript.includes('address is')) {
              const val = resultTranscript.split('address is')[1].trim();
              fillField('practice.address', val);
            }
          }
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [lastFocusedInput]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const fillField = (fieldName, value) => {
    const [section, idOrField, field] = fieldName.split('.');
    
    setFormData(prev => {
      const newData = { ...prev };
      if (section === 'providers') {
        const index = newData.providers.findIndex(p => p.id === parseInt(idOrField));
        if (index !== -1) {
          newData.providers[index] = { ...newData.providers[index], [field]: value };
        }
      } else {
        newData[section] = { ...newData[section], [idOrField]: value };
      }
      return newData;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    fillField(name, value);
  };

  const handleFocus = (e) => {
    setLastFocusedInput(e.target.name);
  };

  const addProvider = () => {
    setFormData(prev => ({
      ...prev,
      providers: [...prev.providers, { id: Date.now() }]
    }));
  };

  const removeProvider = (id) => {
    if (formData.providers.length > 1) {
      setFormData(prev => ({
        ...prev,
        providers: prev.providers.filter(p => p.id !== id)
      }));
    }
  };

  const [fileObjects, setFileObjects] = useState({});
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFileObjects(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const handleExportPackage = async () => {
    const zip = new JSZip();
    const clientName = formData.business.legalName || 'Client';
    const safeName = clientName.replace(/[^a-z0-9]/gi, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    // 1. Create Excel Workbook
    const businessData = { ...formData.business };
    const licenseData = { ...formData.license };
    const practiceData = { ...formData.practice };
    const bankingData = { ...formData.banking };
    
    const generalInfo = { ...businessData, ...licenseData, ...practiceData, ...bankingData };
    const wsGeneral = XLSX.utils.json_to_sheet([generalInfo]);
    
    const providersData = formData.providers.map((p, idx) => ({
      Provider_Number: idx + 1,
      ...p
    }));
    const wsProviders = XLSX.utils.json_to_sheet(providersData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Practice Info");
    XLSX.utils.book_append_sheet(wb, wsProviders, "Providers");

    // 2. Generate Excel ArrayBuffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file(`MBMB_Onboarding_Data_${safeName}.xlsx`, excelBuffer);

    // 3. Add Uploaded Documents
    const docsFolder = zip.folder("documents");
    Object.keys(fileObjects).forEach(key => {
      const file = fileObjects[key];
      // Rename files based on their field for easier organization
      const extension = file.name.split('.').pop();
      const cleanKey = key.replace(/\./g, '_');
      docsFolder.file(`${cleanKey}_${file.name}`, file);
    });

    // 4. Generate and Download Zip
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MBMB_Onboarding_Package_${safeName}_${dateStr}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("Final Package Ready! Please email this ZIP file to jasmel@medicalbillingmb.com or jasmelacosta@gmail.com. For support, call 786-643-2099.");
  };


  const downloadChecklist = () => {
    const checklist = t.leadMagnet.title + `
---------------------------------------------------------
Please prepare the following documents to complete your enrollment:

PRACTICE DOCUMENTS:
[ ] City & County Business Tax Receipts
[ ] Certificate of Use Verification
[ ] AHCA License or Exemption
[ ] OSHA + HIPAA Compliance Logs
[ ] Biomedical Waste Permit
[ ] PECOS & Medicare Enrollment Confirmation
[ ] EIN Internal Revenue Letter (SS-4)
[ ] Voided Check (for EFT setup)

PROVIDER DOCUMENTS (Required for EACH clinician):
[ ] NPI Number
[ ] State Medical License
[ ] DEA Registration
[ ] Board Certification
[ ] Updated CV
[ ] CAQH Login Credentials
[ ] Malpractice Policy (Face Sheet)

Generated by MBMB Onboarding Portal
Support: jasmel@medicalbillingmb.com | 786-643-2099
    `;
    const element = document.createElement("a");
    const file = new Blob([checklist], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = t.leadMagnet.title.replace(/[^a-z0-9]/gi, '_') + ".txt";
    document.body.appendChild(element);
    element.click();
  };

const renderBusiness = () => (
  <div className="section-form">
    <h3>{t.forms.businessLegal}</h3>
    <div className="form-grid">
      <div className="form-group">
        <label>{t.forms.cityTaxReceipts}</label>
        <input 
          name="business.taxReceipts" 
          value={formData.business.taxReceipts || ''} 
          onChange={handleChange} 
          onFocus={handleFocus}
          placeholder={t.placeholders.documentNumber}
        />
      </div>
      <div className="form-group">
        <label>{t.forms.certUseVerif}</label>
        <input 
          name="business.certUse" 
          value={formData.business.certUse || ''} 
          onChange={handleChange} 
          onFocus={handleFocus}
          placeholder={t.placeholders.verificationId}
        />
      </div>
      <div className="form-group">
        <label>{t.forms.practiceEin}</label>
        <input 
          name="business.ein" 
          value={formData.business.ein || ''} 
          onChange={handleChange} 
          onFocus={handleFocus}
          placeholder={t.placeholders.taxIdFormat}
        />
      </div>
      <div className="form-group">
        <label>{t.forms.legalBusinessName}</label>
        <input 
          name="business.legalName" 
          value={formData.business.legalName || ''} 
          onChange={handleChange} 
          onFocus={handleFocus}
        />
      </div>
      <div className="form-group">
        <label>{t.forms.taxIdDocument}</label>
        <div className="file-input-wrapper">
          <input type="file" onChange={(e) => handleFileUpload(e, 'business.taxIdDoc')} className="file-input" />
          <div className="file-status">
            {fileObjects['business.taxIdDoc'] ? (
              <span className="success"><FileCheck size={14} /> {fileObjects['business.taxIdDoc'].name}</span>
            ) : t.nav.docChecklist || 'No file chosen'}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const renderLicense = () => (
  <div className="section-form">
    <h3>{t.forms.licensesCompliance}</h3>
    <div className="form-grid">
      <div className="form-group">
        <label>{t.forms.ahcaLicense}</label>
        <input name="license.ahca" value={formData.license.ahca || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.oshaCompliance}</label>
        <select name="license.osha" value={formData.license.osha || ''} onChange={handleChange}>
          <option value="">{t.placeholders.selectStatus}</option>
          <option value="complete">Complete</option>
          <option value="in_progress">In Progress</option>
          <option value="not_started">Not Started</option>
        </select>
      </div>
      <div className="form-group">
        <label>{t.forms.hipaaAudit}</label>
        <select name="license.hipaa" value={formData.license.hipaa || ''} onChange={handleChange}>
          <option value="">{t.placeholders.selectStatus}</option>
          <option value="complete">Verified</option>
          <option value="pending">Pending Audit</option>
        </select>
      </div>
      <div className="form-group">
        <label>{t.forms.biomedicalWaste}</label>
        <input name="license.wastePermit" value={formData.license.wastePermit || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.pecosEnrollment}</label>
        <input name="license.pecos" value={formData.license.pecos || ''} onChange={handleChange} onFocus={handleFocus} placeholder={t.placeholders.npiId} />
      </div>
      <div className="form-group">
        <label>{t.forms.medicareEnrollment}</label>
        <input name="license.medicare" value={formData.license.medicare || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.insuranceCred}</label>
        <input name="license.credentialing" value={formData.license.credentialing || ''} onChange={handleChange} onFocus={handleFocus} placeholder={t.placeholders.commercialPlans} />
      </div>
      <div className="form-group">
        <label>{t.forms.cliaCert}</label>
        <input name="license.clia" value={formData.license.clia || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
    </div>
  </div>
);

const renderPractice = () => (
  <div className="section-form">
    <h3>{t.forms.practiceAddress}</h3>
    <div className="form-grid full-width">
      <div className="form-group">
        <label>{t.forms.practiceAddress}</label>
        <textarea name="practice.address" value={formData.practice.address || ''} onChange={handleChange} onFocus={handleFocus} rows="2" />
      </div>
    </div>
    <div className="form-grid">
      <div className="form-group">
        <label>{t.forms.phoneNumber}</label>
        <input name="practice.phone" value={formData.practice.phone || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.faxNumber}</label>
        <input name="practice.fax" value={formData.practice.fax || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.ownershipDetails}</label>
        <input name="practice.ownership" value={formData.practice.ownership || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.groupNPI}</label>
        <input name="practice.groupNpi" value={formData.practice.groupNpi || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.practiceLicense}</label>
        <input name="practice.license" value={formData.practice.license || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.malpracticeLiability}</label>
        <input name="practice.malpractice" value={formData.practice.malpractice || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
    </div>
  </div>
);

const renderBanking = () => (
  <div className="section-form">
    <h3>{t.forms.bankingInfo}</h3>
    <div className="form-grid">
      <div className="form-group">
        <label>{t.forms.accountNumber}</label>
        <input name="banking.account" value={formData.banking.account || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.routingNumber}</label>
        <input name="banking.routing" value={formData.banking.routing || ''} onChange={handleChange} onFocus={handleFocus} />
      </div>
      <div className="form-group">
        <label>{t.forms.accountType}</label>
        <select name="banking.type" value={formData.banking.type || ''} onChange={handleChange}>
          <option value="">{t.placeholders.selectAccountType}</option>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </div>
    </div>
  </div>
);

const renderProviders = () => (
  <div className="section-form">
    <div className="section-header">
      <h3>{t.forms.providerDocs}</h3>
      <button className="btn-add" onClick={addProvider}>
        <Plus size={18} /> {t.buttons.addProvider}
      </button>
    </div>
    
    {formData.providers.map((provider, index) => (
      <div key={provider.id} className="provider-card">
        <div className="provider-header">
          <h4>{t.forms.providerNumber} #{index + 1}</h4>
          {formData.providers.length > 1 && (
            <button className="btn-icon danger" onClick={() => removeProvider(provider.id)}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>{t.forms.providerNPI}</label>
            <input name={`providers.${provider.id}.npi`} value={provider.npi || ''} onChange={handleChange} onFocus={handleFocus} />
          </div>
          <div className="form-group">
            <label>{t.forms.taxIdSsn}</label>
            <input name={`providers.${provider.id}.taxid`} value={provider.taxid || ''} onChange={handleChange} onFocus={handleFocus} />
          </div>
          <div className="form-group">
            <label>{t.forms.cvResume}</label>
            <div className="file-input-wrapper">
              <input type="file" onChange={(e) => handleFileUpload(e, `providers.${provider.id}.cv`)} className="file-input" />
              <div className="file-status">
                {fileObjects[`providers.${provider.id}.cv`] ? (
                  <span className="success"><FileCheck size={14} /> {fileObjects[`providers.${provider.id}.cv`].name}</span>
                ) : t.nav.docChecklist || 'No file chosen'}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>{t.forms.educationDetails}</label>
            <input name={`providers.${provider.id}.education`} value={provider.education || ''} onChange={handleChange} onFocus={handleFocus} />
          </div>
          <div className="form-group">
            <label>{t.forms.stateLicense}</label>
            <input name={`providers.${provider.id}.license`} value={provider.license || ''} onChange={handleChange} onFocus={handleFocus} />
          </div>
          <div className="form-group">
            <label>{t.forms.deaRegistration}</label>
            <input name={`providers.${provider.id}.dea`} value={provider.dea || ''} onChange={handleChange} onFocus={handleFocus} />
          </div>
          <div className="form-group">
            <label>{t.forms.boardCertification}</label>
            <input name={`providers.${provider.id}.board`} value={provider.board || ''} onChange={handleChange} onFocus={handleFocus} />
          </div>
          <div className="form-group">
            <label>{t.forms.malpracticeInsurance}</label>
            <input name={`providers.${provider.id}.malpractice`} value={provider.malpractice || ''} onChange={handleChange} onFocus={handleFocus} />
          </div>
          <div className="form-group">
            <label>{t.forms.caqhLogin}</label>
            <input name={`providers.${provider.id}.caqh`} value={provider.caqh || ''} onChange={handleChange} onFocus={handleFocus} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const renderFinish = () => (
  <div className="section-form finish-page">
    <div className="finish-card">
      <div className="finish-icon-large">
        <Archive size={48} color="var(--accent)" />
      </div>
      <h3>{t.forms.submitPackage}</h3>
      <p className="finish-desc">
        Ready to wrap up? We've bundled your form data and all your uploaded documents into a single secure **.ZIP** file. 
      </p>
      
      <div className="review-stats">
        <div className="stat-item">
          <span className="label">Documents Attached:</span>
          <span className="value">{Object.keys(fileObjects).length} Files</span>
        </div>
        <div className="stat-item">
          <span className="label">Providers Listed:</span>
          <span className="value">{formData.providers.length} Clinicians</span>
        </div>
      </div>

      <button className="btn-primary btn-large" onClick={handleExportPackage} style={{ margin: '32px auto', width: 'auto', padding: '16px 40px', fontSize: '1.1rem' }}>
        <Download size={24} /> {t.buttons.exportPackage}
      </button>
      
      {/* Live Savings Calculator */}
      <div className="savings-calculator-section">
        <h3>{t.savingsCalculator.title}</h3>
        <SavingsCalculator t={t} />
      </div>
      
      <div className="next-steps-card">
        <h4>{t.messages.instructions}</h4>
        <ul>
          <li>{t.messages.instructionsList[0]}</li>
          <li>{t.messages.instructionsList[1]}</li>
          <li>{t.messages.instructionsList[2]}</li>
          <li>{t.messages.instructionsList[3]}</li>
        </ul>
      </div>
    </div>
  </div>
);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar glass-morphism">
        <div className="logo">
          <div className="logo-icon">MBMB</div>
          <div className="logo-text">
            <span className="name">MBMB</span>
            <span className="sub">Miami Beach</span>
          </div>
        </div>
        <div className="nav-items">
          {TABS.map(tab => (
            <button 
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="active-indicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        
        <div className="voice-status">
          <div className={`status-dot ${isListening ? 'listening' : ''}`} />
          <span>{isListening ? t.voiceAssistant.listening : t.voiceAssistant.off}</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="breadcrumb">
            <span>Onboarding</span>
            <ChevronRight size={14} />
            <span className="current">{TABS.find(t => t.id === activeTab).label}</span>
          </div>
          
        <div className="actions">
          <button className="btn-secondary" onClick={downloadChecklist}>
            <Download size={18} /> {t.nav.docChecklist || 'Doc Checklist'}
          </button>
          <button className="btn-primary" onClick={handleExportPackage}>
            <Archive size={18} /> {t.nav.exportPackage || 'Export Package'}
          </button>
          <LanguageToggle />
        </div>
        </header>

        <div className="content-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'business' && renderBusiness()}
              {activeTab === 'license' && renderLicense()}
              {activeTab === 'practice' && renderPractice()}
              {activeTab === 'banking' && renderBanking()}
              {activeTab === 'providers' && renderProviders()}
              {activeTab === 'finish' && renderFinish()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Voice Control Overlay */}
        <div className="voice-control">
          <button 
            className={`btn-voice ${isListening ? 'active' : ''}`}
            onClick={toggleListening}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          {isListening && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="transcript-popover glass-morphism"
            >
          <p className="pulse">{t.voiceAssistant.listeningText}</p>
          <p className="current-text">{transcript || t.voiceAssistant.transcriptPlaceholder}</p>
            </motion.div>
          )}
        </div>
      </main>
      <LeadMagnetPopup t={t} />
    </div>
  );
}

export default App;
