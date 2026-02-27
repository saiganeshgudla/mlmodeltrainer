import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'

// ── EDA helpers ────────────────────────────────────────────────
function EDASection({ eda }) {
    if (!eda) return null
    return (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="section-title">🔍 Exploratory Data Analysis</div>

            {/* Target Distribution */}
            {eda.target_distribution && (
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                        📊 Target Distribution ({eda.target_name || 'Target'})
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={eda.target_distribution} margin={{ top: 4, right: 16, bottom: 32, left: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,172,254,0.1)" />
                            <XAxis dataKey="range" tick={{ fill: '#9090c0', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                            <YAxis tick={{ fill: '#9090c0', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: 'rgba(26,26,58,0.95)', border: '1px solid rgba(79,172,254,0.3)', borderRadius: '8px', color: '#e8e8ff' }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {eda.target_distribution.map((_, i) => (
                                    <Cell key={i} fill={`hsl(${200 + i * 8}, 75%, ${55 - i * 1}%)`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                {/* Feature Stats Table */}
                {eda.feature_stats && (
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                            📋 Feature Statistics
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="metrics-table" style={{ fontSize: '12px' }}>
                                <thead>
                                    <tr><th>Feature</th><th>Mean</th><th>Std</th><th>Min</th><th>Max</th></tr>
                                </thead>
                                <tbody>
                                    {eda.feature_stats.map(f => (
                                        <tr key={f.feature}>
                                            <td style={{ fontWeight: 600, color: 'var(--color-accent-blue)' }}>{f.feature}</td>
                                            <td>{f.mean}</td><td>{f.std}</td><td>{f.min}</td><td>{f.max}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Feature-Target Correlations */}
                {eda.correlations && (
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                            🔗 Feature–Target Correlation
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={eda.correlations} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 56 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,172,254,0.1)" />
                                <XAxis type="number" domain={[-1, 1]} tick={{ fill: '#9090c0', fontSize: 11 }} />
                                <YAxis dataKey="feature" type="category" tick={{ fill: '#9090c0', fontSize: 10 }} width={56} />
                                <Tooltip contentStyle={{ background: 'rgba(26,26,58,0.95)', border: '1px solid rgba(79,172,254,0.3)', borderRadius: '8px', color: '#e8e8ff' }} formatter={v => v.toFixed(4)} />
                                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                                <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                                    {eda.correlations.map((d, i) => (
                                        <Cell key={i} fill={d.correlation >= 0 ? '#4facfe' : '#f5576c'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export default function Regression() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('idle') // idle | training | done
    const [data, setData] = useState(null)
    const [visibleLogs, setVisibleLogs] = useState([])
    const [availableDatasets, setAvailableDatasets] = useState(null)
    const [selectedDataset, setSelectedDataset] = useState('california')
    const [fetchError, setFetchError] = useState(null)
    const logRef = useRef(null)

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                const res = await fetch(`${API_URL}/api/regression/datasets`)
                if (!res.ok) throw new Error(`Server returned ${res.status}`)
                const dsets = await res.json()
                setAvailableDatasets(dsets)
                setFetchError(null)
            } catch (err) {
                console.error("Failed to fetch datasets", err)
                setFetchError(err.message)
                setAvailableDatasets([])
            }
        }
        fetchDatasets()
    }, [])

    const startTraining = async () => {
        setStatus('training')
        setVisibleLogs(['🚀 Initializing training request...'])
        setData(null)

        try {
            const res = await fetch(`${API_URL}/api/regression/train?dataset=${selectedDataset}`)
            const result = await res.json()
            setData(result)

            // Animate logs one by one
            result.logs.forEach((log, i) => {
                setTimeout(() => {
                    setVisibleLogs(prev => [...prev, log])
                }, i * 300)
            })

            setTimeout(() => setStatus('done'), result.logs.length * 300 + 200)
        } catch (err) {
            setVisibleLogs(prev => [...prev, `❌ Error: ${err.message}`])
            setStatus('idle')
        }
    }

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight
        }
    }, [visibleLogs])

    return (
        <div className="page-wrapper">
            {/* Back + Title */}
            <button className="back-btn" onClick={() => navigate('/')}>
                ← Back to Home
            </button>

            <div style={{ marginTop: '16px', marginBottom: '32px' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4facfe, #00d2ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    }}>📈</div>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800 }} className="gradient-text-blue">Regression</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                            Pick a dataset and predict numerical values
                        </p>
                    </div>
                </div>
            </div>

            {/* Selector */}
            {status === 'idle' && (
                <div className="fade-in" style={{ marginBottom: '32px' }}>
                    <div className="section-title">📁 Select Dataset</div>

                    {availableDatasets === null && (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
                            <div className="pulse-dot" style={{ display: 'inline-block', marginRight: '8px' }} />
                            Connecting to backend...
                        </div>
                    )}

                    {fetchError && (
                        <div style={{
                            background: 'rgba(255, 71, 87, 0.1)',
                            border: '1px solid rgba(255, 71, 87, 0.2)',
                            borderRadius: '12px',
                            padding: '16px',
                            color: '#ff4757',
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>
                            <strong>Connection Error:</strong> {fetchError}<br />
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>
                                Ensure the backend is running and `VITE_API_BASE_URL` is set correctly.
                            </span>
                        </div>
                    )}

                    {availableDatasets && availableDatasets.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {availableDatasets.map(ds => (
                                <div
                                    key={ds.id}
                                    className={`glass-card ${selectedDataset === ds.id ? 'dataset-card-active' : ''}`}
                                    style={{
                                        padding: '16px',
                                        cursor: 'pointer',
                                        border: selectedDataset === ds.id ? '1px solid var(--color-accent-blue)' : '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.2s ease',
                                        background: selectedDataset === ds.id ? 'rgba(79, 172, 254, 0.1)' : 'rgba(255,255,255,0.02)'
                                    }}
                                    onClick={() => setSelectedDataset(ds.id)}
                                >
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: selectedDataset === ds.id ? 'var(--color-accent-blue)' : '#fff' }}>{ds.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Start Button */}
            {status === 'idle' && (
                <div style={{ textAlign: 'center', padding: '16px 0' }} className="fade-in">
                    <button className="btn-primary" onClick={startTraining} style={{ fontSize: '16px', padding: '16px 48px' }}>
                        🚀 Start Training
                    </button>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '12px' }}>
                        Selected: {availableDatasets?.find(d => d.id === selectedDataset)?.name || selectedDataset}
                    </p>
                </div>
            )}

            {/* Training Logs */}
            {(status === 'training' || visibleLogs.length > 0) && (
                <div className="fade-in" style={{ marginBottom: '32px' }}>
                    <div className="section-title">
                        {status === 'training' && <div className="pulse-dot" />}
                        <span>{status === 'training' ? 'Training in Progress...' : 'Training Log'}</span>
                    </div>
                    <div className="log-container" ref={logRef}>
                        {visibleLogs.map((log, i) => (
                            <div key={i} className="log-entry" style={{ animationDelay: `${i * 0.05}s` }}>
                                {log}
                            </div>
                        ))}
                        {status === 'training' && visibleLogs.length === 1 && (
                            <div className="log-entry" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                                ⏳ This may take up to 60 seconds for large datasets like California Housing...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Results */}
            {status === 'done' && data && (
                <div className="fade-in">
                    {/* Dataset Info */}
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <div className="section-title">📋 Dataset Info</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Dataset</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.name}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Samples</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.samples.toLocaleString()}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Features</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.features}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Target Variable</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent-blue)' }}>{data.dataset.target_name || 'Value'}</div>
                            </div>
                        </div>
                    </div>

                    {/* EDA */}
                    <EDASection eda={data.eda} />

                    {/* Metrics Table */}
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <div className="section-title">📊 Model Comparison</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="metrics-table">
                                <thead>
                                    <tr>
                                        <th>Model</th>
                                        <th>R² Score</th>
                                        <th>RMSE</th>
                                        <th>MAE</th>
                                        <th>Train Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.metrics.map((m) => (
                                        <tr key={m.model} className={m.model === data.best_model ? 'best-row' : ''}>
                                            <td>
                                                {m.model === data.best_model && <span style={{ marginRight: '8px' }}>🏆</span>}
                                                {m.model}
                                            </td>
                                            <td>{m.r2}</td>
                                            <td>{m.rmse}</td>
                                            <td>{m.mae}</td>
                                            <td>{m.train_time}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                        {/* Predicted vs Actual */}
                        <div className="chart-container">
                            <div className="section-title" style={{ fontSize: '16px' }}>🎯 Predicted vs Actual</div>
                            <ResponsiveContainer width="100%" height={350}>
                                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                    <XAxis
                                        dataKey="actual" name="Actual" type="number"
                                        tick={{ fill: '#9090c0', fontSize: 12 }}
                                        label={{ value: 'Actual Value', position: 'bottom', fill: '#9090c0', fontSize: 12 }}
                                    />
                                    <YAxis
                                        dataKey="predicted" name="Predicted" type="number"
                                        tick={{ fill: '#9090c0', fontSize: 12 }}
                                        label={{ value: 'Predicted', angle: -90, position: 'left', fill: '#9090c0', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(26, 26, 58, 0.95)',
                                            border: '1px solid rgba(108, 92, 231, 0.3)',
                                            borderRadius: '8px',
                                            color: '#e8e8ff',
                                        }}
                                    />
                                    <Scatter data={data.chart_data} fill="#4facfe" fillOpacity={0.6} r={4} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Feature Importance */}
                        {data.feature_importance && data.feature_importance.length > 0 && (
                            <div className="chart-container">
                                <div className="section-title" style={{ fontSize: '16px' }}>📌 Feature Importance</div>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={data.feature_importance} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                        <XAxis type="number" tick={{ fill: '#9090c0', fontSize: 12 }} />
                                        <YAxis dataKey="feature" type="category" tick={{ fill: '#9090c0', fontSize: 12 }} width={80} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(26, 26, 58, 0.95)',
                                                border: '1px solid rgba(108, 92, 231, 0.3)',
                                                borderRadius: '8px',
                                                color: '#e8e8ff',
                                            }}
                                        />
                                        <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                                            {data.feature_importance.map((_, i) => (
                                                <Cell key={i} fill={`hsl(${220 + i * 15}, 80%, ${60 - i * 2}%)`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Train Again */}
                    <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <button className="btn-secondary" onClick={() => { setStatus('idle'); setData(null); setVisibleLogs([]) }}>
                            🔄 Train Again
                        </button>
                    </div>
                </div>
            )}

            {/* Loading Spinner */}
            {status === 'training' && !data && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                    <div className="spinner" />
                </div>
            )}
        </div>
    )
}
