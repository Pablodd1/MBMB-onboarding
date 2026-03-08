import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ShieldCheck, Briefcase, Landmark, User, 
  Mic, MicOff, CheckCircle2, AlertCircle, ChevronRight, 
  ChevronLeft, Plus, Trash2, Save, Download, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './App.css';

const TABS = [
  { id: 'business', label: 'Business & Legal', icon: FileText },
  { id: 'license', label: 'Licenses & Compliance', icon: ShieldCheck },
  { id: 'practice', label: 'Practice Details', icon: Briefcase },
  { id: 'banking', label: 'Banking', icon: Landmark },
  { id: 'providers', label: 'Providers', icon: User },
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

  const handleExportExcel = () => {
    // Flatten the data for Excel
    const businessData = { ...formData.business };
    const licenseData = { ...formData.license };
    const practiceData = { ...formData.practice };
    const bankingData = { ...formData.banking };
    
    // Group all non-provider data
    const generalInfo = {
      ...businessData,
      ...licenseData,
      ...practiceData,
      ...bankingData
    };

    // Create worksheet for general info
    const wsGeneral = XLSX.utils.json_to_sheet([generalInfo]);
    
    // Create worksheet for providers
    const providersData = formData.providers.map((p, idx) => ({
      Provider_Number: idx + 1,
      ...p
    }));
    const wsProviders = XLSX.utils.json_to_sheet(providersData);

    // Create workbook and append sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Practice Info");
    XLSX.utils.book_append_sheet(wb, wsProviders, "Providers");

    // Generate and download file with client name
    const clientName = formData.business.legalName || 'Client';
    const safeName = clientName.replace(/[^a-z0-9]/gi, '_');
    XLSX.writeFile(wb, `MBMB_Onboarding_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    alert("Full Onboarding Data Exported Successfully! You can now send this file to MBMB.");
  };

  const [files, setFiles] = useState({});
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fieldName]: file.name }));
    }
  };


  const downloadChecklist = () => {
    const checklist = `
MEDICAL BILLING MIAMI BEACH (MBMB) - ONBOARDING CHECKLIST
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
    `;
    const element = document.createElement("a");
    const file = new Blob([checklist], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "MBMB_Required_Documents.txt";
    document.body.appendChild(element);
    element.click();
  };

  const renderBusiness = () => (
    <div className="section-form">
      <h3>Business & Legal Documents</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>City & County Business Tax Receipts</label>
          <input 
            name="business.taxReceipts" 
            value={formData.business.taxReceipts || ''} 
            onChange={handleChange} 
            onFocus={handleFocus}
            placeholder="Document number or status..."
          />
        </div>
        <div className="form-group">
          <label>Certificate of Use Verification</label>
          <input 
            name="business.certUse" 
            value={formData.business.certUse || ''} 
            onChange={handleChange} 
            onFocus={handleFocus}
            placeholder="Verification ID..."
          />
        </div>
        <div className="form-group">
          <label>Practice EIN (Tax ID)</label>
          <input 
            name="business.ein" 
            value={formData.business.ein || ''} 
            onChange={handleChange} 
            onFocus={handleFocus}
            placeholder="XX-XXXXXXX"
          />
        </div>
        <div className="form-group">
          <label>Legal Business Name</label>
          <input 
            name="business.legalName" 
            value={formData.business.legalName || ''} 
            onChange={handleChange} 
            onFocus={handleFocus}
          />
        </div>
        <div className="form-group">
          <label>Tax ID Document (IRS SS-4)</label>
          <div className="file-input-wrapper">
            <input type="file" onChange={(e) => handleFileUpload(e, 'business.taxIdDoc')} className="file-input" />
            <div className="file-status">{files['business.taxIdDoc'] || 'No file chosen'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLicense = () => (
    <div className="section-form">
      <h3>Licenses & Compliance</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>AHCA License or Exemption</label>
          <input name="license.ahca" value={formData.license.ahca || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>OSHA Compliance Setup</label>
          <select name="license.osha" value={formData.license.osha || ''} onChange={handleChange}>
            <option value="">Select status...</option>
            <option value="complete">Complete</option>
            <option value="in_progress">In Progress</option>
            <option value="not_started">Not Started</option>
          </select>
        </div>
        <div className="form-group">
          <label>HIPAA Compliance Audit</label>
          <select name="license.hipaa" value={formData.license.hipaa || ''} onChange={handleChange}>
            <option value="">Select status...</option>
            <option value="complete">Verified</option>
            <option value="pending">Pending Audit</option>
          </select>
        </div>
        <div className="form-group">
          <label>Biomedical Waste Permit</label>
          <input name="license.wastePermit" value={formData.license.wastePermit || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>PECOS Enrollment</label>
          <input name="license.pecos" value={formData.license.pecos || ''} onChange={handleChange} onFocus={handleFocus} placeholder="NPI/ID..." />
        </div>
        <div className="form-group">
          <label>Medicare Enrollment</label>
          <input name="license.medicare" value={formData.license.medicare || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>Insurance Credentialing</label>
          <input name="license.credentialing" value={formData.license.credentialing || ''} onChange={handleChange} onFocus={handleFocus} placeholder="Commercial plans..." />
        </div>
        <div className="form-group">
          <label>CLIA Certification</label>
          <input name="license.clia" value={formData.license.clia || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
      </div>
    </div>
  );

  const renderPractice = () => (
    <div className="section-form">
      <h3>Practice Address & Ownership</h3>
      <div className="form-grid full-width">
        <div className="form-group">
          <label>Practice Address</label>
          <textarea name="practice.address" value={formData.practice.address || ''} onChange={handleChange} onFocus={handleFocus} rows="2" />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label>Phone Number</label>
          <input name="practice.phone" value={formData.practice.phone || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>Fax Number</label>
          <input name="practice.fax" value={formData.practice.fax || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>Ownership Details</label>
          <input name="practice.ownership" value={formData.practice.ownership || ''} onChange={handleChange} onFocus={handleFocus} placeholder="Owner names/shareholders..." />
        </div>
        <div className="form-group">
          <label>Group NPI</label>
          <input name="practice.groupNpi" value={formData.practice.groupNpi || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>Practice License #</label>
          <input name="practice.license" value={formData.practice.license || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>Malpractice / Liability Policy</label>
          <input name="practice.malpractice" value={formData.practice.malpractice || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
      </div>
    </div>
  );

  const renderBanking = () => (
    <div className="section-form">
      <h3>Banking Information (EFT Enrollment)</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Account Number</label>
          <input name="banking.account" value={formData.banking.account || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>Routing Number</label>
          <input name="banking.routing" value={formData.banking.routing || ''} onChange={handleChange} onFocus={handleFocus} />
        </div>
        <div className="form-group">
          <label>Account Type</label>
          <select name="banking.type" value={formData.banking.type || ''} onChange={handleChange}>
            <option value="">Select...</option>
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
        <h3>Provider-Level Documents</h3>
        <button className="btn-add" onClick={addProvider}>
          <Plus size={18} /> Add Provider
        </button>
      </div>
      
      {formData.providers.map((provider, index) => (
        <div key={provider.id} className="provider-card">
          <div className="provider-header">
            <h4>Clinician #{index + 1}</h4>
            {formData.providers.length > 1 && (
              <button className="btn-icon danger" onClick={() => removeProvider(provider.id)}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Provider NPI</label>
              <input name={`providers.${provider.id}.npi`} value={provider.npi || ''} onChange={handleChange} onFocus={handleFocus} />
            </div>
            <div className="form-group">
              <label>TAX ID / SSN</label>
              <input name={`providers.${provider.id}.taxid`} value={provider.taxid || ''} onChange={handleChange} onFocus={handleFocus} />
            </div>
            <div className="form-group">
              <label>CV / Resume</label>
              <div className="file-input-wrapper">
                <input type="file" onChange={(e) => handleFileUpload(e, `providers.${provider.id}.cv`)} className="file-input" />
                <div className="file-status">{files[`providers.${provider.id}.cv`] || 'No file chosen'}</div>
              </div>
            </div>
            <div className="form-group">
              <label>Education Details (Degrees)</label>
              <input name={`providers.${provider.id}.education`} value={provider.education || ''} onChange={handleChange} onFocus={handleFocus} />
            </div>
            <div className="form-group">
              <label>Active State License</label>
              <input name={`providers.${provider.id}.license`} value={provider.license || ''} onChange={handleChange} onFocus={handleFocus} />
            </div>
            <div className="form-group">
              <label>DEA Registration</label>
              <input name={`providers.${provider.id}.dea`} value={provider.dea || ''} onChange={handleChange} onFocus={handleFocus} />
            </div>
            <div className="form-group">
              <label>Board Certification</label>
              <input name={`providers.${provider.id}.board`} value={provider.board || ''} onChange={handleChange} onFocus={handleFocus} />
            </div>
            <div className="form-group">
              <label>Malpractice Insurance</label>
              <input name={`providers.${provider.id}.malpractice`} value={provider.malpractice || ''} onChange={handleChange} onFocus={handleFocus} />
            </div>
            <div className="form-group">
              <label>CAQH Login</label>
              <input name={`providers.${provider.id}.caqh`} value={provider.caqh || ''} onChange={handleChange} onFocus={handleFocus} />
            </div>
          </div>
        </div>
      ))}
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
          <span>{isListening ? 'Voice Assistant Active' : 'Voice Assistant Off'}</span>
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
              <Download size={18} /> Req. Docs
            </button>
            <button className="btn-primary" onClick={handleExportExcel}>
              <FileSpreadsheet size={18} /> Export Excel
            </button>
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
              <p className="pulse">Listening...</p>
              <p className="current-text">{transcript || 'Speak to fill the selected field...'}</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
