

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCog, faHome, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Form, Button, ButtonGroup, Breadcrumb, Dropdown, Modal, Table, Card, Alert } from '@themesberg/react-bootstrap';
import * as XLSX from 'xlsx';
import LogoAQSO from "../assets/img/Gemini_Generated_Image_82909d82909d829.png";

// CSS untuk print - optimized for A4 paper (portrait)
const printStyles = `
  @media print {
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: hidden !important;
    }
    body * {
      visibility: hidden;
    }
    .modal,
    .modal-dialog,
    .modal-content,
    #printContent,
    #printContent * {
      visibility: visible;
    }
    .modal {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      height: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      opacity: 1 !important;
      display: block !important;
      background: transparent !important;
    }
    .modal-dialog {
      max-width: none !important;
      margin: 0 !important;
      width: 100% !important;
      height: 100% !important;
    }
    .modal-content {
      border: none !important;
      box-shadow: none !important;
      height: 100% !important;
      background: transparent !important;
    }
    .modal-header {
      display: none !important;
    }
    .modal-body {
      padding: 0 !important;
      margin: 0 !important;
      height: 100% !important;
      display: flex !important;
      align-items: flex-start !important;
      justify-content: flex-start !important;
      background: transparent !important;
    }
    #printContent {
      position: relative !important;
      top: 0 !important;
      left: 0 !important;
      width: 21cm !important;
      min-height: 8.5cm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      display: block !important;
    }
    #printContent-inner {
      width: 21cm !important;
      height: auto !important;
      min-height: 8cm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      border: 1.2px solid #0f62fe !important;
      border-radius: 0 !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }
  }
  @page {
    margin: 0;
    size: A4 portrait;
  }
`;

