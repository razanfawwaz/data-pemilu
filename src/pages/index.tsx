import localFont from "next/font/local";
import { useState, useEffect } from "react";
import provinces from "@/data/0.json";
import { PieChart } from 'react-minimal-pie-chart';
import Link from "next/link";

interface Candidate {
  ts: string;
  nama: string;
  warna: string;
  nomor_urut: number;
}

interface CandidateData {
  [key: string]: {
    [key: string]: Candidate;
  };
}

interface ElectionData {
  mode: string;
  psu: string;
  ts: string;
  progres: {
    total: number;
    progres: number;
    persen: number;
  };
  tungsura: {
    chart: {
      progres: {
        total: number;
        persen: number;
        progres: number;
      };
    };
    table: {
      [key: string]: {
        psu: string;
        progres: {
          total: number;
          persen: number;
          progres: number;
        };
        status_progress: boolean;
        [key: string]: string | number | {
          total: number;
          persen: number;
          progres: number;
        } | boolean;
      };
    };
  };
}

interface District {
  nama: string;
  id: number;
  kode: string;
  tingkat: number;
}

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [data, setData] = useState<ElectionData | null>(null);
  const [candidates, setCandidates] = useState<CandidateData | null>(null);

  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        return;
      }
      
      try {
        const response = await fetch(`https://raw.githubusercontent.com/razanfawwaz/pilkada-scrap/refs/heads/main/district/${selectedProvince}/${selectedProvince}.json`);
        const districtData = await response.json();
        setDistricts(districtData);
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  // Fetch election and candidate data
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProvince) return;
      
      try {
        const [electionRes, candidateRes] = await Promise.all([
          fetch(`https://raw.githubusercontent.com/razanfawwaz/pilkada-scrap/refs/heads/main/pkwkk/${selectedProvince}/${selectedProvince}.json`),
          fetch('https://raw.githubusercontent.com/razanfawwaz/pilkada-scrap/refs/heads/main/paslon/pkwkk.json')
        ]);
        
        const [electionData, candidateData] = await Promise.all([
          electionRes.json(),
          candidateRes.json()
        ]);

        console.log(electionData);
        
        setData(electionData);
        setCandidates(candidateData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [selectedProvince]);

  const getChartData = (districtCode: string) => {
    if (!data || !candidates) return [];

    const districtData = data.tungsura.table[districtCode];
    if (!districtData) return [];

    return Object.entries(districtData)
      .filter(([key]) => key !== 'psu' && key !== 'progres' && key !== 'status_progress')
      .map(([key, value]) => ({
        id: key,
        value: typeof value === 'number' ? value : 0,
        label: candidates[districtCode]?.[key]?.nama || '',
        color: candidates[districtCode]?.[key]?.warna || '#000000'
      }));
  };

  return (
    <main className={`${geistSans.variable} ${geistMono.variable} min-h-screen p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]`}>
      <div className="container mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold mb-6">Hasil Pilkada 2024 - Pemilihan Bupati/Walikota</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Data yang ditampilkan hasil scrapping dari <a href="https://pilkada2024.kpu.go.id" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400">https://pilkada2024.kpu.go.id/</a> kode program dan data scrapping dapat dilihat di <a href="https://github.com/razanfawwaz/pilkada-scrap" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400">https://github.com/razanfawwaz/pilkada-scrap.</a> Situs ini bertujuan untuk memudahkan melihat grafis, untuk data yang lebih akurat silahkan melihat di <a href="https://pilkada2024.kpu.go.id" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400">https://pilkada2024.kpu.go.id/</a></p>

        <Link href="/gubernur" className="text-blue-600 dark:text-blue-400 py-2 px-4 mt-4 inline-block bg-blue-100 rounded-md">Lihat Data Gubernur</Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dropdowns */}
          <div className="space-y-4">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.kode}>
                  {province.nama}
                </option>
              ))}
            </select>

            {/* Add District dropdown */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
            <option value="">All Kabupaten/Kota</option>
              {districts.map((district) => (
                <option key={district.id} value={district.kode}>
                  {district.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Progress information */}
          {data && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-300 dark:border-gray-700">
              <div className="mb-2">Progress: {data.progres.progres} TPS / {data.progres.total} TPS - {((data.progres.progres / data.progres.total) * 100).toFixed(2)}%</div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(data.progres.progres / data.progres.total * 100)}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Last Updated: {new Date(data.ts).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* District Charts Grid */}
        {data && candidates && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(data.tungsura.table)
              .filter(districtCode => !selectedDistrict || districtCode === selectedDistrict)
              .map(districtCode => {
                const chartData = getChartData(districtCode);
                const districtInfo = districts.find(d => d.kode === districtCode);
                const total = chartData.reduce((sum, item) => sum + item.value, 0);
                const districtProgress = data.tungsura.table[districtCode].progres;

                return (
                  <div key={districtCode} className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-300 dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-4">{districtInfo?.nama || `District ${districtCode}`}</h3>
                    
                    <div className="mb-4">
                      <div className="text-sm mb-2">
                        Progress: {districtProgress.progres} / {districtProgress.total} TPS ({districtProgress.persen.toFixed(2)}%)
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${districtProgress.persen}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="aspect-square relative mb-4">
                      <PieChart
                        data={chartData.map(item => ({
                          title: item.label,
                          value: item.value,
                          color: item.color
                        }))}
                        label={({ dataEntry }) => `${((dataEntry.value / total) * 100).toFixed(2)}%`}
                        labelStyle={{
                          fontSize: '0.25rem',
                          fontFamily: 'sans-serif',
                        }}
                        labelPosition={70}
                      />
                    </div>

                    <div className="space-y-2">
                      {chartData.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.label}</span>
                          </div>
                          <span className="font-mono">{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </main>
  );
}
