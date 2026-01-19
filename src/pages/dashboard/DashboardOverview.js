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

// Helper untuk parsing string rupiah (misal: 'Rp 10.000.000' => 10000000)
function parseRupiah(val) {
  if (typeof val === 'number') return val;
  if (!val || val === '-' || val === null) return 0;
  if (typeof val === 'string') {
    // Hilangkan Rp, titik, spasi
    const cleaned = val.replace(/[^\d]/g, '');
    return Number(cleaned) || 0;
  }
  return 0;
}
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
        const [kavlingRes, kasRes] = await Promise.all([
          fetch("http://localhost:4000/api/kavlings"),
          fetch("http://localhost:4000/api/kas")
        ]);
        if (!kavlingRes.ok) throw new Error("Failed to fetch kavlings");
        if (!kasRes.ok) throw new Error("Failed to fetch kas");
        const kavlings = await kavlingRes.json();
        const kasData = await kasRes.json();

        // --- AGREGASI DATA PER BULAN ---
        // Format: { [bulanKey]: { dp, cicilan, investasi, pengeluaran, keteranganPengeluaran: Set } }
        const rekapPerBulan = {};

        // 1. Proses Data Kavling (DP & Cicilan)
        kavlings.forEach(k => {
          // Tanggal pembayaran: gunakan field 'tanggal_pembayaran' jika ada, jika tidak pakai 'tanggal' (fallback)
          const tgl_raw = k.tanggal_pembayaran || k.tanggal || k.createdAt || "";
          const tgl = tgl_raw ? new Date(tgl_raw) : null;
          if (!tgl || isNaN(tgl)) return;
          const bulanKey = `${tgl.getFullYear()}-${(tgl.getMonth()+1).toString().padStart(2,'0')}`;
          if (!rekapPerBulan[bulanKey]) {
            rekapPerBulan[bulanKey] = { dp: 0, cicilan: 0, investasi: 0, pengeluaran: 0, keteranganPengeluaran: new Set() };
          }
          // DP: gunakan field 'pembayaran_dp' atau 'dp' atau 'PEMBAYARAN_DP'
          const dp = parseRupiah(k.pembayaran_dp || k.dp || k.PEMBAYARAN_DP || 0);
          rekapPerBulan[bulanKey].dp += dp;
          // Cicilan: ambil dari pembayaran_1, pembayaran_2, pembayaran_3, pembayaran_4, pembayaran_5 jika ada
          let cicilan = 0;
          for (let i = 1; i <= 5; i++) {
            const key = `pembayaran_${i}`;
            if (k[key]) {
              cicilan += parseRupiah(k[key]);
            }
          }
          rekapPerBulan[bulanKey].cicilan += cicilan;
        });

        // 2. Proses Data Kas (Investasi & Pengeluaran)
        kasData.forEach(kas => {
          const tgl_raw = kas.tanggal || kas.createdAt || "";
          const tgl = tgl_raw ? new Date(tgl_raw) : null;
          if (!tgl || isNaN(tgl)) return;
          const bulanKey = `${tgl.getFullYear()}-${(tgl.getMonth()+1).toString().padStart(2,'0')}`;
          if (!rekapPerBulan[bulanKey]) {
            rekapPerBulan[bulanKey] = { dp: 0, cicilan: 0, investasi: 0, pengeluaran: 0, keteranganPengeluaran: new Set() };
          }
          // Investasi: nama mengandung "investasi"
          if (kas.nama && kas.nama.toLowerCase().includes('investasi')) {
            const investasi = parseRupiah(kas.uangMasuk || kas.uang_masuk || 0);
            rekapPerBulan[bulanKey].investasi += investasi;
          }
          // Pengeluaran: jika harga > 0
          const hargaPengeluaran = parseRupiah(kas.harga || kas.HARGA || 0);
          if (hargaPengeluaran > 0) {
            rekapPerBulan[bulanKey].pengeluaran += hargaPengeluaran;
            if (kas.nama) rekapPerBulan[bulanKey].keteranganPengeluaran.add(kas.nama);
          }
        });

        // 3. Generate Data Tabel Pendapatan & Pengeluaran
        const sortedKeys = Object.keys(rekapPerBulan).sort((a, b) => b.localeCompare(a));

        // Data Tabel Pendapatan
        const pendapatanTableData = sortedKeys.map(bulanKey => {
          const [year, month] = bulanKey.split('-');
          const bulanTahun = `${new Date(year, parseInt(month)-1, 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;
          const data = rekapPerBulan[bulanKey];
          const totalPendapatan = (data.dp || 0) + (data.cicilan || 0) + (data.investasi || 0) - (data.pengeluaran || 0);
          return {
            id: bulanKey,
            tanggal: bulanTahun,
            tanggalSort: new Date(year, parseInt(month)-1, 1).getTime(),
            dp: data.dp || 0,
            cicilan: data.cicilan || 0,
            investasi: data.investasi || 0,
            pengeluaran: data.pengeluaran || 0,
            totalPendapatan: totalPendapatan
          };
        }).filter(item => item.dp > 0 || item.cicilan > 0 || item.investasi > 0 || item.pengeluaran > 0);
        setPendapatanTableData(pendapatanTableData);

        // Data Tabel Pengeluaran
        const pengeluaranData = sortedKeys.map(bulanKey => {
          const [year, month] = bulanKey.split('-');
          const bulanTahun = `${new Date(year, parseInt(month)-1, 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;
          const data = rekapPerBulan[bulanKey];
          const keteranganStr = Array.from(data.keteranganPengeluaran).join(', ') || '-';
          return {
            id: bulanKey,
            tanggal: bulanTahun,
            tanggalSort: new Date(year, parseInt(month)-1, 1).getTime(),
            keterangan: keteranganStr,
            jumlah: data.pengeluaran || 0
          };
        }).filter(item => item.jumlah > 0);
        setPengeluaranTableData(pengeluaranData);

        // Total pengeluaran (untuk widget ringkasan)
        const totalPengeluaranVal = pengeluaranData.reduce((sum, curr) => sum + (curr.jumlah || 0), 0);
        setTotalPengeluaran(totalPengeluaranVal);

        // Untuk chart bulanan (jika ingin menampilkan total pendapatan per bulan)
        const chartLabels = sortedKeys.map(key => {
          const [y,m]=key.split('-');
          return `${new Date(y,parseInt(m)-1,1).toLocaleString('default',{month:'short'})} ${y}`;
        });
        const chartSeries = [sortedKeys.map(k=>{
          const d = rekapPerBulan[k];
          return (d.dp||0)+(d.cicilan||0)+(d.investasi||0)-(d.pengeluaran||0);
        })];
        setPendapatanChartData({labels: chartLabels, series: chartSeries});
        setPendapatan(pendapatanTableData.length > 0 ? pendapatanTableData[0].totalPendapatan : 0);
        let percent = pendapatanTableData.length > 1 && pendapatanTableData[1].totalPendapatan !== 0
          ? (((pendapatanTableData[0].totalPendapatan - pendapatanTableData[1].totalPendapatan) / pendapatanTableData[1].totalPendapatan) * 100).toFixed(1)
          : (pendapatanTableData[0]?.totalPendapatan > 0 ? 100 : 0);
        setPendapatanPercentage(percent);

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