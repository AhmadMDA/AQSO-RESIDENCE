
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCog, faEnvelopeOpen, faSearch, faSignOutAlt, faUserShield, faLock } from "@fortawesome/free-solid-svg-icons";
import { faUserCircle } from "@fortawesome/free-regular-svg-icons";
import { Row, Col, Nav, Form, Image, Navbar, Dropdown, Container, ListGroup, InputGroup} from '@themesberg/react-bootstrap';
import { useHistory } from 'react-router-dom';

// import NOTIFICATIONS_DATA from "../data/notifications";
import Profile3 from "../assets/img/team/profile-picture-3.jpg";
import { Link } from "react-router-dom";
import { Routes } from "../routes";

// Logo dari public folder - dengan fallback jika tidak ada
const LogoAQSO = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo.png` : "/logo.png";



export default (props) => {
  // const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);
  // const areNotificationsRead = notifications.reduce((acc, notif) => acc && notif.read, true);

  const history = useHistory();
  const [authUser, setAuthUser] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(Profile3);
  const [profileName, setProfileName] = useState("User");

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
      }
    } catch (e) {
      setAuthUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    // optional: remove other app-specific keys
    history.push(Routes.Signin.path);
  };
  
  return (
    <Navbar variant="dark" expanded className="ps-0 pe-2 pb-0">
      <Container fluid className="px-0">
        <div className="d-flex justify-content-between w-100">
          <div className="d-flex align-items-center">
            {/* Logo AQSO RESIDENCE */}
            <Link to={Routes.DashboardOverview.path} className="me-3 d-flex align-items-center text-decoration-none">
              <Image 
                src={LogoAQSO} 
                style={{ maxHeight: '40px', width: 'auto', marginRight: '10px' }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo.png';
                }}
              />
              <span className="text-white fw-bold d-none d-md-inline">AQSO RESIDENCE Dashboard</span>
            </Link>
            <Form className="navbar-search">
              <Form.Group id="topbarSearch">
                <InputGroup className="input-group-merge search-bar">
                  <InputGroup.Text><FontAwesomeIcon icon={faSearch} /></InputGroup.Text>
                  <Form.Control type="text" placeholder="Search" />
                </InputGroup>
              </Form.Group>
            </Form>
          </div>
          <Nav className="align-items-center">

            <Dropdown as={Nav.Item}>
              <Dropdown.Toggle as={Nav.Link} className="pt-1 px-0">
                <div className="media d-flex align-items-center">
                  <Image src={profilePhoto} className="user-avatar md-avatar rounded-circle" style={{ objectFit: 'cover' }} />
                  <div className="media-body ms-2 text-dark align-items-center d-none d-lg-block">
                    <span className="mb-0 font-small fw-bold">{profileName}</span>
                    <div className="text-muted small">{authUser ? authUser.role : ''}</div>
                  </div>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="user-dropdown dropdown-menu-right mt-2">
                <Dropdown.Item
                  as={Link}
                  to={Routes.MyProfile.path}
                  className="fw-bold"
                >
                  <FontAwesomeIcon icon={faUserCircle} className="me-2" /> My Profile
                </Dropdown.Item>

                <Dropdown.Item
                  as={Link}
                  to={Routes.Lock.path}
                  className="fw-bold"
                >
                  <FontAwesomeIcon icon={faLock} className="me-2" /> Lock
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.Item onClick={handleLogout} className="fw-bold">
                  <FontAwesomeIcon icon={faSignOutAlt} className="text-danger me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </div>
      </Container>
    </Navbar>
  );
};
