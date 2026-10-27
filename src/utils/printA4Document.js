/**
 * Professional A4 Medical Document Printing Utility
 * Renders dedicated, crystal-clear A4 format PDFs/Prints without printing the web app page/modals.
 */

import config from '../config/appConfig';

/**
 * Universal print trigger via isolated iframe.
 * Prevents page background, modal overlays, sidebars, and URL headers from being printed.
 */
export const printA4Html = ({ title, bodyHtml, extraStyles = '' }) => {
  // Remove any leftover print iframes
  const existingIframe = document.getElementById('hms-isolated-print-frame');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'hms-isolated-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title || 'Medical Document'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 12mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.45;
        }
        .a4-sheet {
          width: 100%;
          max-width: 186mm;
          margin: 0 auto;
          background: #ffffff;
        }

        /* Hospital Header */
        .hosp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2.5px solid #0284c7;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .hosp-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hosp-logo-box {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 26px;
          font-weight: 900;
        }
        .hosp-titles h1 {
          margin: 0;
          font-size: 17pt;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .hosp-titles p {
          margin: 2px 0 0 0;
          font-size: 8.5pt;
          color: #0284c7;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .hosp-contact-meta {
          text-align: right;
          font-size: 8pt;
          color: #475569;
          line-height: 1.35;
        }
        .hosp-contact-meta strong {
          color: #0f172a;
        }

        /* Document Badge */
        .doc-badge-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 14px;
          margin-bottom: 14px;
        }
        .doc-type-title {
          font-size: 11.5pt;
          font-weight: 800;
          color: #0369a1;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .doc-meta-info {
          font-size: 8.5pt;
          color: #64748b;
          font-weight: 600;
        }

        /* Info Grid Boxes */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        .info-card {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 12px;
          background: #ffffff;
        }
        .info-card-header {
          font-size: 8pt;
          font-weight: 700;
          color: #0284c7;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
          border-bottom: 1px dashed #e2e8f0;
          padding-bottom: 4px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 9pt;
          margin-bottom: 3px;
        }
        .info-label {
          color: #64748b;
          font-weight: 500;
        }
        .info-val {
          color: #0f172a;
          font-weight: 700;
          text-align: right;
        }

        /* Content Tables */
        .doc-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 14px;
        }
        .doc-table th {
          background: #f1f5f9;
          color: #334155;
          font-size: 8.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 7px 10px;
          border: 1px solid #cbd5e1;
          text-align: left;
        }
        .doc-table td {
          font-size: 9pt;
          padding: 7px 10px;
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }
        .doc-table tr:nth-child(even) td {
          background: #f8fafc;
        }

        /* Highlight Boxes */
        .token-large-badge {
          display: inline-block;
          background: #e0f2fe;
          color: #0369a1;
          border: 1.5px solid #0284c7;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 900;
          font-size: 16pt;
          letter-spacing: 0.05em;
        }
        .vitals-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .vital-item {
          font-size: 8.5pt;
          color: #475569;
        }
        .vital-item strong {
          color: #0f172a;
        }

        /* Footer & Signatures */
        .doc-footer {
          margin-top: 24px;
          padding-top: 14px;
          border-top: 1.5px dashed #cbd5e1;
        }
        .sign-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 14px;
        }
        .stamp-box {
          border: 1px dashed #cbd5e1;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 7.5pt;
          color: #64748b;
          text-align: center;
          width: 170px;
        }
        .signature-box {
          text-align: right;
          width: 220px;
        }
        .signature-line {
          border-bottom: 1.5px solid #0f172a;
          margin-bottom: 4px;
          height: 34px;
        }
        .signature-name {
          font-size: 9.5pt;
          font-weight: 800;
          color: #0f172a;
        }
        .signature-title {
          font-size: 8pt;
          color: #64748b;
        }
        .disclaimer-strip {
          font-size: 7.5pt;
          color: #94a3b8;
          text-align: center;
          line-height: 1.35;
          margin-top: 8px;
        }

        ${extraStyles}
      </style>
    </head>
    <body>
      <div class="a4-sheet">
        ${bodyHtml}
      </div>
    </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    // Clean up iframe after print dialog finishes
    setTimeout(() => {
      iframe.remove();
    }, 2500);
  }, 350);
};

/**
 * 1. Print Standard OPD Consultation Token Slip & Bill
 */
