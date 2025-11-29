import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faTrash, faEdit, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Form, Button, ButtonGroup, Breadcrumb, Dropdown, Modal, Table, Card, Alert } from '@themesberg/react-bootstrap';
import * as XLSX from 'xlsx';

const printStyles = `@media print { * { visibility: hidden; } #printContent, #printContent * { visibility: visible; } #printContent { position: absolute; left: 0; top: 0; width: 100%; } body { margin: 0; padding: 0; } } @page { margin: 0.5cm; size: A4; }`;

export default () => {
  const API_BASE = 'http://localhost:4000/api';

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fileInputRef = useRef(null);
  const [kavlings, setKavlings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    nama: '',
    no_kk: '',
    no_nik: '',
    ukuran_kavling: '',
    tanggal_pembayaran: new Date().toISOString().slice(0,10),
    pembayaran_dp: '',
    pembayaran_cicilan: [] // Array untuk pembayaran 1, 2, 3, dst
  });

  // Helper functions untuk localStorage
  const getKavlingsFromStorage = () => {
    try {
      const stored = localStorage.getItem('kavlings_data');
      if (!stored) return [];
      const data = JSON.parse(stored);
      // Pastikan pembayaran_cicilan adalah array
      return data.map(item => ({
        ...item,
        pembayaran_cicilan: Array.isArray(item.pembayaran_cicilan) 
          ? item.pembayaran_cicilan 
          : (item.pembayaran_cicilan ? [item.pembayaran_cicilan] : [])
      }));
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return [];
    }
  };

  const saveKavlingsToStorage = (data) => {
    try {
      localStorage.setItem('kavlings_data', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  };

  useEffect(() => {
    const fetchKavlings = async () => {
      try {
        const res = await fetch(`${API_BASE}/kavlings`);
        if (!res.ok) throw new Error('Failed to fetch kavlings');
        const data = await res.json();
        const kavlingsData = Array.isArray(data) ? data : [];
        setKavlings(kavlingsData);
        // Sync ke localStorage
        saveKavlingsToStorage(kavlingsData);
      } catch (err) {
        console.error('Error fetching kavlings from API, using localStorage:', err);
        // Fallback ke localStorage
        const localData = getKavlingsFromStorage();
        setKavlings(localData);
      }
    };
    fetchKavlings();
  }, []);

  const handleOpen = () => {
    setEditingId(null);
    setForm({ 
      nama: '',
      no_kk: '',
      no_nik: '',
      ukuran_kavling: '',
      tanggal_pembayaran: new Date().toISOString().slice(0,10),
      pembayaran_dp: '',
      pembayaran_cicilan: []
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (k) => {
    setEditingId(k.id);
    // Pastikan pembayaran_cicilan adalah array dan konversi ke string untuk form
    let cicilanArray = [];
    if (Array.isArray(k.pembayaran_cicilan)) {
      cicilanArray = k.pembayaran_cicilan.map(c => String(c || ''));
    } else if (k.pembayaran_cicilan) {
      cicilanArray = [String(k.pembayaran_cicilan)];
    }
    
    setForm({
      nama: k.nama || '',
      no_kk: k.no_kk || '',
      no_nik: k.no_nik || '',
      ukuran_kavling: k.ukuran_kavling || '',
      tanggal_pembayaran: k.tanggal_pembayaran || new Date().toISOString().slice(0,10),
      pembayaran_dp: k.pembayaran_dp != null ? String(k.pembayaran_dp) : '',
      pembayaran_cicilan: cicilanArray
    });
    setErrors({});
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingId(null);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCicilanChange = (index, value) => {
    const newCicilan = [...form.pembayaran_cicilan];
    newCicilan[index] = value;
    setForm(prev => ({ ...prev, pembayaran_cicilan: newCicilan }));
  };

  const addCicilan = () => {
    setForm(prev => ({ ...prev, pembayaran_cicilan: [...prev.pembayaran_cicilan, ''] }));
  };

  const removeCicilan = (index) => {
    const newCicilan = form.pembayaran_cicilan.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, pembayaran_cicilan: newCicilan }));
  };

  const validate = () => {
    const err = {};
    if (!form.nama || String(form.nama).trim() === '') err.nama = 'Nama wajib diisi';
    if (!form.ukuran_kavling || String(form.ukuran_kavling).trim() === '') err.ukuran_kavling = 'Ukuran Kavling wajib diisi';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      nama: form.nama,
      no_kk: form.no_kk,
      no_nik: form.no_nik,
      ukuran_kavling: form.ukuran_kavling,
      tanggal_pembayaran: form.tanggal_pembayaran,
      pembayaran_dp: form.pembayaran_dp ? parseFloat(form.pembayaran_dp) : 0,
      pembayaran_cicilan: form.pembayaran_cicilan
        .map(c => {
          const val = String(c || '').trim();
          return val ? parseFloat(val) : null;
        })
        .filter(c => c !== null && c > 0)
    };

    try {
      if (editingId) {
        // Try API first
        try {
          const res = await fetch(`${API_BASE}/kavlings/${editingId}`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const updated = await res.json();
            const newKavlings = kavlings.map(p => String(p.id) === String(updated.id) ? updated : p);
            setKavlings(newKavlings);
            saveKavlingsToStorage(newKavlings);
            handleClose();
            return;
          }
        } catch (apiErr) {
          console.log('API update failed, using localStorage:', apiErr);
        }
        
        // Fallback: Update di localStorage
        const updated = { ...payload, id: editingId };
        const newKavlings = kavlings.map(p => String(p.id) === String(editingId) ? updated : p);
        setKavlings(newKavlings);
        saveKavlingsToStorage(newKavlings);
        alert('Data berhasil diupdate (disimpan secara lokal)');
      } else {
        // Try API first
        try {
          const res = await fetch(`${API_BASE}/kavlings`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const created = await res.json();
            const newKavlings = [...kavlings, created];
            setKavlings(newKavlings);
            saveKavlingsToStorage(newKavlings);
            handleClose();
            return;
          }
        } catch (apiErr) {
          console.log('API create failed, using localStorage:', apiErr);
        }
        
        // Fallback: Create di localStorage
        const maxId = kavlings.length > 0 ? Math.max(...kavlings.map(k => k.id || 0)) : 0;
        const newId = maxId + 1;
        const created = { ...payload, id: newId };
        const newKavlings = [...kavlings, created];
        setKavlings(newKavlings);
        saveKavlingsToStorage(newKavlings);
        alert('Data berhasil disimpan (disimpan secara lokal)');
      }
      handleClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data kavling?')) return;
    try {
      // Try API first
      try {
        const res = await fetch(`${API_BASE}/kavlings/${id}`, { method: 'DELETE' });
        if (res.ok) {
          const newKavlings = kavlings.filter(k => String(k.id) !== String(id));
          setKavlings(newKavlings);
          saveKavlingsToStorage(newKavlings);
          return;
        }
      } catch (apiErr) {
        console.log('API delete failed, using localStorage:', apiErr);
      }
      
      // Fallback: Delete dari localStorage
      const newKavlings = kavlings.filter(k => String(k.id) !== String(id));
      setKavlings(newKavlings);
      saveKavlingsToStorage(newKavlings);
      alert('Data berhasil dihapus (dari penyimpanan lokal)');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data');
    }
  };

  const triggerImportClick = () => { 
    if (fileInputRef && fileInputRef.current) fileInputRef.current.click(); 
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return; 
    try { 
      await handleImportExcel(file); 
      e.target.value = ''; 
    } catch (err) { 
      console.error(err); 
      alert('Gagal mengimpor file'); 
    }
  };

  const handleImportExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows || rows.length === 0) { alert('File kosong'); return; }

    const newRecords = [];
    rows.forEach((r) => {
      const norm = {};
      Object.keys(r).forEach(k => { norm[k.toString().toLowerCase().replace(/\s|\.|_/g, '')] = r[k]; });
      const get = (cands) => { for (const c of cands) if (norm[c] !== undefined && String(norm[c]).trim() !== '') return norm[c]; return ''; };
      
      const nama = get(['nama','name']);
      const no_kk = get(['nokk','no_kk','nokartukeluarga','kk']);
      const no_nik = get(['nonik','no_nik','nik','noktp']);
      const ukuran_kavling = get(['ukurankavling','ukuran_kavling','ukuran','size']);
      const tanggal_pembayaran = get(['tanggalpembayaran','tanggal_pembayaran','tanggal','date']) || new Date().toISOString().slice(0,10);
      const pembayaran_dp = get(['pembayarandp','pembayaran_dp','dp','downpayment']);
      
      // Ambil pembayaran cicilan (pembayaran1, pembayaran2, dst)
      const cicilan = [];
      let i = 1;
      while (true) {
        const cicilanKey = get([`pembayaran${i}`, `cicilan${i}`, `angsur${i}`]);
        if (!cicilanKey) break;
        cicilan.push(cicilanKey);
        i++;
      }

      if (!nama || !ukuran_kavling) {
        return;
      }
      
      newRecords.push({ 
        nama, 
        no_kk, 
        no_nik, 
        ukuran_kavling, 
        tanggal_pembayaran, 
        pembayaran_dp: pembayaran_dp ? parseFloat(String(pembayaran_dp).replace(/[^0-9.-]/g,'')) : 0,
        pembayaran_cicilan: cicilan.map(c => parseFloat(String(c).replace(/[^0-9.-]/g,'')) || 0).filter(c => c > 0)
      });
    });

    if (newRecords.length === 0) { alert('Tidak ada baris valid untuk diimpor'); return; }

    try {
      const created = await Promise.all(newRecords.map(async nr => {
        const res = await fetch(`${API_BASE}/kavlings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nr) });
        if (!res.ok) throw new Error('Create failed');
        return await res.json();
      }));
      setKavlings(prev => [...prev, ...created]);
      alert(`Berhasil mengimpor ${created.length} baris.`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengimpor beberapa baris');
    }
  };

  const handleExport = () => {
    if (!kavlings || kavlings.length === 0) { alert('Tidak ada data untuk diexport'); return; }
    
    // Cari jumlah maksimal cicilan
    const maxCicilan = Math.max(...kavlings.map(k => Array.isArray(k.pembayaran_cicilan) ? k.pembayaran_cicilan.length : 0));
    
    // Buat header
    const headers = ['No', 'Nama', 'No KK', 'No NIK', 'Ukuran Kavling', 'Tanggal Pembayaran', 'Pembayaran DP'];
    for (let i = 1; i <= maxCicilan; i++) {
      headers.push(`Pembayaran ${i}`);
    }
    
    const wsData = [headers];
    
    kavlings.forEach((k, idx) => {
      const row = [
        idx + 1,
        k.nama || '',
        k.no_kk || '',
        k.no_nik || '',
        k.ukuran_kavling || '',
        k.tanggal_pembayaran || '',
        k.pembayaran_dp || 0
      ];
      
      const cicilan = Array.isArray(k.pembayaran_cicilan) ? k.pembayaran_cicilan : [];
      for (let i = 0; i < maxCicilan; i++) {
        row.push(cicilan[i] || 0);
      }
      
      wsData.push(row);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, 'Data Kavling'); 
    ws['!cols'] = [
      {wch:5}, {wch:20}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15},
      ...Array(maxCicilan).fill({wch:15})
    ]; 
    XLSX.writeFile(wb, `data_kavling_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Hitung jumlah maksimal cicilan untuk menentukan kolom
  const maxCicilan = kavlings.length > 0 
    ? Math.max(...kavlings.map(k => Array.isArray(k.pembayaran_cicilan) ? k.pembayaran_cicilan.length : 0))
    : 0;

  const filtered = kavlings;

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb className="d-none d-md-inline-block" listProps={{ className: "breadcrumb-dark breadcrumb-transparent" }}>
            <Breadcrumb.Item>Tables</Breadcrumb.Item>
            <Breadcrumb.Item active>Data Kavling</Breadcrumb.Item>
          </Breadcrumb>
          <h4>Data Kavling</h4>
          <p className="mb-0">Daftar data kavling dengan informasi pembayaran.</p>
        </div>

        <div className="btn-toolbar mb-2 mb-md-0">
          <ButtonGroup>
            <Button variant="outline-primary" size="sm" onClick={handleOpen}>+ Tambah data</Button>
            <Button variant="outline-primary" size="sm" onClick={triggerImportClick} style={{marginLeft:8}}>📤 Import Excel</Button>
            <Button variant="outline-primary" size="sm" onClick={handleExport} style={{marginLeft:8}}>📥 Export data</Button>
          </ButtonGroup>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
      </div>

      <div className="table-settings mb-4">
        <Row className="justify-content-between align-items-center">
          <Col />
          <Col xs="auto" className="ps-md-0 text-end">
            <Dropdown>
              <Dropdown.Toggle as={ButtonGroup} variant="link" className="text-dark m-0 p-0">
                <span className="icon icon-sm icon-gray"><FontAwesomeIcon icon={faCog} /></span>
              </Dropdown.Toggle>
            </Dropdown>
          </Col>
        </Row>
      </div>

      <Card>
        <div className="table-responsive">
          <Table responsive className="table-centered table-nowrap rounded-top mb-0">
            <thead className="thead-light">
              <tr>
                <th className="border-bottom">No</th>
                <th className="border-bottom">Nama</th>
                <th className="border-bottom">No KK</th>
                <th className="border-bottom">No NIK</th>
                <th className="border-bottom">Ukuran Kavling</th>
                <th className="border-bottom">Tanggal Pembayaran</th>
                <th className="border-bottom">Pembayaran DP</th>
                {Array.from({ length: maxCicilan }, (_, i) => (
                  <th key={i} className="border-bottom">Pembayaran {i + 1}</th>
                ))}
                <th className="border-bottom">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered && filtered.length > 0 ? filtered.map((k, idx) => {
                const cicilan = Array.isArray(k.pembayaran_cicilan) ? k.pembayaran_cicilan : [];
                return (
                  <tr key={k.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{k.nama || '-'}</strong></td>
                    <td>{k.no_kk || '-'}</td>
                    <td>{k.no_nik || '-'}</td>
                    <td>{k.ukuran_kavling || '-'}</td>
                    <td>{k.tanggal_pembayaran || '-'}</td>
                    <td><strong>Rp {k.pembayaran_dp != null ? Number(k.pembayaran_dp).toLocaleString('id-ID') : 0}</strong></td>
                    {Array.from({ length: maxCicilan }, (_, i) => (
                      <td key={i}>
                        {cicilan[i] ? <strong>Rp {Number(cicilan[i]).toLocaleString('id-ID')}</strong> : '-'}
                      </td>
                    ))}
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="info" size="sm" onClick={() => handleEdit(k)} title="Edit"><FontAwesomeIcon icon={faEdit} /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(k.id)} title="Delete"><FontAwesomeIcon icon={faTrash} /></Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8 + maxCicilan} className="text-center py-4"><p className="text-muted">Tidak ada data</p></td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Data Kavling' : 'Tambah Data Kavling Baru'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger"><strong>Terjadi Kesalahan:</strong><ul className="mb-0 mt-2">{Object.entries(errors).map(([f,m]) => <li key={f}>{m}</li>)}</ul></Alert>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama <span className="text-danger">*</span></Form.Label>
                  <Form.Control name="nama" value={form.nama} onChange={handleChange} isInvalid={!!errors.nama} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>No KK</Form.Label>
                  <Form.Control name="no_kk" value={form.no_kk} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>No NIK</Form.Label>
                  <Form.Control name="no_nik" value={form.no_nik} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ukuran Kavling <span className="text-danger">*</span></Form.Label>
                  <Form.Control name="ukuran_kavling" value={form.ukuran_kavling} onChange={handleChange} isInvalid={!!errors.ukuran_kavling} placeholder="Contoh: 5x10, 6x12, dll" />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal Pembayaran</Form.Label>
                  <Form.Control name="tanggal_pembayaran" type="date" value={form.tanggal_pembayaran} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pembayaran DP</Form.Label>
                  <Form.Control name="pembayaran_dp" type="number" value={form.pembayaran_dp} onChange={handleChange} placeholder="0" />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Pembayaran Cicilan</Form.Label>
                <Button variant="outline-primary" size="sm" onClick={addCicilan}>
                  <FontAwesomeIcon icon={faPlus} className="me-1" /> Tambah Cicilan
                </Button>
              </div>
              {form.pembayaran_cicilan.map((cicilan, index) => (
                <Row key={index} className="mb-2">
                  <Col md={10}>
                    <Form.Control
                      type="number"
                      value={cicilan}
                      onChange={(e) => handleCicilanChange(index, e.target.value)}
                      placeholder={`Pembayaran ${index + 1}`}
                    />
                  </Col>
                  <Col md={2}>
                    <Button variant="outline-danger" size="sm" onClick={() => removeCicilan(index)}>
                      <FontAwesomeIcon icon={faMinus} />
                    </Button>
                  </Col>
                </Row>
              ))}
              {form.pembayaran_cicilan.length === 0 && (
                <p className="text-muted small">Belum ada pembayaran cicilan. Klik "Tambah Cicilan" untuk menambahkan.</p>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit}>{editingId ? 'Update' : 'Simpan'}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
