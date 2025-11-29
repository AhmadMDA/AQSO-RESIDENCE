import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
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
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0,10),
    nama: '',
    alamat: '',
    no_telpon: '',
    type: '',
    harga: '',
    no_rumah: '',
    keterangan: '',
    lunas: 'Belum'
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/customers`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleOpen = () => {
    setEditingId(null);
    setForm({ tanggal: new Date().toISOString().slice(0,10), nama: '', alamat: '', no_telpon: '', type: '', harga: '', no_rumah: '', keterangan: '', lunas: 'Belum' });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (u) => {
    setEditingId(u.id);
    setForm({
      tanggal: u.tanggal || new Date().toISOString().slice(0,10),
      nama: u.nama || '',
      alamat: u.alamat || '',
      no_telpon: u.no_telpon || '',
      type: u.type || '',
      harga: u.harga != null ? String(u.harga) : '',
      no_rumah: u.no_rumah || '',
      keterangan: u.keterangan || '',
      lunas: !!u.lunas ? 'Lunas' : 'Belum'
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

  const validate = () => {
    const err = {};
    if (!form.nama || String(form.nama).trim() === '') err.nama = 'Nama wajib diisi';
    if (!form.harga || Number(form.harga) <= 0) err.harga = 'Harga harus lebih besar dari 0';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      tanggal: form.tanggal,
      nama: form.nama,
      alamat: form.alamat,
      no_telpon: form.no_telpon,
      type: form.type,
      harga: form.harga ? parseFloat(form.harga) : 0,
      no_rumah: form.no_rumah,
      keterangan: form.keterangan,
      lunas: form.lunas === 'Lunas'
    };

    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/customers/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Update failed');
        const updated = await res.json();
        setUsers(prev => prev.map(p => String(p.id) === String(updated.id) ? updated : p));
      } else {
        const res = await fetch(`${API_BASE}/customers`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Create failed');
        const created = await res.json();
        setUsers(prev => [...prev, created]);
      }
      handleClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data?')) return;
    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setUsers(prev => prev.filter(u => String(u.id) !== String(id)));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data');
    }
  };

  const triggerImportClick = () => { if (fileInputRef && fileInputRef.current) fileInputRef.current.click(); };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return; try { await handleImportExcel(file); e.target.value = ''; } catch (err) { console.error(err); alert('Gagal mengimpor file'); }
  };

  const handleImportExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows || rows.length === 0) { alert('File kosong'); return; }

    const newRecords = [];
    rows.forEach((r, idx) => {
      const norm = {};
      Object.keys(r).forEach(k => { norm[k.toString().toLowerCase().replace(/\s|\.|_/g, '')] = r[k]; });
      const get = (cands) => { for (const c of cands) if (norm[c] !== undefined && String(norm[c]).trim() !== '') return norm[c]; return ''; };
      const tanggal = get(['tanggal','date']) || new Date().toISOString().slice(0,10);
      const nama = get(['nama','name']);
      const alamat = get(['alamat','address']);
      const no_telpon = get(['notelpon','no_telpon','telephone','phone']);
      const type = get(['type','tipe']);
      const hargaRaw = get(['harga','price','amount']);
      const no_rumah = get(['no_rumah','norumah','no rumah','no_rmh']);
      const keterangan = get(['keterangan','ket','note']);
      const lunasRaw = get(['lunas','paid']) || '';
      const harga = hargaRaw === '' ? 0 : parseFloat(String(hargaRaw).replace(/[^0-9.-]/g,'')) || 0;
      const lunas = String(lunasRaw).toLowerCase().startsWith('y') || String(lunasRaw).toLowerCase() === 'true' || Number(lunasRaw) === 1;

      if (!nama || harga === 0) {
        // skip invalid rows
        return;
      }
      newRecords.push({ tanggal, nama, alamat, no_telpon, type, harga, no_rumah, keterangan, lunas });
    });

    if (newRecords.length === 0) { alert('Tidak ada baris valid untuk diimpor'); return; }

    try {
        const created = await Promise.all(newRecords.map(async nr => {
        const res = await fetch(`${API_BASE}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nr) });
        if (!res.ok) throw new Error('Create failed');
        return await res.json();
      }));
      setUsers(prev => [...prev, ...created]);
      alert(`Berhasil mengimpor ${created.length} baris.`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengimpor beberapa baris');
    }
  };

  const handleExport = () => {
    if (!users || users.length === 0) { alert('Tidak ada data untuk diexport'); return; }
    const wsData = [ ['ID','Tanggal','Nama','Alamat','No Telpon','Type','Harga','No Rumah','Keterangan','Lunas'], ...users.map(u => [u.id, u.tanggal, u.nama, u.alamat, u.no_telpon, u.type, u.harga, u.no_rumah, u.keterangan, u.lunas ? 'Lunas' : 'Belum']) ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Users'); ws['!cols'] = [{wch:5},{wch:12},{wch:20},{wch:25},{wch:15},{wch:12},{wch:12},{wch:12},{wch:20},{wch:8}]; XLSX.writeFile(wb, `users_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const filtered = users;

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb className="d-none d-md-inline-block" listProps={{ className: "breadcrumb-dark breadcrumb-transparent" }}>
            <Breadcrumb.Item>Penghuni</Breadcrumb.Item>
            <Breadcrumb.Item active>Tabel Penghuni</Breadcrumb.Item>
          </Breadcrumb>
          <h4>Tabel Penghuni</h4>
          <p className="mb-0">Daftar penghuni / pelanggan.</p>
        </div>

        <div className="btn-toolbar mb-2 mb-md-0">
          <ButtonGroup>
            <Button variant="outline-primary" size="sm" onClick={handleOpen}>+ Tambah data</Button>
            <Button variant="outline-secondary" size="sm" onClick={triggerImportClick} style={{marginLeft:8}}>📤 Import Excel</Button>
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
              <th className="border-bottom">Alamat</th>
              <th className="border-bottom">No Telpon</th>
              <th className="border-bottom">Type</th>
              <th className="border-bottom">Harga</th>
              <th className="border-bottom">No Rumah</th>
              <th className="border-bottom">Keterangan</th>
              <th className="border-bottom">Lunas</th>
              <th className="border-bottom">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered && filtered.length > 0 ? filtered.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.tanggal}</td>
                <td>{u.nama}</td>
                <td>{u.alamat}</td>
                <td>{u.no_telpon}</td>
                <td>{u.type}</td>
                <td><strong>Rp {u.harga != null ? Number(u.harga).toLocaleString('id-ID') : 0}</strong></td>
                <td>{u.no_rumah}</td>
                <td>{u.keterangan}</td>
                <td>{u.lunas ? 'Lunas' : 'Belum'}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button variant="info" size="sm" onClick={() => handleEdit(u)} title="Edit"><FontAwesomeIcon icon={faEdit} /></Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(u.id)} title="Delete"><FontAwesomeIcon icon={faTrash} /></Button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="11" className="text-center py-4"><p className="text-muted">Tidak ada data</p></td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Data Penghuni' : 'Tambah Penghuni Baru'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger"><strong>Terjadi Kesalahan:</strong><ul className="mb-0 mt-2">{Object.entries(errors).map(([f,m]) => <li key={f}>{m}</li>)}</ul></Alert>
          )}

          <Form>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Tanggal</Form.Label><Form.Control name="tanggal" type="date" value={form.tanggal} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Nama</Form.Label><Form.Control name="nama" value={form.nama} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Alamat</Form.Label><Form.Control name="alamat" value={form.alamat} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>No Telpon</Form.Label><Form.Control name="no_telpon" value={form.no_telpon} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Type <span className="text-danger">*</span>
              <Form.Select
                name="type"
                value={form.type}
                onChange={handleChange}
                isInvalid={!!errors.type}
                style={{ minWidth: '200px' }}>
                  <option value="">Pilih...</option>
                  <option value="Type 35">Type 35  </option>
                  <option value="Type 55">Type 55  </option>
                  <option value="Type 70">Type 70  </option>
              </Form.Select>
              </Form.Label>
              
              </Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Harga</Form.Label><Form.Control name="harga" type="number" value={form.harga} onChange={handleChange} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>No Rumah</Form.Label><Form.Control name="no_rumah" value={form.no_rumah} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Keterangan</Form.Label><Form.Control name="keterangan" as="textarea" rows={2} value={form.keterangan} onChange={handleChange} /></Form.Group>
            <Form.Group className="mb-3 d-flex align-items-center"><Form.Check className="me-2"><Form.Check.Input type="checkbox" checked={form.lunas} name="lunas" onChange={handleChange} /><Form.Check.Label className="ms-2">Lunas</Form.Check.Label></Form.Check></Form.Group>
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
