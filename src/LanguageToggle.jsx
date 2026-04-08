import React, { useState } from 'react';
import { Globe } from 'lucide-react';

const translations = {
  en: {
    nav: {
      business: 'Business & Legal',
      license: 'Licenses & Compliance',
      practice: 'Practice Details',
      banking: 'Banking',
      providers: 'Providers',
      finish: 'Review & Finish'
    },
    buttons: {
      exportPackage: 'Export Package',
      docChecklist: 'Doc Checklist',
      addProvider: 'Add Provider'
    },
    forms: {
      businessLegal: 'Business & Legal Documents',
      licensesCompliance: 'Licenses & Compliance',
      practiceAddress: 'Practice Address & Ownership',
      bankingInfo: 'Banking Information (EFT Enrollment)',
      providerDocs: 'Provider-Level Documents',
      submitPackage: 'Submit Your Onboarding Package',
      instructions: 'Instructions to Finish:',
      practiceAddress: 'Practice Address',
      taxIdDocument: 'Tax ID Document (IRS SS-4)',
      ahcaLicense: 'AHCA License or Exemption',
      oshaCompliance: 'OSHA Compliance Setup',
      hipaaAudit: 'HIPAA Compliance Audit',
      biomedicalWaste: 'Biomedical Waste Permit',
      pecosEnrollment: 'PECOS Enrollment',
      medicareEnrollment: 'Medicare Enrollment',
      insuranceCred: 'Insurance Credentialing',
      cliaCert: 'CLIA Certification',
      ownershipDetails: 'Ownership Details',
      groupNPI: 'Group NPI',
      practiceLicense: 'Practice License #',
      malpracticeLiability: 'Malpractice / Liability Policy',
      phoneNumber: 'Phone Number',
      faxNumber: 'Fax Number',
      cityTaxReceipts: 'City & County Business Tax Receipts',
      certUseVerif: 'Certificate of Use Verification',
      practiceEin: 'Practice EIN (Tax ID)',
      legalBusinessName: 'Legal Business Name',
      accountNumber: 'Account Number',
      routingNumber: 'Routing Number',
      accountType: 'Account Type',
      providerNPI: 'Provider NPI',
      taxIdSsn: 'TAX ID / SSN',
      cvResume: 'CV / Resume',
      educationDetails: 'Education Details (Degrees)',
      stateLicense: 'Active State License',
      deaRegistration: 'DEA Registration',
      boardCertification: 'Board Certification',
      malpracticeInsurance: 'Malpractice Insurance',
      caqhLogin: 'CAQH Login',
      providerNumber: 'Provider Number'
    },
    placeholders: {
      documentNumber: 'Document number or status...',
      verificationId: 'Verification ID...',
      taxIdFormat: 'XX-XXXXXXX',
      practiceAddress: 'Practice Address',
      ownerNames: 'Owner names/shareholders...',
      npiId: 'NPI/ID...',
      commercialPlans: 'Commercial plans...',
      selectStatus: 'Select status...',
      selectAccountType: 'Select...'
    },
    messages: {
      zipReady: 'Final Package Ready! Please email this ZIP file to jasmel@medicalbillingmb.com or jasmelacosta@gmail.com. For support, call 786-643-2099.',
      instructionsList: [
        'Download the ZIP package using the button above.',
        'Send an email to jasmel@medicalbillingmb.com or jasmelacosta@gmail.com',
        'For support, you can call or text 786-643-2099',
        'Attach the ZIP file to your message.'
      ]
    },
    voiceAssistant: {
      listening: 'Voice Assistant Active',
      off: 'Voice Assistant Off',
      listeningText: 'Listening...',
      transcriptPlaceholder: 'Speak to fill the selected field...'
    },
    savingsCalculator: {
      title: 'Live Savings Calculator',
      subtitle: 'See how much more you could earn with our 98% clean claim rate',
      monthlyBilling: 'Monthly Billing Volume ($)',
      currentDenialRate: 'Current Denial Rate (%)',
      calculateSavings: 'Calculate Potential Savings',
      potentialIncrease: 'Potential Monthly Revenue Increase:',
      annualImpact: 'Annual Impact:',
      cleanClaimRate: 'Our Clean Claim Rate: 98%',
      industryAverage: 'Industry Average: 70-80%'
    },
    leadMagnet: {
      title: '2026 Florida Billing Compliance Checklist',
      description: 'Get your free compliance checklist to ensure your practice meets all Florida Medicaid requirements.',
      buttonText: 'Download Free Checklist',
      privacyNote: 'We value your privacy. Unsubscribe anytime.'
    }
  },
  es: {
    nav: {
      business: 'Negocios & Legal',
      license: 'Licencias & Cumplimiento',
      practice: 'Detalles de la Práctica',
      banking: 'Banca',
      providers: 'Proveedores',
      finish: 'Revisión & Finalización'
    },
    buttons: {
      exportPackage: 'Exportar Paquete',
      docChecklist: 'Lista de Documentos',
      addProvider: 'Agregar Proveedor'
    },
    forms: {
      businessLegal: 'Documentos de Negocios & Legales',
      licensesCompliance: 'Licencias & Cumplimiento',
      practiceAddress: 'Dirección de la Práctica & Propiedad',
      bankingInfo: 'Información Bancaria (Inscripción EFT)',
      providerDocs: 'Documentos de Nivel de Proveedor',
      submitPackage: 'Envíe su Paquete de Incorporación',
      instructions: 'Instrucciones para Finalizar:',
      practiceAddress: 'Dirección de la Práctica',
      taxIdDocument: 'Documento de Identificación Fiscal (IRS SS-4)',
      ahcaLicense: 'Licencia AHCA o Exención',
      oshaCompliance: 'Configuración de Cumplimiento OSHA',
      hipaaAudit: 'Auditoría de Cumplimiento HIPAA',
      biomedicalWaste: 'Permiso de Residuos Biomédicos',
      pecosEnrollment: 'Inscripción en PECOS',
      medicareEnrollment: 'Inscripción en Medicare',
      insuranceCred: 'Acreditación de Seguros',
      cliaCert: 'Certificación CLIA',
      ownershipDetails: 'Detalles de Propiedad',
      groupNPI: 'NPI del Grupo',
      practiceLicense: 'Número de Licencia de la Práctica',
      malpracticeLiability: 'Póliza de Responsabilidad Profesional / Responsabilidad Civil',
      phoneNumber: 'Número de Teléfono',
      faxNumber: 'Número de Fax',
      cityTaxReceipts: 'Recibos de Impuestos Comerciales de Ciudad & Condado',
      certUseVerif: 'Verificación de Certificado de Uso',
      practiceEin: 'EIN de la Práctica (ID Fiscal)',
      legalBusinessName: 'Nombre Legal del Negocio',
      accountNumber: 'Número de Cuenta',
      routingNumber: 'Número de Ruta',
      accountType: 'Tipo de Cuenta',
      providerNPI: 'NPI del Proveedor',
      taxIdSsn: 'ID Fiscal / SSN',
      cvResume: 'CV / Currículum Vitae',
      educationDetails: 'Detalles de Educación (Títulos)',
      stateLicense: 'Licencia Estatal Activa',
      deaRegistration: 'Registro de la DEA',
      boardCertification: 'Certificación de Junta',
      malpracticeInsurance: 'Seguro de Responsabilidad Profesional',
      caqhLogin: 'Credenciales de CAQH',
      providerNumber: 'Número de Proveedor'
    },
    placeholders: {
      documentNumber: 'Número de documento o estado...',
      verificationId: 'ID de verificación...',
      taxIdFormat: 'XX-XXXXXXX',
      practiceAddress: 'Dirección de la Práctica',
      ownerNames: 'Nombres de propietarios/accionistas...',
      npiId: 'NPI/ID...',
      commercialPlans: 'Planes comerciales...',
      selectStatus: 'Seleccione un estado...',
      selectAccountType: 'Seleccione...'
    },
    messages: {
      zipReady: '¡Paquete final listo! Por favor envíe este archivo ZIP a jasmel@medicalbillingmb.com o jasmelacosta@gmail.com. Para soporte, llame al 786-643-2099.',
      instructionsList: [
        'Descargue el paquete ZIP usando el botón de arriba.',
        'Envío un correo electrónico a jasmel@medicalbillingmb.com o jasmelacosta@gmail.com',
        'Para soporte, puede llamar o enviar mensaje de texto al 786-643-2099',
        'Adjunte el archivo ZIP a su mensaje.'
      ]
    },
    voiceAssistant: {
      listening: 'Asistente de Voz Activo',
      off: 'Asistente de Voz Desactivado',
      listeningText: 'Escuchando...',
      transcriptPlaceholder: 'Hable para completar el campo seleccionado...'
    },
    savingsCalculator: {
      title: 'Calculadora de Ahorros en Tiempo Real',
      subtitle: 'Vea cuánto más podría ganar con nuestra tasa de reclamos limpios del 98%',
      monthlyBilling: 'Volumen de Facturación Mensual ($)',
      currentDenialRate: 'Tasa Actual de Negación (%)',
      calculateSavings: 'Calcular Ahorros Potenciales',
      potentialIncrease: 'Aumento Potencial de Ingresos Mensuales:',
      annualImpact: 'Impacto Anual:',
      cleanClaimRate: 'Nuestra Tasa de Reclamos Limpios: 98%',
      industryAverage: 'Promedio de la Industria: 70-80%'
    },
    leadMagnet: {
      title: 'Lista de Verificación de Cumplimiento de Facturación de Florida 2026',
      description: 'Obtenga su lista de verificación de cumplimiento gratuita para asegurarse de que su práctica cumpla con todos los requisitos de Medicaid de Florida.',
      buttonText: 'Descargar Lista de Verificación Gratis',
      privacyNote: 'Valoramos su privacidad. Puede darse de baja en cualquier momento.'
    }
  }
};

const LanguageToggle = () => {
  const [language, setLanguage] = useState('en');
  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(lang => lang === 'en' ? 'es' : 'en');
  };

  return (
    <div className="language-toggle">
      <button 
        onClick={toggleLanguage}
        className="btn-language"
        aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
      >
        <Globe size={16} />
        <span>{language === 'en' ? 'ES' : 'EN'}</span>
      </button>
    </div>
  );
};

export default LanguageToggle;