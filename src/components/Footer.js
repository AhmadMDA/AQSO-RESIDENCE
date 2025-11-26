import React from "react";
import moment from "moment-timezone";
import { Row, Col, Card, OverlayTrigger, Tooltip, Image, Button } from '@themesberg/react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs, faDownload, faRocket } from "@fortawesome/free-solid-svg-icons";
import BS5Logo from "../assets/img/technologies/bootstrap-5-logo.svg";
import ReactLogo from "../assets/img/technologies/react-logo.svg";
import LaravelLogo from "../assets/img/technologies/laravel-logo.svg";
import GitHubButton from 'react-github-btn';
import { Link } from 'react-router-dom';
import { Routes } from "../routes";

export default (props) => {
  const currentYear = moment().get("year");
  const showSettings = props.showSettings;

  const toggleSettings = (toggle) => {
    props.toggleSettings(toggle);
  }

  return (
    // Tambahkan div kosong di sini untuk memberikan ruang agar footer tidak menimpa konten
    // Ukuran div ini harus sama dengan tinggi footer. Misal tinggi footer 100px.
    // Anda mungkin perlu menyesuaikan tinggi berdasarkan desain Anda.
    <div style={{ paddingBottom: '-30px' }}> 
      {/* Atur `paddingBottom` di elemen di atas atau di `main-content` Anda 
        agar konten tidak tertutup oleh footer yang fixed.
      */}
      <footer 
        className="footer section py-2" 
        style={{
          position: 'relative', // Membuat footer tetap di tempat saat di-scroll
          bottom: 0,          // Menempatkannya di bagian bawah viewport
          width: '100%',
          // height: '5%',     // Memastikan footer membentang di seluruh lebar
          zIndex: 500,       // Menempatkannya di atas konten lain
          backgroundColor: 'white', // Mengubah warna latar belakang menjadi putih
          // Opsional: Anda mungkin ingin menambahkan border atas agar terlihat jelas
          // borderTop: '1px solid #dee2e6' 
        }}
      >
        <Row>
          <Col xs={12} lg={6} className="mb-2 mb-lg-0">
            <p className="mb-0 text-center text-xl-left">
              Copyright © 2023-{`${currentYear} `}
              <Card.Link href="https://themesberg.com" target="_blank" className="text-blue text-decoration-none fw-normal">
              dann{' '}
              </Card.Link>
              distributed by{' '}
              <Card.Link href="https://themewagon.com" target="_blank" className="text-blue text-decoration-none fw-normal">AQSO RESIDENCE</Card.Link>
            </p>
          </Col>
        </Row>
      </footer>
    </div>
  );
};