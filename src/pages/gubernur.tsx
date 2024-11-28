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
  const [overallData, setOverallData] = useState<ElectionData | null>(null);
  const [overallCandidates, setOverallCandidates] = useState<CandidateData | null>(null);

  // Add initial data fetch
  useEffect(() => {
    const fetchOverallData = async () => {
      try {
        const [dataRes, candidateRes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/razanfawwaz/pilkada-scrap/refs/heads/main/pkwkp/0.json'),
          fetch('https://raw.githubusercontent.com/razanfawwaz/pilkada-scrap/refs/heads/main/paslon/pkwkp.json')
        ]);
        
        const [data, candidates] = await Promise.all([
          dataRes.json(),
          candidateRes.json()
        ]);

        // Validate data matches expected format
        if (data?.mode === 'hhcw' && data?.tungsura?.chart?.progres) {
          setOverallData(data);
          setOverallCandidates(candidates);
        } else {
          console.error('Invalid data format received');
        }
      } catch (error) {
        console.error('Error fetching overall data:', error);
      }
    };

    fetchOverallData();
  }, []);

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
          fetch(`https://raw.githubusercontent.com/razanfawwaz/pilkada-scrap/refs/heads/main/pkwkp/${selectedProvince}/${selectedProvince}.json`),
          fetch('https://raw.githubusercontent.com/razanfawwaz/pilkada-scrap/refs/heads/main/paslon/pkwkp.json')
        ]);
        
        const [electionData, candidateData] = await Promise.all([
          electionRes.json(),
          candidateRes.json()
        ]);
        
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

    const provinceCode = selectedProvince.substring(0, 2);
    const provinceCandidates = candidates[provinceCode];

    return Object.entries(districtData)
      .filter(([key]) => key.startsWith('1000'))
      .map(([key, value]) => {
        const candidateInfo = provinceCandidates?.[key];
        return {
          id: key,
          value: typeof value === 'number' ? value : 0,
          label: candidateInfo?.nama || '',
          color: candidateInfo?.warna || '#000000'
        };
      });
  };

  const getOverallChartData = (provinceCode: string) => {
    if (!overallData || !overallCandidates) return [];

    const provinceData = overallData.tungsura.table[provinceCode];
    if (!provinceData) return [];

    const provinceCandidates = overallCandidates[provinceCode];

    return Object.entries(provinceData)
      .filter(([key]) => key.startsWith('1000'))
      .map(([key, value]) => {
        const candidateInfo = provinceCandidates?.[key];
        return {
          id: key,
          value: typeof value === 'number' ? value : 0,
          label: candidateInfo?.nama || '',
          color: candidateInfo?.warna || '#000000'
        };
      });
  };

  // Add clear filters function
  const clearFilters = () => {
    setSelectedProvince("");
    setSelectedDistrict("");
  };

  return (
    <main className={`${geistSans.variable} ${geistMono.variable} min-h-screen p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]`}>
      <div className="container mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold mb-6">Hasil Pilkada 2024 - Pemilihan Gubernur/Wakil Gubernur</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Data yang ditampilkan hasil scrapping dari <a href="https://pilkada2024.kpu.go.id" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400">https://pilkada2024.kpu.go.id/</a> kode program dan data scrapping dapat dilihat di <a href="https://github.com/razanfawwaz/pilkada-scrap" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400">https://github.com/razanfawwaz/pilkada-scrap.</a> Situs ini bertujuan untuk memudahkan melihat grafis, untuk data yang lebih akurat silahkan melihat di <a href="https://pilkada2024.kpu.go.id" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400">https://pilkada2024.kpu.go.id/</a></p>

        <Link href="/" className="text-blue-600 dark:text-blue-400 py-2 px-4 mt-4 inline-block bg-blue-100 rounded-md">Lihat Data Bupati/Wali Kota</Link>
    
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

            {/* Add clear filters button */}
            <button
              onClick={clearFilters}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>

          {/* Progress information - Only show when a province is selected */}
          {data && selectedProvince && (
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

        {/* District Charts Grid - Only show when a province is selected */}
        {data && candidates && selectedProvince && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data.tungsura.table)
              .filter(([districtCode]) => !selectedDistrict || districtCode === selectedDistrict)
              .map(([districtCode, districtData]) => {
                const chartData = getChartData(districtCode);
                const districtInfo = districts.find(d => d.kode === districtCode);
                const total = chartData.reduce((sum, item) => sum + item.value, 0);
                const districtProgress = districtData.progres;

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
                          title: String(item.label),
                          value: item.value,
                          color: String(item.color)
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
                              style={{ backgroundColor: String(item.color) }}
                            />
                            <span>{String(item.label)}</span>
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

        {/* Overall data - Only show when no province is selected */}
        {!selectedProvince && overallData && (
          <>
            {/* National Progress Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-300 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4">National Progress</h2>
              <div className="mb-2">
                Progress: {overallData.progres.progres.toLocaleString()} / {overallData.progres.total.toLocaleString()} TPS
                ({((overallData.progres.progres / overallData.progres.total) * 100).toFixed(2)}%)
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(overallData.progres.progres / overallData.progres.total * 100)}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Last Updated: {new Date(overallData.ts).toLocaleString()}
              </div>
            </div>

            {/* Province Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(overallData.tungsura.table).map(provinceCode => {
                const chartData = getOverallChartData(provinceCode);
                const provinceInfo = provinces.find(p => p.kode === provinceCode);
                const total = chartData.reduce((sum, item) => sum + item.value, 0);
                const provinceProgress = overallData.tungsura.table[provinceCode].progres;

                return (
                  <div key={provinceCode} className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-300 dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-4">{provinceInfo?.nama || `Province ${provinceCode}`}</h3>
                    
                    <div className="mb-4">
                      <div className="text-sm mb-2">
                        Progress: {provinceProgress.progres.toLocaleString()} / {provinceProgress.total.toLocaleString()} TPS ({((provinceProgress.progres / provinceProgress.total) * 100).toFixed(2)}%)
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(provinceProgress.progres / provinceProgress.total * 100)}%` }}
                        />
                      </div>
                    </div>

                    {chartData.length > 0 && (
                      <>
                        <div className="aspect-square relative mb-4">
                          <PieChart
                            data={chartData.map(item => ({
                              title: String(item.label),
                              value: item.value,
                              color: String(item.color)
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
                                  style={{ backgroundColor: String(item.color) }}
                                />
                                <span>{String(item.label)}</span>
                              </div>
                              <span className="font-mono">{item.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
