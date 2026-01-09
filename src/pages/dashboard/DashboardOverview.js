import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister, faChartLine, faCloudUploadAlt, faDesktop, faMobileAlt, faTabletAlt } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Button, Dropdown, ButtonGroup } from '@themesberg/react-bootstrap';

import { 
  CounterWidget, CircleChartWidget, BarChartWidget, TeamMembersWidget, 
  ProgressTrackWidget, RankingWidget, SalesValueWidget, SalesValueWidgetPhone, 
  AcquisitionWidget 
} from "../../components/Widgets";

import { trafficShares, totalOrders } from "../../data/charts";
import { Card, Table } from '@themesberg/react-bootstrap';

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

  // State untuk tabel pendapatan
  const [pendapatanTableData, setPendapatanTableData] = useState([]);

  // State untuk tabel pengeluaran
  const [pengeluaranTableData, setPengeluaranTableData] = useState([]);
  // State untuk total pengeluaran
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);

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

    // Fetch dan hitung pendapatan + pengeluaran
    async function fetchPendapatanDanPengeluaran() {
      try {
        // Fetch data kavling dan kas secara paralel
        const [kavlingRes, kasRes] = await Promise.all([
          fetch("http://localhost:4000/api/kavlings"),
          fetch("http://localhost:4000/api/kas")
        ]);
        
        if (!kavlingRes.ok) throw new Error("Failed to fetch kavlings");
        if (!kasRes.ok) throw new Error("Failed to fetch kas");
        
        const kavlings = await kavlingRes.json();
        const kasData = await kasRes.json();
        
        const now = new Date();
        const bulanIni = now.getMonth(), tahunIni = now.getFullYear();
        const bulanLalu = (bulanIni === 0 ? 11 : bulanIni - 1);
        const tahunLalu = (bulanIni === 0 ? tahunIni - 1 : tahunIni);
        let totalThisMonth = 0;
        let totalLastMonth = 0;

        // ----------- CHART DATA per bulan -----------
        const pendapatanPerBulan = {};
        
        // Proses data kavling (DP + Cicilan)
        kavlings.forEach(k => {
          const tgl_raw = k.tanggal_pembayaran || k.tanggal || k.createdAt || "";
          const tgl = tgl_raw ? new Date(tgl_raw) : null;
          if (!tgl || isNaN(tgl)) return;
          
          const dp = Number(k.pembayaran_dp != null ? k.pembayaran_dp : (k.dp != null ? k.dp : 0)) || 0;
          let cicilans = [];
          if (Array.isArray(k.pembayaran_cicilan)) cicilans = k.pembayaran_cicilan.map(c => Number(c) || 0);
          else if (Array.isArray(k.angsuran)) cicilans = k.angsuran.map(c => Number(c) || 0);
          else if (k.pembayaran_cicilan != null) cicilans = [Number(k.pembayaran_cicilan) || 0];
          else if (k.angsuran != null) cicilans = [Number(k.angsuran) || 0];
          
          const key = `${tgl.getFullYear()}-${(tgl.getMonth()+1).toString().padStart(2,'0')}`;
          pendapatanPerBulan[key] = (pendapatanPerBulan[key]||0) + dp + cicilans.reduce((a,b)=>a+b,0);
          
          if (tgl.getMonth() === bulanIni && tgl.getFullYear() === tahunIni) {
            totalThisMonth += dp + cicilans.reduce((a,b)=>a+b,0);
          } else if (tgl.getMonth() === bulanLalu && tgl.getFullYear() === tahunLalu) {
            totalLastMonth += dp + cicilans.reduce((a,b)=>a+b,0);
          }
        });
        
        // Proses data kas (Investasi dari uangMasuk)
        kasData.forEach(kas => {
          const tgl_raw = kas.tanggal || "";
          const tgl = tgl_raw ? new Date(tgl_raw) : null;
          if (!tgl || isNaN(tgl)) return;
          
          const investasi = Number(kas.uangMasuk) || 0;
          const key = `${tgl.getFullYear()}-${(tgl.getMonth()+1).toString().padStart(2,'0')}`;
          pendapatanPerBulan[key] = (pendapatanPerBulan[key]||0) + investasi;
          
          if (tgl.getMonth() === bulanIni && tgl.getFullYear() === tahunIni) {
            totalThisMonth += investasi;
          } else if (tgl.getMonth() === bulanLalu && tgl.getFullYear() === tahunLalu) {
            totalLastMonth += investasi;
          }
        });

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

        // Prepare table data pendapatan - gabungkan data kavling dengan kas
        // Buat map untuk investasi per tanggal dari kas
        const investasiPerTanggal = {};
        kasData.forEach(kas => {
          const tgl_raw = kas.tanggal || "";
          const tgl = tgl_raw ? new Date(tgl_raw) : null;
          if (!tgl || isNaN(tgl)) return;
          
          const dateKey = tgl.toLocaleDateString('id-ID');
          const investasi = Number(kas.uangMasuk) || 0;
          investasiPerTanggal[dateKey] = (investasiPerTanggal[dateKey] || 0) + investasi;
        });

        // Proses data kavling untuk tabel
        const kavlingTableData = kavlings.map(k => {
          const tgl_raw = k.tanggal_pembayaran || k.tanggal || k.createdAt || "";
          const tgl = tgl_raw ? new Date(tgl_raw) : null;
          const dp = Number(k.pembayaran_dp != null ? k.pembayaran_dp : (k.dp != null ? k.dp : 0)) || 0;
          let cicilans = [];
          if (Array.isArray(k.pembayaran_cicilan)) cicilans = k.pembayaran_cicilan.map(c => Number(c) || 0);
          else if (Array.isArray(k.angsuran)) cicilans = k.angsuran.map(c => Number(c) || 0);
          else if (k.pembayaran_cicilan != null) cicilans = [Number(k.pembayaran_cicilan) || 0];
          else if (k.angsuran != null) cicilans = [Number(k.angsuran) || 0];
          const totalCicilan = cicilans.reduce((a,b)=>a+b,0);
          
          const dateKey = tgl ? tgl.toLocaleDateString('id-ID') : '-';
          const investasi = investasiPerTanggal[dateKey] || 0;
          const totalPendapatan = dp + totalCicilan + investasi;
          
          return {
            id: k.id,
            tanggal: dateKey,
            tanggalSort: tgl ? tgl.getTime() : 0,
            dp: dp,
            cicilan: totalCicilan,
            investasi: investasi,
            totalPendapatan: totalPendapatan
          };
        }).filter(item => item.totalPendapatan > 0)
          .sort((a, b) => b.tanggalSort - a.tanggalSort)
          .slice(0, 10);
        
        setPendapatanTableData(kavlingTableData);

        // Prepare table data pengeluaran dari kas
        const pengeluaranData = kasData
          .map(kas => {
            const tgl_raw = kas.tanggal || "";
            const tgl = tgl_raw ? new Date(tgl_raw) : null;
            const harga = Number(kas.harga) || 0;
            
            return {
              id: kas.id,
              tanggal: tgl ? tgl.toLocaleDateString('id-ID') : '-',
              tanggalSort: tgl ? tgl.getTime() : 0,
              keterangan: kas.ketBelanja || '-',
              jumlah: harga
            };
          })
          .filter(item => item.jumlah > 0)
          .sort((a, b) => b.tanggalSort - a.tanggalSort)
          .slice(0, 10);
        
        setPengeluaranTableData(pengeluaranData);
        // Hitung total pengeluaran
        const totalPengeluaranVal = pengeluaranData.reduce((sum, curr) => sum + (curr.jumlah || 0), 0);
        setTotalPengeluaran(totalPengeluaranVal);

      } catch (err) {
        console.error('Gagal fetch data:', err);
        setPendapatan(0); 
        setPendapatanChartData({labels:[],series:[[]]}); 
        setPendapatanPercentage(0);
        setPendapatanTableData([]);
        setPengeluaranTableData([]);
      }
    }
    fetchPendapatanDanPengeluaran();
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

        {/* Baris sejajar 4 card */}
        <Col xs={12} className="mb-4">
          <Row>
            <Col xs={12} sm={6} xl={3} className="mb-4 mb-xl-0">
              <CounterWidget
                category="Penghuni"
                title={trafficSharesData.reduce((a,b) => a + b.value, 0)}
                period={penghuniPeriod}
                percentage={penghuniPercentage}
                icon={faChartLine}
                iconColor="shape-secondary"
              />
            </Col>

            <Col xs={12} sm={6} xl={3} className="mb-4 mb-xl-0">
              <CounterWidget
                category="Total Pendapatan"
                title={pendapatan.toLocaleString('id-ID',{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                period="Bulan Ini"
                percentage={pendapatanPercentage}
                icon={faCashRegister}
                iconColor="shape-tertiary"
              />
            </Col>

            <Col xs={12} sm={6} xl={3} className="mb-4 mb-xl-0">
              <CounterWidget
                category="Total Pengeluaran"
                title={totalPengeluaran.toLocaleString('id-ID',{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                period="Bulan Ini"
                percentage={0}
                icon={faCashRegister}
                iconColor="shape-danger"
              />
            </Col>

            <Col xs={12} sm={6} xl={3} className="mb-4 mb-xl-0">
              <CircleChartWidget
                title="Type Rumah"
                data={trafficSharesData}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      <Row>
        <Col xs={12} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5>Tabel Data Pendapatan</h5>
                </Col>
              </Row>
            </Card.Header>
            <Table responsive className="align-items-center table-flush">
              <thead className="thead-light">
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">DP</th>
                  <th scope="col">Cicilan</th>
                  <th scope="col">Investasi</th>
                  <th scope="col">Total Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {pendapatanTableData.length > 0 ? (
                  pendapatanTableData.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.tanggal}</td>
                      <td>Rp {item.dp.toLocaleString('id-ID')}</td>
                      <td>Rp {item.cicilan.toLocaleString('id-ID')}</td>
                      <td>Rp {item.investasi.toLocaleString('id-ID')}</td>
                      <td><strong>Rp {item.totalPendapatan.toLocaleString('id-ID')}</strong></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <p className="text-muted">Tidak ada data pendapatan</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h5>Tabel Data Pengeluaran</h5>
                </Col>
              </Row>
            </Card.Header>
            <Table responsive className="align-items-center table-flush">
              <thead className="thead-light">
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Keterangan</th>
                  <th scope="col">Jumlah Pengeluaran</th>
                </tr>
              </thead>
              <tbody>
                {pengeluaranTableData.length > 0 ? (
                  pengeluaranTableData.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.tanggal}</td>
                      <td>{item.keterangan}</td>
                      <td><strong>Rp {item.jumlah.toLocaleString('id-ID')}</strong></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
                      <p className="text-muted">Tidak ada data pengeluaran</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </>
  );
};