import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Form, Button, ButtonGroup, Breadcrumb, Dropdown, Modal, Table, Card, Alert } from '@themesberg/react-bootstrap';
import * as XLSX from 'xlsx';

const printStyles = `@media print { * { visibility: hidden; } #printContent, #printContent * { visibility: visible; } #printContent { position: absolute; left: 0; top: 0; width: 100%; } body { margin: 0; padding: 0; } } @page { margin: 0.5cm; size: A4; }`;

const STORAGE_KEY = 'kas_data';
const API_BASE = 'http://localhost:4000/api';

const readLocalKas = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to parse local kas data', err);
    return [];
  }
};

const saveLocalKas = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save kas data locally', err);
  }
};

export default () => {
  const fileInputRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    nama: '',
    ketTidakMasuk: '',
    uangMasuk: '',
    ketBelanja: '',
    harga: '',
    sisaUang: ''
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const fetchKas = async () => {
      try {
        const res = await fetch(`${API_BASE}/kas`);
        if (!res.ok) throw new Error('Failed to fetch kas');
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : [];
        setEntries(safeData);
        saveLocalKas(safeData);
      } catch (err) {
        console.warn('Falling back to local kas data', err);
        setEntries(readLocalKas());
      }
    };
    fetchKas();
  }, []);

  const resetForm = () => {
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      nama: '',
      ketTidakMasuk: '',
      uangMasuk: '',
      ketBelanja: '',
      harga: '',
      sisaUang: ''
    });
    setErrors({});
  };

  const handleOpen = () => {
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      tanggal: entry.tanggal || new Date().toISOString().slice(0, 10),
      nama: entry.nama || '',
      ketTidakMasuk: entry.ketTidakMasuk || '',
      uangMasuk: entry.uangMasuk != null ? String(entry.uangMasuk) : '',
      ketBelanja: entry.ketBelanja || '',
      harga: entry.harga != null ? String(entry.harga) : '',
      sisaUang: entry.sisaUang != null ? String(entry.sisaUang) : ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingId(null);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const err = {};
    if (!form.tanggal) err.tanggal = 'Tanggal wajib diisi';
    if (!form.nama || !form.nama.trim()) err.nama = 'Nama wajib diisi';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const buildPayload = () => ({
    tanggal: form.tanggal,
    nama: form.nama,
    ketTidakMasuk: form.ketTidakMasuk,
    uangMasuk: form.uangMasuk ? parseFloat(form.uangMasuk) : 0,
    ketBelanja: form.ketBelanja,
    harga: form.harga ? parseFloat(form.harga) : 0,
    sisaUang: form.sisaUang ? parseFloat(form.sisaUang) : 0
  });

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = buildPayload();

    const updateState = (nextEntries, message) => {
      setEntries(nextEntries);
      saveLocalKas(nextEntries);
      if (message) alert(message);
      handleClose();
    };

    if (editingId) {
      try {
        const res = await fetch(`${API_BASE}/kas/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          updateState(entries.map(item => String(item.id) === String(updated.id) ? updated : item));
          return;
        }
      } catch (err) {
        console.warn('API update kas failed, using local storage', err);
      }
      const localUpdated = { ...payload, id: editingId };
      updateState(entries.map(item => String(item.id) === String(editingId) ? localUpdated : item), 'Data kas diperbarui secara lokal.');
    } else {
      try {
        const res = await fetch(`${API_BASE}/kas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          updateState([...entries, created]);
          return;
        }
      } catch (err) {
        console.warn('API create kas failed, using local storage', err);
      }
      const maxId = entries.length ? Math.max(...entries.map(e => Number(e.id) || 0)) : 0;
      const localCreated = { ...payload, id: maxId + 1 };
      updateState([...entries, localCreated], 'Data kas tersimpan secara lokal.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data kas ini?')) return;

    const updateState = (nextEntries, message) => {
      setEntries(nextEntries);
      saveLocalKas(nextEntries);
      if (message) alert(message);
    };

    try {
      const res = await fetch(`${API_BASE}/kas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        updateState(entries.filter(item => String(item.id) !== String(id)));
        return;
      }
    } catch (err) {
      console.warn('API delete kas failed, using local storage', err);
    }
    updateState(entries.filter(item => String(item.id) !== String(id)), 'Data kas dihapus secara lokal.');
  };

  const triggerImport = () => fileInputRef.current && fileInputRef.current.click();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleImportExcel(file);
    } finally {
      e.target.value = '';
    }
  };

  const handleImportExcel = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) {
      alert('File kosong');
      return;
    }

    const newRecords = rows.map((row, idx) => ({
      id: entries.length + idx + 1,
      tanggal: row.tanggal || row.Tanggal || new Date().toISOString().slice(0, 10),
      nama: row.nama || row.Nama || '',
      ketTidakMasuk: row['keterangan tidak masuk'] || row.ketTidakMasuk || '',
      uangMasuk: row['uang masuk'] || row.uangMasuk ? Number(String(row['uang masuk'] || row.uangMasuk).replace(/[^0-9.-]/g, '')) : 0,
      ketBelanja: row['keterangan belanja'] || row.ketBelanja || '',
      harga: row.harga ? Number(String(row.harga).replace(/[^0-9.-]/g, '')) : 0,
      sisaUang: row['sisa uang'] || row.sisaUang ? Number(String(row['sisa uang'] || row.sisaUang).replace(/[^0-9.-]/g, '')) : 0
    })).filter(r => r.nama);

    if (!newRecords.length) {
      alert('Tidak ada baris valid untuk diimpor');
      return;
    }

    const merged = [...entries, ...newRecords];
    setEntries(merged);
    saveLocalKas(merged);
    alert(`Berhasil mengimpor ${newRecords.length} baris (disimpan secara lokal).`);
  };

  const handleExport = () => {
    if (!entries.length) {
      alert('Tidak ada data untuk diexport');
      return;
    }
    const wsData = [
      ['Tanggal', 'Nama', 'Keterangan Tidak Masuk', 'Uang Masuk', 'Keterangan Belanja', 'Harga', 'Sisa Uang'],
      ...entries.map(e => [
        e.tanggal,
        e.nama,
        e.ketTidakMasuk,
        e.uangMasuk,
        e.ketBelanja,
        e.harga,
        e.sisaUang
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Kas');
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }];
    XLSX.writeFile(wb, `data_kas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb className="d-none d-md-inline-block" listProps={{ className: "breadcrumb-dark breadcrumb-transparent" }}>
            <Breadcrumb.Item>Tables</Breadcrumb.Item>
            <Breadcrumb.Item active>Data Kas</Breadcrumb.Item>
          </Breadcrumb>
          <h4>Data Kas</h4>
          <p className="mb-0">Catatan pemasukan dan pengeluaran kas.</p>
        </div>

        <div className="btn-toolbar mb-2 mb-md-0">
          <ButtonGroup>
            <Button variant="outline-primary" size="sm" onClick={handleOpen}>+ Tambah data</Button>
            <Button variant="outline-secondary" size="sm" onClick={triggerImport} style={{ marginLeft: 8 }}>📤 Import Excel</Button>
            <Button variant="outline-primary" size="sm" onClick={handleExport}>📥 Export data</Button>
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
        <Table responsive className="table-centered table-nowrap rounded-top mb-0">
          <thead className="thead-light">
            <tr>
              <th className="border-bottom">#</th>
              <th className="border-bottom">Tanggal</th>
              <th className="border-bottom">Nama</th>
              <th className="border-bottom">Ket. Tidak Masuk</th>
              <th className="border-bottom">Uang Masuk</th>
              <th className="border-bottom">Ket. Belanja</th>
              <th className="border-bottom">Harga</th>
              <th className="border-bottom">Sisa Uang</th>
              <th className="border-bottom">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {entries.length ? entries.map((entry, idx) => (
              <tr key={entry.id || idx}>
                <td>{idx + 1}</td>
                <td>{entry.tanggal}</td>
                <td><strong>{entry.nama}</strong></td>
                <td>{entry.ketTidakMasuk || '-'}</td>
                <td><strong>Rp {entry.uangMasuk != null ? Number(entry.uangMasuk).toLocaleString('id-ID') : 0}</strong></td>
                <td>{entry.ketBelanja || '-'}</td>
                <td><strong>Rp {entry.harga != null ? Number(entry.harga).toLocaleString('id-ID') : 0}</strong></td>
                <td><strong>Rp {entry.sisaUang != null ? Number(entry.sisaUang).toLocaleString('id-ID') : 0}</strong></td>
                <td>
                  <div className="d-flex gap-2">
                    <Button variant="info" size="sm" onClick={() => handleEdit(entry)} title="Edit"><FontAwesomeIcon icon={faEdit} /></Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(entry.id)} title="Delete"><FontAwesomeIcon icon={faTrash} /></Button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="9" className="text-center py-4"><p className="text-muted mb-0">Tidak ada data</p></td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Data Kas' : 'Tambah Data Kas'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger">
              <strong>Terjadi Kesalahan:</strong>
              <ul className="mb-0 mt-2">
                {Object.entries(errors).map(([field, msg]) => <li key={field}>{msg}</li>)}
              </ul>
            </Alert>
          )}
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="tanggal"
                    value={form.tanggal}
                    onChange={handleChange}
                    isInvalid={!!errors.tanggal}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="nama"
                    value={form.nama}
                    onChange={handleChange}
                    isInvalid={!!errors.nama}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Keterangan Tidak Masuk</Form.Label>
              <Form.Control
                name="ketTidakMasuk"
                value={form.ketTidakMasuk}
                onChange={handleChange}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Uang Masuk</Form.Label>
                  <Form.Control
                    type="number"
                    name="uangMasuk"
                    value={form.uangMasuk}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sisa Uang</Form.Label>
                  <Form.Control
                    type="number"
                    name="sisaUang"
                    value={form.sisaUang}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Keterangan Belanja</Form.Label>
              <Form.Control
                name="ketBelanja"
                value={form.ketBelanja}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Harga / Pengeluaran</Form.Label>
              <Form.Control
                type="number"
                name="harga"
                value={form.harga}
                onChange={handleChange}
              />
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