export default () => {
  // Use explicit backend URL for API calls during local development.
  // If you deploy and need a different backend, set REACT_APP_API_BASE at build time.
  const API_BASE = process.env.REACT_APP_API_URL || '';
  // Add print styles to document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Reusable helper: convert integer number to Indonesian words (simple)
  const convertNumberToWords = (num) => {
    const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
    const toWords = (n) => {
      n = Math.floor(n);
      if (n < 12) return satuan[n];
      if (n < 20) return toWords(n - 10) + " belas";
      if (n < 100) return toWords(Math.floor(n / 10)) + " puluh" + (n % 10 !== 0 ? " " + toWords(n % 10) : "");
      if (n < 200) return "seratus" + (n - 100 !== 0 ? " " + toWords(n - 100) : "");
      if (n < 1000) return toWords(Math.floor(n / 100)) + " ratus" + (n % 100 !== 0 ? " " + toWords(n % 100) : "");
      if (n < 2000) return "seribu" + (n - 1000 !== 0 ? " " + toWords(n - 1000) : "");
      if (n < 1000000) return toWords(Math.floor(n / 1000)) + " ribu" + (n % 1000 !== 0 ? " " + toWords(n % 1000) : "");
      if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + " juta" + (n % 1000000 !== 0 ? " " + toWords(n % 1000000) : "");
      if (n < 1000000000000) return toWords(Math.floor(n / 1000000000)) + " miliar" + (n % 1000000000 !== 0 ? " " + toWords(n % 1000000000) : "");
      return n.toString();
    };
    if (num === null || num === undefined || num === "") return "";
    const str = String(num).replace(/[^0-9]/g, '');
    if (str === "") return "";
    const intPart = parseInt(str, 10) || 0;
    let words = toWords(intPart) || "";
    words = words.trim();
    if (words) words = words.replace(/^satu ribu/, 'seribu');
    return (words ? words + ' rupiah' : '');
  };
  const [showModal, setShowModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPrintButtons, setShowPrintButtons] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const fileInputRef = useRef(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    const convertLogoToDataUrl = async () => {
      try {
        const response = await fetch(LogoAQSO);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoDataUrl(reader.result);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Tidak bisa memuat logo sebagai data URL', err);
      }
    };
    convertLogoToDataUrl();
  }, []);
  
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch transactions from backend on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        console.log('[Transactions] fetching from', `${API_BASE}/transactions`);
        const res = await fetch(`${API_BASE}/transactions`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      }
    };
    fetchTransactions();
  }, []);

  const [form, setForm] = useState({
    no_kwitansi: "",
    diterima_dari: "",
    untuk_pembayaran: "",
    ket_pembayaran: "",
    nama_marketing: "",
    jumlah: "",
    terbilang: "",
    tanggal: ""
  });

  const [errors, setErrors] = useState({});

  const handleOpen = () => {
    setEditingId(null);
    // auto-generate next no_kwitansi based on existing transactions
    const nextId = transactions && transactions.length > 0 ? Math.max(...transactions.map(t => t.id || 0)) + 1 : 1;
    const formatted = String(nextId).padStart(3, '0');
    setForm({
      no_kwitansi: formatted,
      diterima_dari: "",
      untuk_pembayaran: "",
      ket_pembayaran: "",
      nama_marketing: "",
      jumlah: "",
      terbilang: "",
      // default tanggal ke hari ini (YYYY-MM-DD)
      tanggal: new Date().toISOString().slice(0,10)
    });
    setShowModal(true);
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setForm({
      no_kwitansi: transaction.no_kwitansi,
      diterima_dari: transaction.diterima_dari,
      untuk_pembayaran: transaction.untuk_pembayaran,
      ket_pembayaran: transaction.ket_pembayaran,
      nama_marketing: transaction.nama_marketing,
      jumlah: transaction.jumlah != null ? String(transaction.jumlah) : '',
      terbilang: convertNumberToWords(transaction.jumlah),
      tanggal: transaction.tanggal || new Date().toISOString().slice(0,10)
    });
    setShowModal(true);
  };

  const handlePrint = (transaction) => {
    setSelectedTransaction(transaction);
    setShowPrintModal(true);
    setShowPrintButtons(false);
  };

  const buildWordHtml = (transaction) => {
    if (!transaction) return '';
    const rows = [
      { label: 'SUDAH TERIMA DARI', value: transaction.diterima_dari || '-' },
      { label: 'UNTUK PEMBAYARAN', value: transaction.untuk_pembayaran || '-' },
      { label: 'KET. PEMBAYARAN', value: transaction.ket_pembayaran || '-' },
      { label: 'NAMA MARKETING', value: transaction.nama_marketing || '-' },
      { label: 'JUMLAH', value: `Rp ${transaction.jumlah?.toLocaleString('id-ID') || '0'}`, strong: true },
      { label: 'TERBILANG', value: transaction.terbilang || '-' }
    ];

    const rowsHtml = rows.map(row => `
      <tr>
        <td style="font-weight:600;padding:8px 12px;width:7cm;border-bottom:0.2mm solid #d7e7ff;font-size:12pt;">${row.label}</td>
        <td style="font-weight:600;padding:8px 6px;width:0.6cm;border-bottom:0.2mm solid #d7e7ff;font-size:12pt;">:</td>
        <td style="padding:8px 12px;border-bottom:0.2mm solid #d7e7ff;font-weight:${row.strong ? 700 : 500};font-size:12pt;">${row.value}</td>
      </tr>
    `).join('');

    const logoSrc = logoDataUrl || LogoAQSO;

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8" />
          <title>Kwitansi AQSO</title>
            <style>
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            html, body {
              width: 19cm;
              height: 27.7cm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: #0f1f3d;
              background: #cbdff9;
            }
            .canvas {
              width: 19cm;
              height: 27.7cm;
              background: #e4f2ff;
              margin: 0 auto;
              padding: 1cm;
              box-sizing: border-box;
              display: flex;
              align-items: flex-start;
              justify-content: center;
            }
            .card {
              width: 17cm;
              height: 25.7cm;
              background: #fff;
              border-radius: 0.5cm;
              box-shadow: 0 12px 45px rgba(0,0,0,0.18);
              position: relative;
              overflow: hidden;
              padding: 1.2cm 1.5cm;
              box-sizing: border-box;
            }
            .card-bg-1 {
              position: absolute;
              top: -4cm;
              left: -4cm;
              width: 10cm;
              height: 10cm;
              background: rgba(0,150,255,0.15);
              transform: rotate(-20deg);
            }
            .card-bg-2 {
              position: absolute;
              bottom: -5cm;
              right: -5cm;
              width: 12cm;
              height: 12cm;
              background: rgba(15,98,254,0.08);
              border-radius: 50%;
            }
            .content {
              position: relative;
              z-index: 2;
              height: 100%;
            }
            .header-table {
              width: 100%;
              table-layout: fixed;
            }
            .info-table {
              width: 100%;
              border: 0.4mm solid #0f62fe;
              border-radius: 0.4cm;
              padding: 0.4cm;
              box-sizing: border-box;
              margin-top: 0.8cm;
            }
            .notes-row {
              font-size: 11pt;
              color: #123054;
              line-height: 1.6;
            }
            .signature {
              width: 7cm;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="canvas">
            <div class="card">
              <div class="card-bg-1"></div>
              <div class="card-bg-2"></div>
              <div class="content">
                <table class="header-table">
                  <tr>
                    <td style="width:7cm;vertical-align:top;font-size:11pt;">
                      <div style="margin-bottom:0.3cm;">No. Kwitansi :</div>
                      <div style="font-weight:700;font-size:18pt;letter-spacing:1.5px;">${transaction.no_kwitansi || '-'}</div>
                    </td>
                    <td style="text-align:center;">
                      <div style="font-size:28pt;font-weight:900;letter-spacing:6px;margin-bottom:0.2cm;">KWITANSI</div>
                      <div style="font-size:12pt;letter-spacing:3px;">AQSO RESIDENCE</div>
                    </td>
                    <td style="width:7cm;text-align:right;vertical-align:top;">
                      <img src="${logoSrc}" alt="AQSO RESIDENCE" style="width:3.5cm;height:3.5cm;object-fit:contain;" />
                    </td>
                  </tr>
                </table>

                <div class="info-table">
                  <table style="width:100%;border-collapse:collapse;font-size:13pt;">
                    ${rowsHtml}
                  </table>
                </div>

                <table style="width:100%;margin-top:1.5cm;">
                  <tr>
                    <td class="notes-row">
                      <div style="font-weight:700;margin-bottom:0.4cm;font-size:12pt;">Catatan:</div>
                      <div style="margin-bottom:0.2cm;">- Rekening Pembayaran PT. Bank .........................................................</div>
                      <div style="margin-bottom:0.2cm;">- Sertakan Foto Bukti Transfer, Nama Customer, Blok Pembayaran / Angsuran</div>
                      <div>- UTJ berlaku maksimal 10 hari dari tanggal kwitansi ini</div>
                    </td>
                    <td class="signature">
                      <div style="font-size:13pt;margin-bottom:0.3cm;">................................/......../20......</div>
                      <div style="margin-top:2cm;border-top:0.3mm solid #222;padding-top:0.2cm;font-size:11pt;">Marketing / Penerima</div>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadWord = () => {
    if (!selectedTransaction) return;
    const htmlContent = buildWordHtml(selectedTransaction);
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `kwitansi_${selectedTransaction.no_kwitansi || 'transaksi'}.doc`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setShowModal(false);
    setErrors({});
    setEditingId(null);
  };

  const handleClosePrint = () => {
    setShowPrintModal(false);
    setShowPrintButtons(false);
    setSelectedTransaction(null);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'jumlah') {
        const num = value === '' ? 0 : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
        next.terbilang = convertNumberToWords(num);
      }
      return next;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.diterima_dari || String(form.diterima_dari).trim() === '') newErrors.diterima_dari = 'Nama penerima wajib diisi';
    if (!form.untuk_pembayaran || String(form.untuk_pembayaran).trim() === '') newErrors.untuk_pembayaran = 'Untuk pembayaran wajib dipilih';
    if (!form.jumlah || Number(form.jumlah) <= 0) newErrors.jumlah = 'Jumlah harus lebih besar dari 0';
    if (!form.tanggal || String(form.tanggal).trim() === '') newErrors.tanggal = 'Tanggal wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload = {
      no_kwitansi: form.no_kwitansi && String(form.no_kwitansi).trim() !== '' ? String(form.no_kwitansi).trim() : undefined,
      diterima_dari: form.diterima_dari,
      untuk_pembayaran: form.untuk_pembayaran,
      ket_pembayaran: form.ket_pembayaran,
      nama_marketing: form.nama_marketing,
      jumlah: parseFloat(form.jumlah),
      terbilang: form.terbilang,
      tanggal: form.tanggal
    };
    // default tanggal to today if not provided
    if (!payload.tanggal) payload.tanggal = new Date().toISOString().slice(0,10);
    // remove undefined fields so server merge doesn't overwrite with undefined
    Object.keys(payload).forEach(k => (payload[k] === undefined) && delete payload[k]);

    if (editingId) {
      (async () => {
        try {
          console.log('[Transactions] PUT to', `${API_BASE}/transactions/${editingId}`, payload);
          const res = await fetch(`${API_BASE}/transactions/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            let body = null;
            try {
              // clone response so we can safely try json then text
              const rclone = res.clone();
              try { body = await rclone.json(); }
              catch (e) { body = await res.text(); }
            } catch (readErr) {
              console.error('Failed to read error body', readErr);
            }
            console.error('Update failed', res.status, body);
            const msg = (body && body.message) ? body.message : (typeof body === 'string' ? body : res.statusText || 'server error');
            alert('Gagal mengupdate transaksi: ' + msg);
            return;
          }
          const updated = await res.json();
          setTransactions(prev => prev.map(t => (String(t.id) === String(updated.id) ? updated : t)));
          setForm({ no_kwitansi: '', diterima_dari: '', untuk_pembayaran: '', ket_pembayaran: '', nama_marketing: '', jumlah: '', terbilang: '', tanggal: '' });
          setErrors({});
          handleClose();
        } catch (err) {
          console.error(err);
          alert('Gagal mengupdate transaksi: ' + (err.message || err));
        }
      })();
    } else {
      (async () => {
        try {
          // remove undefined so server-side defaults apply
          Object.keys(payload).forEach(k => (payload[k] === undefined) && delete payload[k]);
          console.log('[Transactions] POST to', `${API_BASE}/transactions`, payload);
          const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            let body = null;
            try {
              const rclone = res.clone();
              try { body = await rclone.json(); }
              catch (e) { body = await res.text(); }
            } catch (readErr) {
              console.error('Failed to read error body', readErr);
            }
            console.error('Create failed', res.status, body);
            const msg = (body && body.message) ? body.message : (typeof body === 'string' ? body : res.statusText || 'server error');
            alert('Gagal menyimpan transaksi: ' + msg);
            return;
          }
          const created = await res.json();
          setTransactions(prev => [...prev, created]);
          setForm({ no_kwitansi: '', diterima_dari: '', untuk_pembayaran: '', ket_pembayaran: '', nama_marketing: '', jumlah: '', terbilang: '', tanggal: '' });
          setErrors({});
          handleClose();
        } catch (err) {
          console.error(err);
          alert('Gagal menyimpan transaksi: ' + (err.message || err));
        }
      })();
    }
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      alert("Tidak ada data untuk di export");
      return;
    }

    // Prepare data for Excel with all fields
    const wsData = [
      ['ID', 'No Kwitansi', 'Diterima Dari', 'Untuk Pembayaran', 'Ket Pembayaran', 'Nama Marketing', 'Jumlah', 'Terbilang', 'Tanggal'],
      ...transactions.map(t => [
        t.id,
        t.no_kwitansi,
        t.diterima_dari,
        t.untuk_pembayaran,
        t.ket_pembayaran,
        t.nama_marketing,
        t.jumlah,
        t.terbilang,
        t.tanggal
      ])
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 5 },   // ID
      { wch: 15 },  // No Kwitansi
      { wch: 20 },  // Diterima Dari
      { wch: 20 },  // Untuk Pembayaran
      { wch: 20 },  // Ket Pembayaran
      { wch: 18 },  // Nama Marketing
      { wch: 15 },  // Jumlah
      { wch: 30 },  // Terbilang
      { wch: 12 }   // Tanggal
    ];

    // Download Excel file
    XLSX.writeFile(wb, `transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Trigger file input click
  const triggerImportClick = () => {
    if (fileInputRef && fileInputRef.current) fileInputRef.current.click();
  };

  // Parse and import Excel file
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      await handleImportExcel(file);
      // reset input so same file can be re-uploaded if needed
      e.target.value = '';
    } catch (err) {
      console.error(err);
      alert('Gagal mengimpor file Excel. Periksa format file.');
    }
  };

  const excelSerialToDate = (v) => {
    // Excel serialized date to JS Date
    try {
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString().slice(0,10);
    } catch(e){}
    return '';
  };

  const handleImportExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
      alert('File Excel kosong atau tidak berisi data.');
      return;
    }

    const newRecords = [];
    const errors = [];

    rows.forEach((r, idx) => {
      // normalize keys
      const norm = {};
      Object.keys(r).forEach(k => {
        const kk = k.toString().toLowerCase().replace(/\s|\.|_/g, '');
        norm[kk] = r[k];
      });

      const getVal = (candidates) => {
        for (const c of candidates) {
          if (norm[c] !== undefined && norm[c] !== null && String(norm[c]).trim() !== '') return norm[c];
        }
        return '';
      };

      const no_kw = getVal(['nokwitansi','nokwit','nokwitansi','nowkwitansi','no','no_kwitansi','no_kwitansi','no_kwitansi']);
      const diterima = getVal(['diterima','diterimadari','sudahditimadari','sudahditerima','nama','nama_penerima','nama penerima','penerima']);
      const tujuan = getVal(['untukpembayaran','untukpembayaran','pembayaran','tujuan','untuk_pembayaran']);
      const ket = getVal(['ketpembayaran','keterangan','keteranganpembayaran','ket','ket_pembayaran']);
      const marketing = getVal(['namamarketing','marketing','nama_marketing','nama marketing']);
      const jumlahRaw = getVal(['jumlah','amount','nominal']);
      const terbi = getVal(['terbilang']);
      const tanggalRaw = getVal(['tanggal','date']);

      const jumlahNum = jumlahRaw === '' ? 0 : parseFloat(String(jumlahRaw).toString().replace(/[^0-9.-]/g,''));
      let tanggal = '';
      if (tanggalRaw instanceof Date) tanggal = tanggalRaw.toISOString().slice(0,10);
      else if (typeof tanggalRaw === 'number') tanggal = excelSerialToDate(tanggalRaw);
      else if (String(tanggalRaw).trim() !== '') {
        const tryDate = new Date(tanggalRaw);
        tanggal = (tryDate instanceof Date && !isNaN(tryDate.getTime())) ? tryDate.toISOString().slice(0,10) : String(tanggalRaw);
      }

      // if no_kw is missing, auto-assign sequential kwitansi number
      let assignedNoKw = no_kw && String(no_kw).trim() !== '' ? String(no_kw) : String(transactions.length + newRecords.length + 1).padStart(3, '0');

      if (!diterima || !tujuan || !jumlahRaw) {
        errors.push(`Baris ${idx+2}: kolom wajib hilang (Diterima Dari, Untuk Pembayaran, Jumlah).`);
        return;
      }

      const terbilangFinal = terbi && String(terbi).trim() !== '' ? terbi : convertNumberToWords(jumlahNum);

      newRecords.push({
        id: transactions.length + newRecords.length + 1,
        no_kwitansi: assignedNoKw,
        diterima_dari: String(diterima),
        untuk_pembayaran: String(tujuan),
        ket_pembayaran: String(ket),
        nama_marketing: String(marketing),
        jumlah: isNaN(jumlahNum) ? 0 : jumlahNum,
        terbilang: terbilangFinal,
        tanggal: tanggal
      });
    });

    if (errors.length > 0) {
      alert('Terjadi beberapa kesalahan:\n' + errors.join('\n'));
    }

    if (newRecords.length > 0) {
      // Post each record to server so id and no_kwitansi are authoritative
      try {
        const created = await Promise.all(newRecords.map(async (nr) => {
          const payload = {
            no_kwitansi: nr.no_kwitansi && String(nr.no_kwitansi).trim() !== '' ? String(nr.no_kwitansi).trim() : undefined,
            diterima_dari: nr.diterima_dari,
            untuk_pembayaran: nr.untuk_pembayaran,
            ket_pembayaran: nr.ket_pembayaran,
            nama_marketing: nr.nama_marketing,
            jumlah: nr.jumlah,
            terbilang: nr.terbilang,
            tanggal: nr.tanggal
          };
          console.log('[Transactions] POST(import) to', `${API_BASE}/transactions`, payload);
          const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Failed to create imported transaction');
          return await res.json();
        }));
        setTransactions(prev => [...prev, ...created]);
        alert(`Berhasil mengimpor ${created.length} baris.`);
      } catch (err) {
        console.error('Import error:', err);
        alert('Gagal mengimpor beberapa/multi baris ke server. Periksa konsol.');
      }
    }
  };

  const handleDelete = (id) => {
    (async () => {
      try {
        console.log('[Transactions] DELETE to', `${API_BASE}/transactions/${id}`);
        const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        setTransactions(prev => prev.filter(t => String(t.id) !== String(id)));
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus transaksi');
      }
    })();
  };

  // No header search per user request; show all transactions
  const filteredTransactions = transactions;

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb className="d-none d-md-inline-block" listProps={{ className: "breadcrumb-dark breadcrumb-transparent" }}>
            <Breadcrumb.Item><FontAwesomeIcon icon={faHome} /></Breadcrumb.Item>
            <Breadcrumb.Item active>Transaksi</Breadcrumb.Item>
          </Breadcrumb>
          <h4>Transaksi</h4>
          <p className="mb-0">Kwitansi Pembayaran AQSO RESIDENCE.</p>
        </div>

        <div className="btn-toolbar mb-2 mb-md-0">
          <ButtonGroup>
            <Button variant="outline-primary" size="sm" onClick={handleOpen}>
              + Tambah data
            </Button>
            <Button variant="outline-primary" size="sm" onClick={triggerImportClick} style={{marginLeft:8}}>
              📤 Import Excel
            </Button>
            <Button variant="outline-primary" size="sm" onClick={handleExport} style={{marginLeft:8}}>
              📥 Export data
            </Button>
          </ButtonGroup>
          {/* hidden file input for excel import */}
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
      </div>

      {/* Table settings / controls (search removed as requested) */}
      <div className="table-settings mb-4">
        <Row className="justify-content-between align-items-center">
          <Col />
          <Col xs="auto" className="ps-md-0 text-end">
            <Dropdown>
              <Dropdown.Toggle as={ButtonGroup} variant="link" className="text-dark m-0 p-0">
                <span className="icon icon-sm icon-gray">
                  <FontAwesomeIcon icon={faCog} />
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu-xs dropdown-menu-right">
                <Dropdown.Item className="fw-bold text-dark">Show</Dropdown.Item>
                <Dropdown.Item className="d-flex fw-bold">10 <span className="icon icon-small ms-auto"><FontAwesomeIcon icon={faCheck} /></span></Dropdown.Item>
                <Dropdown.Item className="fw-bold">20</Dropdown.Item>
                <Dropdown.Item className="fw-bold">30</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      </div>

      {/* TABLE */}
      <Card>
        <Table responsive className="table-centered table-nowrap rounded-top mb-0">
          <thead className="thead-light">
            <tr>
              <th className="border-bottom">#</th>
              <th className="border-bottom">No Kwitansi</th>
              <th className="border-bottom">Diterima Dari</th>
              <th className="border-bottom">Untuk Pembayaran</th>
              <th className="border-bottom">Ket Pembayaran</th>
              <th className="border-bottom">Nama Marketing</th>
              <th className="border-bottom">Jumlah</th>
              <th className="border-bottom">Terbilang</th>
              <th className="border-bottom">Tanggal</th>
              <th className="border-bottom">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td><strong>{transaction.no_kwitansi}</strong></td>
                  <td>{transaction.diterima_dari}</td>
                  <td>{transaction.untuk_pembayaran}</td>
                  <td>{transaction.ket_pembayaran}</td>
                  <td>{transaction.nama_marketing}</td>
                  <td><strong>Rp {transaction.jumlah.toLocaleString('id-ID')}</strong></td>
                  <td>{transaction.terbilang}</td>
                  <td>{transaction.tanggal}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="info" 
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handlePrint(transaction)}
                        title="Print Kwitansi"
                      >
                        🖨️
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  <p className="text-muted">Tidak ada data transaksi</p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* MODAL TAMBAH/EDIT DATA */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Edit Transaksi" : "Tambah Transaksi Baru"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger">
              <strong>Terjadi Kesalahan:</strong>
              <ul className="mb-0 mt-2">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>No Kwitansi <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="no_kwitansi" 
                    value={form.no_kwitansi}
                    onChange={handleChange}
                    isInvalid={!!errors.no_kwitansi}
                    placeholder="Masukkan nomor kwitansi"
                  />
                  {errors.no_kwitansi && <Form.Control.Feedback type="invalid">{errors.no_kwitansi}</Form.Control.Feedback>}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="tanggal" 
                    type="date"
                    value={form.tanggal}
                    onChange={handleChange}
                    isInvalid={!!errors.tanggal}
                  />
                  {errors.tanggal && <Form.Control.Feedback type="invalid">{errors.tanggal}</Form.Control.Feedback>}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sudah Diterima Dari <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="diterima_dari" 
                    value={form.diterima_dari}
                    onChange={handleChange}
                    isInvalid={!!errors.diterima_dari}
                    placeholder="Nama penerima"
                  />
                  {errors.diterima_dari && <Form.Control.Feedback type="invalid">{errors.diterima_dari}</Form.Control.Feedback>}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Marketing</Form.Label>
                  <Form.Control 
                    name="nama_marketing" 
                    value={form.nama_marketing}
                    onChange={handleChange}
                    placeholder="Nama marketing"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Untuk Pembayaran <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="untuk_pembayaran"
                    value={form.untuk_pembayaran}
                    onChange={handleChange}
                    isInvalid={!!errors.untuk_pembayaran}
                    placeholder="Ketik atau pilih dari dropdown"
                    list="pembayaran-options"
                  />
                  <datalist id="pembayaran-options">
                    <option value="Pemesanan Rumah" />
                    <option value="Pemesanan Ruko" />
                    <option value="Tanda Jadi" />
                    <option value="Uang Muka" />
                    <option value="Lain-lain" />
                  </datalist>
                  {errors.untuk_pembayaran && <Form.Control.Feedback type="invalid">{errors.untuk_pembayaran}</Form.Control.Feedback>}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Jumlah <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="jumlah" 
                    type="number"
                    value={form.jumlah}
                    onChange={handleChange}
                    isInvalid={!!errors.jumlah}
                    placeholder="0"
                    step="0.01"
                  />
                  {errors.jumlah && <Form.Control.Feedback type="invalid">{errors.jumlah}</Form.Control.Feedback>}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Keterangan Pembayaran</Form.Label>
              <Form.Select
                name="ket_pembayaran"
                value={form.ket_pembayaran}
                onChange={handleChange}
              >
                <option value="">Pilih...</option>
                <option value="Tunai">Tunai</option>
                <option value="Cek">Cek</option>
                <option value="Giro">Giro (No.)</option>
                <option value="Bank">Bank</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Terbilang</Form.Label>
              <Form.Control 
                name="terbilang" 
                value={form.terbilang}
                onChange={handleChange}
                as="textarea"
                rows={2}
                placeholder="Jumlah dalam bentuk tulisan"
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingId ? "Update Transaksi" : "Simpan Transaksi"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL PRINT KWITANSI */}
      <Modal show={showPrintModal} onHide={handleClosePrint} size="lg" className="print-modal">
        <Modal.Header closeButton>
          <Modal.Title>Print Kwitansi</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', background: 'transparent' }}>
          {selectedTransaction && (
            <div
              id="printContent"
              style={{
                fontFamily: 'Arial, sans-serif',
                margin: 0,
                padding: 0,
                width: '21cm',
                minHeight: '8.5cm',
                background: 'transparent',
                display: 'block',
                position: 'relative',
                left: 0,
                top: 0
              }}
            >
              <div
                id="printContent-inner"
                style={{
                  width: '21cm',
                  minHeight: '8cm',
                  margin: 0,
                  padding: 0,
                  background: '#fff',
                  border: '1.2px solid #0f62fe',
                  borderRadius: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* accents background bisa tipis */}
                <div style={{ position: 'absolute', top: -55, left: -55, width: 270, height: 120, background: 'rgba(0,150,255,0.09)', transform: 'rotate(-15deg)' }} />
                <div style={{ position: 'absolute', bottom: -120, right: -30, width: 180, height: 160, background: 'rgba(15,98,254,0.08)', borderRadius: '70%' }} />

                <div style={{ position: 'relative', zIndex: 2, padding: '16px 30px 15px 24px', height: '100%' }}>
                  {/* header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, minWidth: 140 }}>
                      <div style={{ marginBottom: 2 }}>No. Kwitansi :</div>
                      <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1.1 }}>{selectedTransaction.no_kwitansi || '-'}</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: 7, marginBottom: 1 }}>KWITANSI</div>
                      <div style={{ fontSize: 10, marginTop: 1, letterSpacing: 5 }}>AQSO RESIDENCE</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 110 }}>
                      <img 
                        src={LogoAQSO} 
                        alt="AQSO RESIDENCE" 
                        style={{ width: 43, height: 43, marginRight: '4px' }} 
                      />
                    </div>
                  </div>

                  {/* body kwitansi, semua field vertikal atas-bawah */}
                  <div style={{ marginTop: 14, border: '1.4px solid #0f62fe', borderRadius: 7, padding: '11px 4px 13px 9px', background: '#f5faff', width: '100%', maxWidth: '100%' }}>
                    {[
                      { label: 'SUDAH TERIMA DARI', value: selectedTransaction.diterima_dari || '-' },
                      { label: 'UNTUK PEMBAYARAN', value: selectedTransaction.untuk_pembayaran || '-' },
                      { label: 'KET. PEMBAYARAN', value: selectedTransaction.ket_pembayaran || '-' },
                      { label: 'NAMA MARKETING', value: selectedTransaction.nama_marketing || '-' },
                      { label: 'JUMLAH', value: `Rp ${selectedTransaction.jumlah?.toLocaleString('id-ID')}` },
                      { label: 'TERBILANG', value: selectedTransaction.terbilang || '-' },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          borderBottom: idx === 5 ? 'none' : '1px solid #d7e7ff',
                          fontSize: row.label === 'JUMLAH' ? 13 : 11,
                          minHeight: 23,
                          padding: '4px 0',
                        }}
                      >
                        <div style={{ width: 150, fontWeight: 600 }}>{row.label}</div>
                        <div style={{ width: 13, fontWeight: 600 }}>:</div>
                        <div style={{ flex: 1, fontWeight: row.label === 'JUMLAH' ? 700 : 500, minWidth: 120 }}>{row.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* footer */}
                  <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: 10, color: '#123054', flex: 1.5, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2, fontSize: 10.6 }}>Catatan:</div>
                      <div style={{ marginBottom: 2 }}>- Rekening Pembayaran PT. Bank .........................................................</div>
                      <div style={{ marginBottom: 2 }}>- Sertakan Foto Bukti Transfer, Nama Customer, Blok Pembayaran / Angsuran</div>
                      <div>- UTJ berlaku maksimal 10 hari dari tanggal kwitansi ini</div>
                    </div>
                    <div style={{ textAlign: 'center', width: 134, marginLeft: 13 }}>
                      <div style={{ fontSize: 10, marginBottom: 6 }}>................................/......../20......</div>
                      <div style={{ borderTop: '1px solid #222', fontSize: 10, paddingTop: 0, marginTop: 0, marginBottom: 0 }}>Marketing / Penerima</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        {!showPrintButtons && (
          <Modal.Footer>
            <Button 
              variant="success"
              onClick={handleDownloadWord}
              disabled={!selectedTransaction}
            >
              ⬇️ Unduh Word
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setShowPrintButtons(true)}
            >
              Siap Print
            </Button>
            <Button variant="secondary" onClick={handleClosePrint}>
              Batal
            </Button>
          </Modal.Footer>
        )}

        {showPrintButtons && (
          <Modal.Footer>
            <Button 
              variant="success"
              onClick={handleDownloadWord}
              disabled={!selectedTransaction}
            >
              ⬇️ Unduh Word
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                window.print();
              }}
            >
              🖨️ Print Sekarang
            </Button>
            <Button variant="secondary" onClick={handleClosePrint}>
              Tutup
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
};