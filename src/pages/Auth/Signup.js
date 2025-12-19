
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faEnvelope, faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faGithub, faTwitter, faGoogle, faMicrosoft, faYahoo } from "@fortawesome/free-brands-svg-icons";
import { Col, Row, Form, Card, Button, FormCheck, Container, InputGroup, Alert } from '@themesberg/react-bootstrap';
import { Link, useHistory } from 'react-router-dom';

import { Routes } from "../../routes";
import BgImage from "../../assets/img/illustrations/signin.svg";
import { API_URL, BACKEND_URL } from "../../config/api";


export default () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
      const user = urlParams.get('user');
      localStorage.setItem('authToken', token);
      if (user) {
        localStorage.setItem('authUser', user);
      }
      setMessage({ type: 'success', text: 'Registrasi berhasil! Email konfirmasi telah dikirim.' });
      setTimeout(() => history.push(Routes.DashboardOverview.path), 1500);
    } else if (error) {
      setMessage({ type: 'danger', text: decodeURIComponent(error) });
    }
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);
    
    if (!email || !password || !confirmPassword) {
      setMessage({ type: 'danger', text: 'Lengkapi semua field.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'danger', text: 'Password dan konfirmasi tidak sama.' });
      return;
    }

    setIsLoading(true);
    
    fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'admin' })
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Register failed');
      }
      return res.json();
    })
    .then(() => {
      setMessage({ type: 'success', text: 'Akun berhasil dibuat. Silakan login.' });
      setTimeout(() => history.push(Routes.Signin.path), 1500);
    })
    .catch(err => {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
          setMessage({ type: 'danger', text: 'Email sudah terdaftar (lokal).' });
          return;
        }
        users.push({ email, password, role: 'admin' });
        localStorage.setItem('users', JSON.stringify(users));
        setMessage({ type: 'warning', text: 'Server tidak respons. Akun disimpan secara lokal.' });
        setTimeout(() => history.push(Routes.Signin.path), 1500);
      } catch (e) {
        setMessage({ type: 'danger', text: err.message });
      }
    })
    .finally(() => setIsLoading(false));
  };

  const handleEmailProviderSignup = (provider) => {
    setMessage(null);
    setIsLoading(true);
    
    // Redirect to OAuth provider
    window.location.href = `${BACKEND_URL}/api/auth/${provider}?mode=signup`;
  };
  return (
    <main>
      <section className="d-flex align-items-center my-5 mt-lg-6 mb-lg-5">
        <Container>
          {/* <p className="text-center">
            <Card.Link as={Link} to={Routes.DashboardOverview.path} className="text-gray-700">
              <FontAwesomeIcon icon={faAngleLeft} className="me-2" /> Back to homepage
            </Card.Link>
          </p> */}
          <Row className="justify-content-center form-bg-image" style={{ backgroundImage: `url(${BgImage})` }}>
            <Col xs={12} className="d-flex align-items-center justify-content-center">
              <div className="mb-4 mb-lg-0 bg-white shadow-soft border rounded border-light p-4 p-lg-5 w-100 fmxw-500">
                <div className="text-center text-md-center mb-4 mt-md-0">
                  <h3 className="mb-0">Create an account</h3>
                </div>
                <Form className="mt-4" onSubmit={handleSubmit}>
                  <Form.Group id="email" className="mb-4">
                    <Form.Label>Your Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faEnvelope} />
                      </InputGroup.Text>
                        <Form.Control autoFocus required type="email" placeholder="example@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </InputGroup>
                  </Form.Group>
                  <Form.Group id="password" className="mb-4">
                    <Form.Label>Your Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faUnlockAlt} />
                      </InputGroup.Text>
                        <Form.Control required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    </InputGroup>
                  </Form.Group>
                  <Form.Group id="confirmPassword" className="mb-4">
                    <Form.Label>Confirm Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FontAwesomeIcon icon={faUnlockAlt} />
                      </InputGroup.Text>
                      <Form.Control required type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </InputGroup>
                  </Form.Group>
                  {message && (
                    <Alert variant={message.type} className="mb-3">{message.text}</Alert>
                  )}
                  <FormCheck type="checkbox" className="d-flex mb-4">
                    <FormCheck.Input required id="terms" className="me-2" />
                    <FormCheck.Label htmlFor="terms">
                      I agree to the <Card.Link>terms and conditions</Card.Link>
                    </FormCheck.Label>
                  </FormCheck>

                  <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Sign up'}
                  </Button>
                </Form>

                <div className="mt-3 mb-4 text-center">
                  <span className="fw-normal">or sign up with email provider</span>
                </div>
                <div className="d-flex justify-content-center my-4 flex-wrap gap-2">
                  <Button 
                    variant="outline-light" 
                    className="btn-icon-only btn-pill me-2"
                    style={{ color: '#DB4437', borderColor: '#DB4437' }}
                    onClick={() => handleEmailProviderSignup('google')}
                    disabled={isLoading}
                    title="Sign up with Google"
                  >
                    <FontAwesomeIcon icon={faGoogle} />
                  </Button>
                  <Button 
                    variant="outline-light" 
                    className="btn-icon-only btn-pill me-2"
                    style={{ color: '#00A4EF', borderColor: '#00A4EF' }}
                    onClick={() => handleEmailProviderSignup('microsoft')}
                    disabled={isLoading}
                    title="Sign up with Microsoft"
                  >
                    <FontAwesomeIcon icon={faMicrosoft} />
                  </Button>
                  <Button 
                    variant="outline-light" 
                    className="btn-icon-only btn-pill"
                    style={{ color: '#6001D2', borderColor: '#6001D2' }}
                    onClick={() => handleEmailProviderSignup('yahoo')}
                    disabled={isLoading}
                    title="Sign up with Yahoo"
                  >
                    <FontAwesomeIcon icon={faYahoo} />
                  </Button>
                </div>
                <div className="d-flex justify-content-center align-items-center mt-4">
                  <span className="fw-normal">
                    Already have an account?
                    <Card.Link as={Link} to={Routes.Signin.path} className="fw-bold">
                      {` Login here `}
                    </Card.Link>
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  );
};
