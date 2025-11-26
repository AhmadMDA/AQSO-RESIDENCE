import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Card, Button, Breadcrumb, Form, Alert } from '@themesberg/react-bootstrap';

export default () => {
  const [authUser, setAuthUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    country: ""
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        const user = JSON.parse(raw);
        setAuthUser(user);
        // Load existing profile data from localStorage if available
        const profileKey = `profile_${user.email}`;
        const savedProfile = localStorage.getItem(profileKey);
        if (savedProfile) {
          setFormData(JSON.parse(savedProfile));
        }
      }
    } catch (e) {
      setMessage({ type: 'danger', text: 'Error loading user data' });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (!authUser) {
        setMessage({ type: 'danger', text: 'User not authenticated' });
        setLoading(false);
        return;
      }

      // Try to save to backend first
      const response = await fetch(`http://localhost:4000/api/profile/${authUser.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Saved to backend successfully
        const profileKey = `profile_${authUser.email}`;
        localStorage.setItem(profileKey, JSON.stringify(formData));
        setMessage({ type: 'success', text: 'Informasi pribadi berhasil disimpan!' });
      } else {
        throw new Error('Backend save failed');
      }
    } catch (err) {
      // Fallback: save to localStorage only
      try {
        const profileKey = `profile_${authUser.email}`;
        localStorage.setItem(profileKey, JSON.stringify(formData));
        setMessage({ type: 'success', text: 'Informasi pribadi berhasil disimpan (lokal)!' });
      } catch (e) {
        setMessage({ type: 'danger', text: 'Gagal menyimpan data: ' + e.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (authUser) {
      const profileKey = `profile_${authUser.email}`;
      const savedProfile = localStorage.getItem(profileKey);
      if (savedProfile) {
        setFormData(JSON.parse(savedProfile));
      } else {
        setFormData({
          fullName: "",
          phone: "",
          address: "",
          city: "",
          country: ""
        });
      }
      setMessage(null);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb className="d-none d-md-inline-block" listProps={{ className: "breadcrumb-dark breadcrumb-transparent" }}>
            <Breadcrumb.Item><FontAwesomeIcon icon={faHome} /></Breadcrumb.Item>
            <Breadcrumb.Item active>Pengaturan</Breadcrumb.Item>
          </Breadcrumb>
          <h4>Pengaturan Profil</h4>
          <p className="mb-0">Ubah informasi pribadi Anda.</p>
        </div>
      </div>

      {/* Settings Form Card */}
      <Card border="light" className="bg-white shadow-sm">
        <Card.Body className="pb-0">
          {message && (
            <Alert variant={message.type} className="mb-4">
              {message.text}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    value={authUser?.email || ''} 
                    disabled 
                  />
                  <Form.Text className="text-muted">Email tidak dapat diubah.</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={authUser?.role || ''} 
                    disabled 
                  />
                  <Form.Text className="text-muted">Role ditentukan oleh admin.</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Lengkap</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="fullName"
                    placeholder="Masukkan nama lengkap"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nomor Telepon</Form.Label>
                  <Form.Control 
                    type="tel" 
                    name="phone"
                    placeholder="Masukkan nomor telepon"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kota</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="city"
                    placeholder="Masukkan kota"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Alamat</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={3}
                    name="address"
                    placeholder="Masukkan alamat"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label>Negara</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="country"
                    placeholder="Masukkan negara"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col className="d-flex gap-2">
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSave} className="me-2" />
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleReset}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faTimes} className="me-2" />
                  Batal
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};
