import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSave, faTimes, faEdit, faCamera } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Card, Button, Breadcrumb, Form, Alert, Image } from '@themesberg/react-bootstrap';

import Profile3 from "../assets/img/team/profile-picture-3.jpg";
import API_URL from "../config/api";

export default () => {
  const [authUser, setAuthUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    country: ""
  });
  const [profilePhoto, setProfilePhoto] = useState(Profile3);
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
          const profile = JSON.parse(savedProfile);
          setFormData(profile);
          if (profile.photo) {
            setProfilePhoto(profile.photo);
          }
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
        setFormData(prev => ({
          ...prev,
          photo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload previous data
    if (authUser) {
      const profileKey = `profile_${authUser.email}`;
      const savedProfile = localStorage.getItem(profileKey);
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setFormData(profile);
        if (profile.photo) {
          setProfilePhoto(profile.photo);
        } else {
          setProfilePhoto(Profile3);
        }
      } else {
        setFormData({
          fullName: "",
          phone: "",
          address: "",
          city: "",
          country: ""
        });
        setProfilePhoto(Profile3);
      }
    }
    setMessage(null);
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
      const response = await fetch(`${API_URL}/profile/${authUser.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Saved to backend successfully
        const profileKey = `profile_${authUser.email}`;
        localStorage.setItem(profileKey, JSON.stringify(formData));
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
        setIsEditing(false);
      } else {
        throw new Error('Backend save failed');
      }
    } catch (err) {
      // Fallback: save to localStorage only
      try {
        const profileKey = `profile_${authUser.email}`;
        localStorage.setItem(profileKey, JSON.stringify(formData));
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui (lokal)!' });
        setIsEditing(false);
      } catch (e) {
        setMessage({ type: 'danger', text: 'Gagal menyimpan data: ' + e.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div className="d-block mb-4 mb-md-0">
          <Breadcrumb className="d-none d-md-inline-block" listProps={{ className: "breadcrumb-dark breadcrumb-transparent" }}>
            <Breadcrumb.Item><FontAwesomeIcon icon={faHome} /></Breadcrumb.Item>
            <Breadcrumb.Item active>Profil Saya</Breadcrumb.Item>
          </Breadcrumb>
          <h4>Profil Saya</h4>
          <p className="mb-0">Kelola informasi pribadi Anda.</p>
        </div>
      </div>

      <Row>
        {/* Profile Card */}
        <Col xs={12} lg={4} className="mb-4">
          <Card border="light" className="bg-white shadow-sm text-center">
            <Card.Body className="pb-0">
              <div className="mb-3 position-relative d-inline-block">
                <Image src={profilePhoto} className="rounded-circle" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                {isEditing && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#007bff',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '3px solid white'
                    }}
                    onClick={() => document.getElementById('photoInput').click()}
                  >
                    <FontAwesomeIcon icon={faCamera} className="text-white" />
                  </div>
                )}
                <input 
                  type="file" 
                  id="photoInput"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
              <h5 className="mb-1">{authUser?.email}</h5>
              <p className="text-muted mb-3">
                <span className="badge bg-info">{authUser?.role}</span>
              </p>
              {!isEditing && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleEdit}
                  className="w-100"
                >
                  <FontAwesomeIcon icon={faEdit} className="me-2" />
                  Edit Profil
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Profile Form */}
        <Col xs={12} lg={8}>
          <Card border="light" className="bg-white shadow-sm">
            <Card.Body>
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {isEditing && (
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
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Batal
                      </Button>
                    </Col>
                  </Row>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};
