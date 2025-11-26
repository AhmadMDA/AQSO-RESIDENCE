import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTrash, faEdit, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Card, Button, Breadcrumb, Table, Modal, Form } from '@themesberg/react-bootstrap';

import { Routes } from "../routes";

export default () => {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch users from backend atau localStorage
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/users');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      // Fallback: ambil dari localStorage
      try {
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        setUsers(localUsers);
      } catch (e) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (id, currentRole) => {
    setEditingId(id);
    setEditRole(currentRole);
  };

  const handleSaveRole = async (id) => {
    try {
      // Coba update via backend
      const response = await fetch('http://localhost:4000/api/users/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole })
      });
      if (!response.ok) throw new Error('Failed to update');
      // Update local state
      const updated = users.map(u => u.email === id ? { ...u, role: editRole } : u);
      setUsers(updated);
      setEditingId(null);
    } catch (err) {
      // Fallback: update localStorage
      try {
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updated = localUsers.map(u => u.email === id ? { ...u, role: editRole } : u);
        localStorage.setItem('users', JSON.stringify(updated));
        setUsers(updated);
        setEditingId(null);
      } catch (e) {
        alert('Gagal mengubah role: ' + e.message);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      // Coba delete via backend
      const response = await fetch('http://localhost:4000/api/users/' + deleteTarget, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete');
      // Update local state
      const updated = users.filter(u => u.email !== deleteTarget);
      setUsers(updated);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      // Fallback: delete dari localStorage
      try {
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updated = localUsers.filter(u => u.email !== deleteTarget);
        localStorage.setItem('users', JSON.stringify(updated));
        setUsers(updated);
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } catch (e) {
        alert('Gagal menghapus user: ' + e.message);
      }
    }
  };

  const confirmDelete = (email) => {
    setDeleteTarget(email);
    setShowDeleteModal(true);
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb className="d-none d-md-inline-block" listProps={{ className: "breadcrumb-dark breadcrumb-transparent" }}>
            <Breadcrumb.Item><FontAwesomeIcon icon={faHome} /></Breadcrumb.Item>
            <Breadcrumb.Item active>Manajemen Role</Breadcrumb.Item>
          </Breadcrumb>
          <h4>Manajemen Role & Admin</h4>
          <p className="mb-0">Kelola user dan role (hanya untuk pemilik).</p>
        </div>
      </div>

      {/* Table */}
      <Card border="light" className="table-wrapper table-responsive shadow-sm">
        <Card.Body>
          {loading ? (
            <p>Loading...</p>
          ) : users.length === 0 ? (
            <p>Tidak ada user.</p>
          ) : (
            <Table hover className="user-table align-middle">
              <thead>
                <tr>
                  <th className="border-bottom">Email</th>
                  <th className="border-bottom">Role</th>
                  <th className="border-bottom">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.email}>
                    <td>
                      <span className="fw-normal">{user.email}</span>
                    </td>
                    <td>
                      {editingId === user.email ? (
                        <Form.Select 
                          size="sm" 
                          value={editRole} 
                          onChange={e => setEditRole(e.target.value)}
                          style={{ width: '100px' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="pemilik">Pemilik</option>
                        </Form.Select>
                      ) : (
                        <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-info'}`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === user.email ? (
                        <>
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleSaveRole(user.email)}
                            className="me-2"
                          >
                            <FontAwesomeIcon icon={faCheck} /> Simpan
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            <FontAwesomeIcon icon={faTimes} /> Batal
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="warning" 
                            size="sm"
                            onClick={() => handleEditRole(user.email, user.role)}
                            className="me-2"
                          >
                            <FontAwesomeIcon icon={faEdit} /> Edit
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => confirmDelete(user.email)}
                          >
                            <FontAwesomeIcon icon={faTrash} /> Hapus
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Hapus</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Apakah Anda yakin ingin menghapus user <strong>{deleteTarget}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Hapus
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
