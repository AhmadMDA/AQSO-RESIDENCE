
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faEye, faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { Col, Row, Form, Card, Image, Button, Container, InputGroup, Alert } from '@themesberg/react-bootstrap';
import { Link, useHistory } from 'react-router-dom';

import { Routes } from "../../routes";
import BgImage from "../../assets/img/illustrations/signin.svg";
import Profile3 from "../../assets/img/team/profile-picture-3.jpg";
import { API_URL } from "../../config/api";

export default () => {
  const history = useHistory();
  const [authUser, setAuthUser] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(Profile3);
  const [profileName, setProfileName] = useState("User");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        const user = JSON.parse(raw);
        setAuthUser(user);
        
        // Load profile photo and name
        const profileKey = `profile_${user.email}`;
        const savedProfile = localStorage.getItem(profileKey);
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          if (profile.photo) {
            setProfilePhoto(profile.photo);
          }
          if (profile.fullName) {
            setProfileName(profile.fullName);
          } else {
            setProfileName(user.email);
          }
        } else {
          setProfileName(user.email);
        }
      } else {
        history.push(Routes.Signin.path);
      }
    } catch (e) {
      history.push(Routes.Signin.path);
    }
  }, [history]);

  const passwordInputType = showPassword ? "text" : "password";
  const passwordIconColor = showPassword ? "#262B40" : "";

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (!authUser) {
        setMessage({ type: 'danger', text: 'User not authenticated' });
        setLoading(false);
        return;
      }

      // Try backend first
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authUser.email, password })
      });

      if (response.ok) {
        // Password correct, unlock screen
        history.push(Routes.DashboardOverview.path);
        return;
      } else {
        throw new Error('Invalid password');
      }
    } catch (err) {
      // Fallback: check against localStorage users
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === authUser.email && u.password === password);
        if (user) {
          history.push(Routes.DashboardOverview.path);
        } else {
          setMessage({ type: 'danger', text: 'Password salah' });
        }
      } catch (e) {
        setMessage({ type: 'danger', text: 'Password salah' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="vh-lg-100 bg-soft d-flex align-items-center my-4">
        <Container>
          <Row className="justify-content-center form-bg-image" style={{ backgroundImage: `url(${BgImage})` }}>
            <Col xs={12} className="d-flex align-items-center justify-content-center">
              <div className="bg-white shadow-soft border border-light rounded p-4 p-lg-5 w-100 fmxw-500">
                <div className="text-center text-md-center mb-4 mt-md-0">
                  <div className="user-avatar large-avatar mx-auto mb-3 border-dark p-2">
                    <Image src={profilePhoto} className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h3 className="mb-3">{profileName}</h3>
                  <p className="text-gray">Better to be safe than sorry.</p>
                </div>
                <Form className="mt-5" onSubmit={handleUnlock}>
                  {message && (
                    <Alert variant={message.type} className="mb-3">
                      {message.text}
                    </Alert>
                  )}
                  <Form.Group id="password" className="mb-4">
                    <Form.Label>Your Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faUnlockAlt} />
                      </InputGroup.Text>
                      <Form.Control 
                        required 
                        type={passwordInputType} 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                        <FontAwesomeIcon color={passwordIconColor} icon={faEye} />
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? 'Unlocking...' : 'Unlock'}
                  </Button>
                </Form>

              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  );
};