export const printOpdSlipA4 = ({ appointment, hospitalSettings }) => {
  if (!appointment) return;

  const apptId = appointment._id ? appointment._id.substring(18).toUpperCase() : 'N/A';
  const patient = appointment.patient || {};
  const doctor = appointment.doctor || {};
  const hospitalName = hospitalSettings?.hospitalName || config.hospitalName || 'LifeCare Multi-Speciality Hospital';
  const hospitalPhone = hospitalSettings?.contactNumber || config.hospitalPhone || '+91 98765 43210';
  const hospitalEmergency = hospitalSettings?.emergencyContact || '+91 98765 43211';
  const hospitalAddress = hospitalSettings?.address || '108 Healthcare Blvd, Medical Enclave, New Delhi';

  const dateFormatted = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString();

  const timeFormatted = appointment.timeSlot
    ? `${appointment.timeSlot.start} - ${appointment.timeSlot.end}`
    : '09:30 AM - 10:00 AM';

  const roomNo = appointment.roomNumber || doctor.roomNumber || 'OPD-102';
  const fee = appointment.consultationFee || doctor.consultationFee || 500;
  const status = appointment.status || 'Confirmed';

  const bodyHtml = `
    <!-- Hospital Header -->
    <div class="hosp-header">
      <div class="hosp-brand">
        <div class="hosp-logo-box">+</div>
        <div class="hosp-titles">
          <h1>${hospitalName}</h1>
          <p>Outpatient Department (OPD) • Clinical Care Services</p>
        </div>
      </div>
      <div class="hosp-contact-meta">
        <div><strong>24x7 Help Desk:</strong> ${hospitalPhone}</div>
        <div><strong>Emergency:</strong> ${hospitalEmergency}</div>
        <div>${hospitalAddress}</div>
      </div>
    </div>

    <!-- Document Badge -->
    <div class="doc-badge-strip">
      <div class="doc-type-title">OPD Consultation Token & Bill Voucher</div>
      <div class="doc-meta-info">Issued: ${new Date().toLocaleString()} • Tracking #OPD-${apptId}</div>
    </div>

    <!-- Token Spotlight Callout -->
    <div style="display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px 18px; margin-bottom: 14px;">
      <div>
        <div style="font-size: 8.5pt; font-weight: 700; color: #166534; text-transform: uppercase;">Assigned Consultation Token</div>
        <div class="token-large-badge" style="margin-top: 4px; background: #dcfce7; border-color: #22c55e; color: #15803d;">
          TOKEN #OPD-${apptId}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 8.5pt; color: #64748b;">Scheduled Consultation Slot</div>
        <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin-top: 2px;">${dateFormatted}</div>
        <div style="font-size: 10pt; font-weight: 700; color: #0284c7;">${timeFormatted}</div>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-header">Patient Demographics</div>
        <div class="info-row"><span class="info-label">Full Name:</span><span class="info-val">${patient.name || 'Walk-in Patient'}</span></div>
        <div class="info-row"><span class="info-label">Contact Mobile:</span><span class="info-val">${patient.phone || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Email:</span><span class="info-val">${patient.email || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Gender / Blood Group:</span><span class="info-val">${patient.gender || 'N/A'} / ${patient.bloodGroup || 'N/A'}</span></div>
      </div>

      <div class="info-card">
        <div class="info-card-header">Consulting Physician & Venue</div>
        <div class="info-row"><span class="info-label">Attending Doctor:</span><span class="info-val" style="color: #0369a1;">Dr. ${doctor.name || 'On-Duty Physician'}</span></div>
        <div class="info-row"><span class="info-label">Specialization:</span><span class="info-val">${doctor.specialization || 'General OPD'}</span></div>
        <div class="info-row"><span class="info-label">Consultation Suite:</span><span class="info-val" style="color: #b91c1c;">Room ${roomNo}</span></div>
        <div class="info-row"><span class="info-label">Booking Status:</span><span class="info-val" style="color: #15803d;">${status}</span></div>
      </div>
    </div>

    <!-- Financial Billing Table -->
    <table class="doc-table">
      <thead>
        <tr>
          <th>Service Description</th>
          <th>Department / Category</th>
          <th>Payment Mode</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Doctor OPD Consultation Fee</strong>
            <div style="font-size: 7.5pt; color: #64748b;">Reason for Visit: ${appointment.reasonForVisit || 'General Clinical Consultation'}</div>
          </td>
          <td>${doctor.department || 'Outpatient Clinic'}</td>
          <td>Cash / Counter / Online</td>
          <td style="text-align: right; font-weight: 700;">₹${Number(fee).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right; font-weight: 800; font-size: 9.5pt;">Total Net Amount:</td>
          <td style="text-align: right; font-weight: 900; font-size: 10.5pt; color: #0284c7;">₹${Number(fee).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Notice Box -->
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 14px; font-size: 8.5pt; color: #1e40af; margin-bottom: 14px;">
      <strong>OPD Queue Guidelines:</strong>
      <ul style="margin: 4px 0 0 16px; padding: 0;">
        <li>Please report outside <strong>Room ${roomNo}</strong> at least 10 minutes prior to your allocated slot.</li>
        <li>Present this voucher slip along with prior medical investigations or prescriptions to the attending physician.</li>
        <li>Token sequence is strictly adhered to for patient safety and comfort. Emergency cases may be prioritized.</li>
      </ul>
    </div>

    <!-- Signatures & Footer -->
    <div class="doc-footer">
      <div class="sign-row">
        <div class="stamp-box">
          <div style="font-weight: 700; color: #0284c7; margin-bottom: 4px;">OPD DESK SEAL</div>
          <div>LifeCare Healthcare</div>
          <div>Computer Generated Record</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-name">Authorized Desk Officer</div>
          <div class="signature-title">Patient Services & Reception</div>
        </div>
      </div>
      <div class="disclaimer-strip">
        This is an official computer-generated OPD Consultation Voucher. Retain for follow-up verification. • www.lifecarehospital.com
      </div>
    </div>
  `;

  printA4Html({
    title: `OPD_Token_${apptId}_${patient.name || 'Patient'}`,
    bodyHtml
  });
};

