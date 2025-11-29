import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister, faChartLine, faCloudUploadAlt, faDesktop, faMobileAlt, faTabletAlt } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Button, Dropdown, ButtonGroup } from '@themesberg/react-bootstrap';

import { 
  CounterWidget, CircleChartWidget, BarChartWidget, TeamMembersWidget, 
  ProgressTrackWidget, RankingWidget, SalesValueWidget, SalesValueWidgetPhone, 
  AcquisitionWidget 
} from "../../components/Widgets";

import { PageVisitsTable } from "../../components/Tables";
import { trafficShares, totalOrders } from "../../data/charts";

export default () => {
  
  const fileInputRef = useRef(null);

  // Tambah state untuk trafficShares dari user table
  const [trafficSharesData, setTrafficSharesData] = useState([
    { id: 1, label: "Type 70", value: 0, color: "secondary", icon: faDesktop },
    { id: 2, label: "Type 55", value: 0, color: "primary", icon: faMobileAlt },
    { id: 3, label: "Type 35", value: 0, color: "tertiary", icon: faTabletAlt },
  ]);

  // Penghuni stats
  const [penghuniPeriod, setPenghuniPeriod] = useState("");
  const [penghuniPercentage, setPenghuniPercentage] = useState(0);

  // Pendapatan stats
  const [pendapatan, setPendapatan] = useState(0);
  const [pendapatanPercentage, setPendapatanPercentage] = useState(0);

  // State untuk data chart bulanan pendapatan
  const [pendapatanChartData, setPendapatanChartData] = useState({labels:[],series:[[]]});

  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/customers");
        if (!res.ok) throw new Error("Failed to fetch users");
        const users = await res.json();

        let type70 = 0, type55 = 0, type35 = 0;
        users.forEach(u => {
          if (String(u.type).replace(/\s/g,"").includes("70")) type70++;
          else if (String(u.type).replace(/\s/g,"").includes("55")) type55++;
          else if (String(u.type).replace(/\s/g,"").includes("35")) type35++;
        });
        setTrafficSharesData([
          { id: 1, label: "Type 70", value: type70, color: "secondary", icon: faDesktop },
          { id: 2, label: "Type 55", value: type55, color: "primary", icon: faMobileAlt },
          { id: 3, label: "Type 35", value: type35, color: "tertiary", icon: faTabletAlt }
        ]);

        // Statistik period
        if(users.length > 0) {
          const tanggalList = users.map(u => u.tanggal).filter(Boolean);
          const dateObjs = tanggalList.map(d => new Date(d)).filter(d => !isNaN(d));
          if(dateObjs.length > 0) {
            const minDate = new Date(Math.min(...dateObjs));
            const maxDate = new Date(Math.max(...dateObjs));
            const options = { day: 'numeric', month: 'short' };
            setPenghuniPeriod(`${minDate.getDate()} ${minDate.toLocaleString('default', { month: 'short' })} - ${maxDate.getDate()} ${maxDate.toLocaleString('default', { month: 'short' })}`);
          } else {
            setPenghuniPeriod('-');
          }
        } else {
          setPenghuniPeriod('-');
        }
        // Statistik percentage bulanan
        const thisMonth = new Date().getMonth(), thisYear = new Date().getFullYear();
        let bulanIni = 0, bulanLalu = 0;
        users.forEach(u => {
          const tgl = new Date(u.tanggal);
          if (!isNaN(tgl)) {
            if (tgl.getMonth() === thisMonth && tgl.getFullYear() === thisYear) bulanIni++;
            else if (tgl.getMonth() === thisMonth-1 && tgl.getFullYear() === thisYear) bulanLalu++;
            else if (thisMonth === 0 && tgl.getMonth() === 11 && tgl.getFullYear() === thisYear-1) bulanLalu++; // handle Jan/Des
          }
        });
        let percent = bulanLalu === 0 ? (bulanIni > 0 ? 100 : 0) : ((bulanIni - bulanLalu) / bulanLalu * 100).toFixed(1);
        setPenghuniPercentage(percent);
      } catch (err) {
        setPenghuniPeriod('-');
        setPenghuniPercentage(0);
        console.error('Gagal ambil data user:', err);
      }
    };
    fetchUserTypes();

    // Fetch dan hitung pendapatan bulan ini & bulan lalu
    async function fetchKavlingPendapatan() {
      try {
        const res = await fetch("http://localhost:4000/api/kavlings");
        if (!res.ok) throw new Error("Failed to fetch kavlings");
        const kavlings = await res.json();
        const now = new Date();
        const bulanIni = now.getMonth(), tahunIni = now.getFullYear();
        const bulanLalu = (bulanIni === 0 ? 11 : bulanIni - 1);
        const tahunLalu = (bulanIni === 0 ? tahunIni - 1 : tahunIni);
        let totalThisMonth = 0;
        let totalLastMonth = 0;

        // ----------- CHART DATA per bulan -----------
        // Bentuk { '2024-04': total, ... }
        const pendapatanPerBulan = {};
        kavlings.forEach(k => {
          // Ambil tanggal
          const tgl_raw = k.tanggal_pembayaran || k.tanggal || k.createdAt || "";
          const tgl = tgl_raw ? new Date(tgl_raw) : null;
          if (!tgl || isNaN(tgl)) return; // skip row kalau gagal date
          // Ambil DP
          const dp = Number(k.pembayaran_dp != null ? k.pembayaran_dp : (k.dp != null ? k.dp : 0)) || 0;
          // Ambil cicilan array atau single
          let cicilans = [];
          if (Array.isArray(k.pembayaran_cicilan)) cicilans = k.pembayaran_cicilan.map(c => Number(c) || 0);
          else if (Array.isArray(k.angsuran)) cicilans = k.angsuran.map(c => Number(c) || 0);
          else if (k.pembayaran_cicilan != null) cicilans = [Number(k.pembayaran_cicilan) || 0];
          else if (k.angsuran != null) cicilans = [Number(k.angsuran) || 0];
          // Kalkulasi per bulan
          const key = `${tgl.getFullYear()}-${(tgl.getMonth()+1).toString().padStart(2,'0')}`;
          pendapatanPerBulan[key] = (pendapatanPerBulan[key]||0) + dp + cicilans.reduce((a,b)=>a+b,0);
          if (tgl.getMonth() === bulanIni && tgl.getFullYear() === tahunIni) totalThisMonth += dp + cicilans.reduce((a,b)=>a+b,0);
          else if (tgl.getMonth() === bulanLalu && tgl.getFullYear() === tahunLalu) totalLastMonth += dp + cicilans.reduce((a,b)=>a+b,0);
        });
        // DEBUG: log hasil agregat
        console.log('HASIL pendapatanPerBulan:', pendapatanPerBulan);
        // Generate chart format
        const sortedKeys = Object.keys(pendapatanPerBulan).sort();
        const chartLabels = sortedKeys.map(key => {
          const [y,m]=key.split('-');
          return `${new Date(y,parseInt(m)-1,1).toLocaleString('default',{month:'short'})} ${y}`;
        });
        const chartSeries = [sortedKeys.map(k=>pendapatanPerBulan[k])];
        setPendapatanChartData({labels: chartLabels, series: chartSeries});
        setPendapatan(totalThisMonth);
        let percent = totalLastMonth === 0 ? (totalThisMonth > 0 ? 100 : 0) : (((totalThisMonth-totalLastMonth)/totalLastMonth)*100).toFixed(1);
        setPendapatanPercentage(percent);
      } catch {
        setPendapatan(0); setPendapatanChartData({labels:[],series:[[]]}); setPendapatanPercentage(0);
      }
    }
    fetchKavlingPendapatan();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    console.log("File dipilih:", file.name);

    // TODO: Upload ke server jika perlu
    // contoh:
    // const formData = new FormData();
    // formData.append("file", file);
  };

  return (
    <>

      <Row className="justify-content-md-center">
        <Col xs={12} className="mb-4 d-none d-sm-block">
          <SalesValueWidget
            title="Pendapatan"
            value={pendapatan.toLocaleString('id-ID',{ style:'currency', currency:'IDR', maximumFractionDigits:0 })}
            percentage={pendapatanPercentage}
            dataChart={pendapatanChartData}
          />
        </Col>

        <Col xs={12} className="mb-4 d-sm-none">
          <SalesValueWidgetPhone
            title="Pendapatan"
            value={pendapatan.toLocaleString('id-ID',{ style:'currency', currency:'IDR', maximumFractionDigits:0 })}
            percentage={pendapatanPercentage}
            dataChart={pendapatanChartData}
          />
        </Col>

        <Col xs={12} sm={6} xl={4} className="mb-4">
          <CounterWidget
            category="Penghuni"
            title={trafficSharesData.reduce((a,b) => a + b.value, 0)}
            period={penghuniPeriod}
            percentage={penghuniPercentage}
            icon={faChartLine}
            iconColor="shape-secondary"
          />
        </Col>

        <Col xs={12} sm={6} xl={4} className="mb-4">
          <CounterWidget
            category="Revenue"
            title="$43,594"
            period="Feb 1 - Apr 1"
            percentage={28.4}
            icon={faCashRegister}
            iconColor="shape-tertiary"
          />
        </Col>

        <Col xs={12} sm={6} xl={4} className="mb-4">
          <CircleChartWidget
            title="Type Rumah"
            data={trafficSharesData}
          />
        </Col>
      </Row>

      <Row>
        <Col xs={12} xl={12} className="mb-4">
          <Row>
            <Col xs={12} xl={8} className="mb-4">
              <Row>
                <Col xs={12} className="mb-4">
                  <PageVisitsTable />
                </Col>

                {/* <Col xs={12} lg={6} className="mb-4">
                  <TeamMembersWidget />
                </Col> */}

                {/* <Col xs={12} lg={6} className="mb-4">
                  <ProgressTrackWidget />
                </Col> */}
              </Row>
            </Col>

            <Col xs={12} xl={4}>
              <Row>
                <Col xs={12} className="mb-4">
                  <BarChartWidget
                    title="Total orders"
                    value={452}
                    percentage={18.2}
                    data={totalOrders}
                  />
                </Col>

                {/* <Col xs={12} className="px-0 mb-4">
                  <RankingWidget />
                </Col> */}

                {/* <Col xs={12} className="px-0">
                  <AcquisitionWidget />
                </Col> */}
              </Row>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};
