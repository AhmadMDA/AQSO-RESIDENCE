import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCog, faHome, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Form, Button, ButtonGroup, Breadcrumb, Dropdown, Modal, Table, Card, Alert } from '@themesberg/react-bootstrap';
import * as XLSX from 'xlsx';

// CSS untuk print
const printStyles = `
  @media print {
    * {
      visibility: hidden;
    }
    #printContent,
    #printContent * {
      visibility: visible;
    }
    #printContent {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    body {
      margin: 0;
      padding: 0;
    }
  }
  @page {
    margin: 0.5cm;
    size: A4;
  }
`;

export default () => {
  // Use explicit backend URL for API calls during local development.
  // If you deploy and need a different backend, set REACT_APP_API_BASE at build time.
  const API_BASE = 'http://localhost:4000/api';
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
            <Button variant="outline-secondary" size="sm" onClick={triggerImportClick} style={{marginLeft:8}}>
              📤 Import Excel
            </Button>
            <Button variant="outline-primary" size="sm" onClick={handleExport}>
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
                  <Form.Select
                    name="untuk_pembayaran"
                    value={form.untuk_pembayaran}
                    onChange={handleChange}
                    isInvalid={!!errors.untuk_pembayaran}
                  >
                    <option value="">Pilih...</option>
                    <option value="Pemesanan Rumah">Pemesanan Rumah</option>
                    <option value="Pemesanan Ruko">Pemesanan Ruko</option>
                    <option value="Tanda Jadi">Tanda Jadi</option>
                    <option value="Uang Muka">Uang Muka</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </Form.Select>
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
      <Modal show={showPrintModal} onHide={handleClosePrint} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Print Kwitansi</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedTransaction && (
            <div id="printContent" style={{ background: '#fff', fontFamily: 'Arial, sans-serif', color: '#111', padding: 0 }}>
              {/* Header with diagonal gradients and logo */}
              <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: '-10%', top: '-30%', width: '60%', height: 300, background: 'linear-gradient(120deg,#06b6d4 0%,#2563eb 50%, #7c3aed 100%)', transform: 'skewX(-20deg)' }} />
                <div style={{ position: 'absolute', left: -40, top: -10, width: 220, height: 220, background: 'linear-gradient(90deg,#07b3d6,#4f46e5)', opacity: 0.25, transform: 'rotate(-12deg)' }} />
                <div style={{ position: 'absolute', right: 18, top: 12, width: 110, height: 110, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                  {/* Replace with actual logo image path if available */}
                  <div style={{ width: 88, height: 88, borderRadius: 6, background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>LOGO</div>
                </div>
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', paddingTop: 18 }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#0b2b4a', letterSpacing: 2 }}>KWITANSI</div>
                  <div style={{ fontSize: 12, color: '#0b2b4a', marginTop: 6 }}>AQSO RESIDENCE</div>
                </div>
              </div>

              {/* Main body: left labels and right values with borders */}
              <div style={{ display: 'flex', padding: '18px 28px 8px 28px', gap: 20 }}>
                <div style={{ width: '34%', paddingTop: 6 }}>
                  <div style={{ padding: '6px 0' }}><strong>No. Kwitansi :</strong></div>
                  <div style={{ padding: '12px 0' }}><strong>SUDAH TERIMA DARI</strong></div>
                  <div style={{ padding: '12px 0' }}><strong>UNTUK PEMBAYARAN</strong></div>
                  <div style={{ padding: '12px 0' }}><strong>KET. PEMBAYARAN</strong></div>
                  <div style={{ padding: '12px 0' }}><strong>NAMA MARKETING</strong></div>
                  <div style={{ padding: '12px 0' }}><strong>JUMLAH</strong></div>
                  <div style={{ padding: '12px 0' }}><strong>TERBILANG</strong></div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ padding: '6px 10px', marginBottom: 6 }}>
                    <span style={{ display: 'inline-block', width: '100%' }}>: {selectedTransaction.no_kwitansi}</span>
                  </div>

                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #cfcfcf', marginBottom: 8 }}>{selectedTransaction.diterima_dari}</div>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #cfcfcf', marginBottom: 8 }}>{selectedTransaction.untuk_pembayaran}</div>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #cfcfcf', marginBottom: 8 }}>{selectedTransaction.ket_pembayaran}</div>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #cfcfcf', marginBottom: 8 }}>{selectedTransaction.nama_marketing}</div>

                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #cfcfcf', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div />
                    <div style={{ fontWeight: 800 }}>Rp {selectedTransaction.jumlah.toLocaleString('id-ID')}</div>
                  </div>

                  <div style={{ padding: '8px 10px', fontStyle: 'italic' }}>{selectedTransaction.terbilang}</div>
                </div>
              </div>

              {/* Signatures and footer notes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 28px 28px 28px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 60 }} />
                  <div>__________________________</div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>( Tanda Tangan )</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 60 }} />
                  <div>__________________________</div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>( Penerima )</div>
                </div>
              </div>

              <div style={{ padding: '0 28px 28px 28px', fontSize: 11, color: '#444' }}>
                <div style={{ marginBottom: 6 }}><strong>Catatan</strong></div>
                <ul style={{ marginTop: 6, marginLeft: 18 }}>
                  <li>Rekening Pembayaran PT. Bank</li>
                  <li>Sertakan Foto Bukti Transfer, Nama Customer, Blok Pembayaran/ Angsuran</li>
                  <li>UTJ berlaku maksimal 10 Hari dari tanggal Kwitansi ini</li>
                </ul>
              </div>
            </div>
          )}
        </Modal.Body>

        {!showPrintButtons && (
          <Modal.Footer>
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
              variant="primary" 
              onClick={() => {
                window.print();
              }}
            >
              🖨️ Print
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