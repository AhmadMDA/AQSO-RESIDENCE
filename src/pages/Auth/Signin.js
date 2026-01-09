
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faEnvelope, faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faGithub, faTwitter, faGoogle, faMicrosoft, faYahoo } from "@fortawesome/free-brands-svg-icons";
import { Col, Row, Form, Card, Button, FormCheck, Container, InputGroup, Alert } from '@themesberg/react-bootstrap';
import { Link, useHistory } from 'react-router-dom';

import { Routes } from "../../routes";
import BgImage from "../../assets/img/illustrations/signin.svg";


export default () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setMessage({ type: 'success', text: 'Login berhasil! Email konfirmasi telah dikirim.' });
      setTimeout(() => history.push(Routes.DashboardOverview.path), 1500);
    } else if (error) {
      setMessage({ type: 'danger', text: decodeURIComponent(error) });
    }
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    setMessage(null);
    setIsLoading(true);
    
    fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Login failed');
      }
      return res.json();
    })
    .then(data => {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setMessage({ type: 'success', text: 'Login berhasil!' });
      setTimeout(() => history.push(Routes.DashboardOverview.path), 1000);
    })
    .catch(err => setMessage({ type: 'danger', text: err.message }))
    .finally(() => setIsLoading(false));
  };


  const handleEmailProviderLogin = (provider) => {
    setMessage(null);
    setIsLoading(true);
    
    // Redirect to OAuth provider
    const backendUrl = 'http://localhost:4000';
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  return (
    <main>
      <section className="d-flex align-items-right my-5 mt-lg-6 mb-lg-5">
        <Container>
          {/* <p className="text-center">
            <Card.Link as={Link} to={Routes.DashboardOverview.path} className="text-gray-700">
              <FontAwesomeIcon icon={faAngleLeft} className="me-2" /> Back to homepage
            </Card.Link>
          </p> */}
          <Row className="justify-content-center form-bg-image" style={{ backgroundImage: `url(${BgImage})` }}>
            <Col xs={12} className="d-flex align-items-center justify-content-center">
              <div className="bg-white shadow-soft border rounded border-light p-4 p-lg-5 w-100 fmxw-500">
                <div className="text-center text-md-center mb-4 mt-md-0">
                  <h3 className="mb-0">Sign in to our platform</h3>
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
                  <Form.Group>
                    <Form.Group id="password" className="mb-4">
                      <Form.Label>Your Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FontAwesomeIcon icon={faUnlockAlt} />
                        </InputGroup.Text>
                        <Form.Control required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                      </InputGroup>
                    </Form.Group>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <Form.Check type="checkbox">
                        <FormCheck.Input id="defaultCheck5" className="me-2" />
                        <FormCheck.Label htmlFor="defaultCheck5" className="mb-0">Remember me</FormCheck.Label>
                      </Form.Check>
                      <Card.Link className="small text-end">Lost password?</Card.Link>
                    </div>
                  </Form.Group>
                  {message && (
                    <Alert variant={message.type} className="mb-3">{message.text}</Alert>
                  )}
                  <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Form>

                <div className="mt-3 mb-4 text-center">
                  <span className="fw-normal">or login with email provider</span>
                </div>
                <div className="d-flex justify-content-center my-4 flex-wrap gap-2">
                  <Button 
                    variant="outline-light" 
                    className="btn-icon-only btn-pill me-2"
                    style={{ color: '#DB4437', borderColor: '#DB4437' }}
                    onClick={() => handleEmailProviderLogin('google')}
                    disabled={isLoading}
                    title="Sign in with Google"
                  >
                    <FontAwesomeIcon icon={faGoogle} />
                  </Button>
                  <Button 
                    variant="outline-light" 
                    className="btn-icon-only btn-pill me-2"
                    style={{ color: '#00A4EF', borderColor: '#00A4EF' }}
                    onClick={() => handleEmailProviderLogin('microsoft')}
                    disabled={isLoading}
                    title="Sign in with Microsoft"
                  >
                    <FontAwesomeIcon icon={faMicrosoft} />
                  </Button>
                  <Button 
                    variant="outline-light" 
                    className="btn-icon-only btn-pill"
                    style={{ color: '#6001D2', borderColor: '#6001D2' }}
                    onClick={() => handleEmailProviderLogin('yahoo')}
                    disabled={isLoading}
                    title="Sign in with Yahoo"
                  >
                    <FontAwesomeIcon icon={faYahoo} />
                  </Button>
                </div>
                <div className="d-flex justify-content-center align-items-center mt-4">
                  <span className="fw-normal">
                    Not registered?
                    <Card.Link as={Link} to={Routes.Signup.path} className="fw-bold">
                      {` Create account `}
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