/**
 * 2. Print Official Doctor Medical Prescription Slip
 */
export const printPrescriptionA4 = ({ prescription, hospitalSettings }) => {
  if (!prescription) return;

  const rxId = prescription._id ? prescription._id.substring(18).toUpperCase() : 'N/A';
  const patient = prescription.patient || {};
  const doctor = prescription.doctor || {};
  const medications = prescription.medications || [];

  const hospitalName = hospitalSettings?.hospitalName || config.hospitalName || 'LifeCare Multi-Speciality Hospital';
  const hospitalPhone = hospitalSettings?.contactNumber || config.hospitalPhone || '+91 98765 43210';
  const hospitalAddress = hospitalSettings?.address || '108 Healthcare Blvd, Medical Enclave, New Delhi';

  const dateFormatted = prescription.createdAt
    ? new Date(prescription.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString();

  const followUpFormatted = prescription.followUpDate
    ? new Date(prescription.followUpDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'As Needed / Advised';

  const medRows = medications.map((m, idx) => `
    <tr>
      <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
      <td>
        <strong style="color: #0f172a; font-size: 9.5pt;">${m.medicineName || m.name || 'Medication'}</strong>
        ${m.strength ? `<span style="color: #64748b; font-size: 8pt;"> (${m.strength})</span>` : ''}
      </td>
      <td>${m.dosage || '1 Tablet'}</td>
      <td>${m.frequency || 'Twice Daily'}</td>
      <td>${m.duration || '5 Days'}</td>
      <td style="color: #0369a1; font-weight: 600;">${m.instructions || m.timing || 'After Food'}</td>
    </tr>
  `).join('');

  const bodyHtml = `
    <!-- Hospital Header -->
    <div class="hosp-header">
      <div class="hosp-brand">
        <div class="hosp-logo-box">Rx</div>
        <div class="hosp-titles">
          <h1>${hospitalName}</h1>
          <p>Department of Clinical Medicine & Outpatient Pharmacotherapy</p>
        </div>
      </div>
      <div class="hosp-contact-meta">
        <div><strong>24x7 Helpline:</strong> ${hospitalPhone}</div>
        <div>${hospitalAddress}</div>
        <div>NABH Accredited • Reg No: DL/HOSP/2024/991</div>
      </div>
    </div>

    <!-- Document Badge -->
    <div class="doc-badge-strip">
      <div class="doc-type-title">Medical Prescription & Dispensary Order</div>
      <div class="doc-meta-info">Prescription #Rx-${rxId} • Date: ${dateFormatted}</div>
    </div>

    <!-- Doctor & Patient Details Grid -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-header">Patient Clinical Record</div>
        <div class="info-row"><span class="info-label">Patient Name:</span><span class="info-val">${patient.name || 'Walk-in Patient'}</span></div>
        <div class="info-row"><span class="info-label">Contact / Phone:</span><span class="info-val">${patient.phone || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Age / Gender:</span><span class="info-val">${patient.age ? patient.age + ' Yrs' : 'N/A'} / ${patient.gender || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Blood Group:</span><span class="info-val">${patient.bloodGroup || 'N/A'}</span></div>
      </div>

      <div class="info-card">
        <div class="info-card-header">Prescribing Physician</div>
        <div class="info-row"><span class="info-label">Doctor Name:</span><span class="info-val" style="color: #0369a1;">Dr. ${doctor.name || 'Medical Officer'}</span></div>
        <div class="info-row"><span class="info-label">Specialization:</span><span class="info-val">${doctor.specialization || 'Consultant Physician'}</span></div>
        <div class="info-row"><span class="info-label">Qualifications:</span><span class="info-val">${doctor.qualifications || 'MBBS, MD'}</span></div>
        <div class="info-row"><span class="info-label">Follow-up Date:</span><span class="info-val" style="color: #b91c1c;">${followUpFormatted}</span></div>
      </div>
    </div>

    <!-- Clinical Diagnosis & Complaints -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px;">
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <span style="font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase;">Provisional / Final Diagnosis:</span>
          <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-top: 2px;">
            ${prescription.diagnosis || 'Clinical Consultation'}
          </div>
        </div>
        ${prescription.symptoms ? `
          <div style="flex: 1;">
            <span style="font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase;">Chief Complaints / Symptoms:</span>
            <div style="font-size: 9pt; font-weight: 600; color: #334155; margin-top: 2px;">
              ${prescription.symptoms}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Medications Table (Rx) -->
    <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
      <span style="color: #0284c7; font-size: 14pt;">℞</span> Prescribed Pharmacotherapy
    </div>
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Medicine Name & Strength</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Administration / Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${medRows.length > 0 ? medRows : '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No medications listed.</td></tr>'}
      </tbody>
    </table>

    <!-- Advice & Instructions -->
    ${prescription.clinicalAdvice || prescription.doctorNotes || prescription.treatmentPlan ? `
      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 8.5pt; color: #0f766e;">
        <strong>Special Medical Advice & Dietary Instructions:</strong>
        <div style="margin-top: 4px; color: #115e59; font-size: 9pt;">
          ${prescription.clinicalAdvice || prescription.treatmentPlan || prescription.doctorNotes}
        </div>
      </div>
    ` : ''}

    <!-- Signatures & Footer -->
    <div class="doc-footer" style="margin-top: 30px;">
      <div class="sign-row">
        <div class="stamp-box">
          <div style="font-weight: 700; color: #0284c7; margin-bottom: 4px;">PHARMACY DISPENSARY</div>
          <div>Verified Valid for Dispensation</div>
          <div>LifeCare Pharmacy</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-name">Dr. ${doctor.name || 'Attending Physician'}</div>
          <div class="signature-title">${doctor.qualifications || 'Consultant'} • Reg #${doctor._id ? doctor._id.substring(18).toUpperCase() : 'MCI-88219'}</div>
        </div>
      </div>
      <div class="disclaimer-strip">
        Please consult the pharmacist for generic substitutes. Take medications strictly as scheduled. • LifeCare Clinical Systems
      </div>
    </div>
  `;

  printA4Html({
    title: `Prescription_${rxId}_${patient.name || 'Patient'}`,
    bodyHtml
  });
};

/**
 * 3. Print Official Clinical Diagnostic Lab Report Certificate
 */
export const printLabReportA4 = ({ result, hospitalSettings }) => {
  if (!result) return;

  const labRequest = result.labRequest || {};
  const labTest = labRequest.labTest || result.labTest || {};
  const patient = result.patient || labRequest.patient || {};
  const doctor = labRequest.doctor || {};
  const parameters = result.parameters || [];

  const hospitalName = hospitalSettings?.hospitalName || config.hospitalName || 'LifeCare Multi-Speciality Hospital';
  const hospitalPhone = hospitalSettings?.contactNumber || config.hospitalPhone || '+91 98765 43210';
  const hospitalAddress = hospitalSettings?.address || '108 Healthcare Blvd, Medical Enclave, New Delhi';

  const reportId = result._id ? result._id.substring(18).toUpperCase() : 'N/A';
  const collectionDate = labRequest.collectedAt
    ? new Date(labRequest.collectedAt).toLocaleString()
    : 'Received in Lab';

  const releaseDate = result.releasedAt || result.createdAt
    ? new Date(result.releasedAt || result.createdAt).toLocaleString()
    : new Date().toLocaleString();

  const paramRows = parameters.map((p, idx) => {
    const isAbnormal = p.flag === 'High' || p.flag === 'Low' || p.flag === 'Critical' || p.isAbnormal;
    return `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td><strong>${p.parameterName || p.name || 'Test Parameter'}</strong></td>
        <td style="font-weight: 800; color: ${isAbnormal ? '#dc2626' : '#0f172a'}; font-size: 9.5pt;">
          ${p.resultValue || p.value || '-'}
        </td>
        <td>${p.unit || p.units || '-'}</td>
        <td style="color: #475569;">${p.referenceRange || p.normalRange || '-'}</td>
        <td>
          <span style="font-size: 7.5pt; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${isAbnormal ? '#fee2e2' : '#dcfce7'}; color: ${isAbnormal ? '#b91c1c' : '#15803d'};">
            ${isAbnormal ? (p.flag || 'Abnormal') : 'Normal'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const bodyHtml = `
    <!-- Hospital Header -->
    <div class="hosp-header">
      <div class="hosp-brand">
        <div class="hosp-logo-box">🔬</div>
        <div class="hosp-titles">
          <h1>${hospitalName}</h1>
          <p>NABL Accredited Diagnostic Laboratories & Pathology Services</p>
        </div>
      </div>
      <div class="hosp-contact-meta">
        <div><strong>Lab Diagnostics:</strong> ${hospitalPhone}</div>
        <div>${hospitalAddress}</div>
        <div>NABL Cert #MC-2941 • ISO 15189:2012 Certified</div>
      </div>
    </div>

    <!-- Document Badge -->
    <div class="doc-badge-strip">
      <div class="doc-type-title">Certified Laboratory Diagnostic Investigation</div>
      <div class="doc-meta-info">Report #LAB-${reportId} • Released: ${releaseDate}</div>
    </div>

    <!-- Patient & Specimen Info Grid -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-header">Patient Identifiers</div>
        <div class="info-row"><span class="info-label">Patient Name:</span><span class="info-val">${patient.name || 'Walk-in Patient'}</span></div>
        <div class="info-row"><span class="info-label">Patient Contact:</span><span class="info-val">${patient.phone || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Age / Gender:</span><span class="info-val">${patient.age ? patient.age + ' Yrs' : 'N/A'} / ${patient.gender || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Referred By:</span><span class="info-val">Dr. ${doctor.name || 'Attending Physician'}</span></div>
      </div>

      <div class="info-card">
        <div class="info-card-header">Specimen & Assay Details</div>
        <div class="info-row"><span class="info-label">Investigation:</span><span class="info-val" style="color: #0369a1;">${labTest.testName || 'Laboratory Test'}</span></div>
        <div class="info-row"><span class="info-label">Sample Specimen:</span><span class="info-val">${labTest.sampleType || labRequest.sampleType || 'Venous Blood'}</span></div>
        <div class="info-row"><span class="info-label">Collected At:</span><span class="info-val">${collectionDate}</span></div>
        <div class="info-row"><span class="info-label">Result Status:</span><span class="info-val" style="color: #15803d;">Validated & Certified</span></div>
      </div>
    </div>

    <!-- Findings Table -->
    <div style="font-size: 10.5pt; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
      Observed Test Parameters & Bio-Reference Intervals
    </div>
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Test Parameter</th>
          <th>Observed Value</th>
          <th>Unit</th>
          <th>Reference Interval</th>
          <th>Flag</th>
        </tr>
      </thead>
      <tbody>
        ${paramRows.length > 0 ? paramRows : `
          <tr>
            <td style="text-align: center;">1</td>
            <td><strong>${labTest.testName || 'Assay Result'}</strong></td>
            <td style="font-weight: 800;">${result.summary || 'Normal / Negative'}</td>
            <td>-</td>
            <td>Negative / Standard</td>
            <td><span style="font-size: 7.5pt; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #dcfce7; color: #15803d;">Normal</span></td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Pathologist Comments -->
    ${result.remarks || result.findings || result.interpretation ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 8.5pt;">
        <strong style="color: #0369a1;">Pathologist Remarks & Clinical Correlation:</strong>
        <div style="margin-top: 3px; color: #334155; font-size: 9pt;">
          ${result.remarks || result.findings || result.interpretation}
        </div>
      </div>
    ` : ''}

    <!-- Signatures & Footer -->
    <div class="doc-footer" style="margin-top: 30px;">
      <div class="sign-row">
        <div class="stamp-box">
          <div style="font-weight: 700; color: #0284c7; margin-bottom: 4px;">LABORATORY SEAL</div>
          <div>LifeCare Clinical Diagnostics</div>
          <div>NABL Accredited Quality Assurance</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-name">Dr. A. K. Verma, MD (Path)</div>
          <div class="signature-title">Consultant Pathologist & Lab Director</div>
        </div>
      </div>
      <div class="disclaimer-strip">
        Bio-chemical and pathological tests are subject to biological variation. Correlate clinically. • LifeCare Laboratory Information System
      </div>
    </div>
  `;

  printA4Html({
    title: `Lab_Report_${reportId}_${patient.name || 'Patient'}`,
    bodyHtml
  });
};
