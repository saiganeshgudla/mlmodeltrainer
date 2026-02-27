import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts'

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const CLUSTER_COLORS = ['#6c5ce7', '#4facfe', '#f093fb', '#2ed573', '#ffa502', '#f5576c', '#00d2ff']

// ── EDA ──────────────────────────────────────────────────────────
const CORR_POS = (v) => `rgba(240,147,251,${Math.min(Math.abs(v), 1).toFixed(2)})`
const CORR_NEG = (v) => `rgba(245,86,108,${Math.min(Math.abs(v), 1).toFixed(2)})`

function EDASection({ eda }) {
    if (!eda) return null
    return (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="section-title">🔍 Exploratory Data Analysis</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

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
                                            <td style={{ fontWeight: 600, color: 'var(--color-accent-pink)', fontSize: '11px' }}>{f.feature}</td>
                                            <td>{f.mean}</td><td>{f.std}</td><td>{f.min}</td><td>{f.max}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Correlation Heatmap */}
                {eda.correlation && (
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                            🔗 Feature Correlation Matrix
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `64px repeat(${eda.correlation.labels.length}, 1fr)`,
                            gap: '3px',
                            fontSize: '10px',
                        }}>
                            <div />
                            {eda.correlation.labels.map(l => (
                                <div key={l} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '4px 2px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l}>
                                    {l.split(' ')[0]}
                                </div>
                            ))}
                            {eda.correlation.matrix.map((row, ri) => (
                                <>
                                    <div key={`l-${ri}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--color-text-muted)', paddingRight: '6px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={eda.correlation.labels[ri]}>
                                        {eda.correlation.labels[ri].split(' ')[0]}
                                    </div>
                                    {row.map((val, ci) => (
                                        <div key={`${ri}-${ci}`} style={{
                                            background: val >= 0 ? CORR_POS(val) : CORR_NEG(val),
                                            borderRadius: '4px', padding: '6px 2px',
                                            textAlign: 'center', fontWeight: 700,
                                            color: Math.abs(val) > 0.5 ? '#fff' : 'var(--color-text-secondary)',
                                            border: ri === ci ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                        }}>
                                            {val.toFixed(2)}
                                        </div>
                                    ))}
                                </>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


export default function Clustering() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('idle')
    const [data, setData] = useState(null)
    const [visibleLogs, setVisibleLogs] = useState([])
    const [showTrue, setShowTrue] = useState(false)
    const [availableDatasets, setAvailableDatasets] = useState(null)
    const [selectedDataset, setSelectedDataset] = useState('iris')
    const [fetchError, setFetchError] = useState(null)
    const logRef = useRef(null)

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                const res = await fetch(`${API_URL}/api/clustering/datasets`)
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
            const res = await fetch(`${API_URL}/api/clustering/train?dataset=${selectedDataset}`)
            const result = await res.json()
            setData(result)

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
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, [visibleLogs])

    // Group chart data by cluster for scatter plot
    const groupedData = {}
    if (data?.chart_data) {
        data.chart_data.forEach(d => {
            if (!groupedData[d.cluster]) groupedData[d.cluster] = []
            groupedData[d.cluster].push(d)
        })
    }

    const groupedTrue = {}
    if (data?.true_chart_data) {
        data.true_chart_data.forEach(d => {
            if (!groupedTrue[d.label]) groupedTrue[d.label] = []
            groupedTrue[d.label].push(d)
        })
    }

    return (
        <div className="page-wrapper">
            <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>

            <div style={{ marginTop: '16px', marginBottom: '32px' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    }}>🔮</div>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800 }} className="gradient-text-pink">Clustering</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                            Pick a dataset to find natural groupings in data
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                            {availableDatasets.map(ds => (
                                <div
                                    key={ds.id}
                                    className={`glass-card ${selectedDataset === ds.id ? 'dataset-card-active' : ''}`}
                                    style={{
                                        padding: '16px',
                                        cursor: 'pointer',
                                        border: selectedDataset === ds.id ? '1px solid var(--color-accent-pink)' : '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.2s ease',
                                        background: selectedDataset === ds.id ? 'rgba(240, 147, 251, 0.1)' : 'rgba(255,255,255,0.02)'
                                    }}
                                    onClick={() => setSelectedDataset(ds.id)}
                                >
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: selectedDataset === ds.id ? 'var(--color-accent-pink)' : '#fff' }}>{ds.name}</div>
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
                            <div key={i} className="log-entry" style={{ animationDelay: `${i * 0.05}s` }}>{log}</div>
                        ))}
                    </div>
                </div>
            )}

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
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.samples}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Features</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.features}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Best Model</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent-pink)' }}>{data.best_model}</div>
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
                                        <th>Clusters</th>
                                        <th>Noise Points</th>
                                        <th>Silhouette</th>
                                        <th>Calinski-Harabasz</th>
                                        <th>Davies-Bouldin</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.metrics.map(m => (
                                        <tr key={m.model} className={m.model === data.best_model ? 'best-row' : ''}>
                                            <td>
                                                {m.model === data.best_model && <span style={{ marginRight: '8px' }}>🏆</span>}
                                                {m.model}
                                            </td>
                                            <td>{m.n_clusters}</td>
                                            <td>{m.n_noise}</td>
                                            <td>{m.silhouette ?? '—'}</td>
                                            <td>{m.calinski_harabasz ?? '—'}</td>
                                            <td>{m.davies_bouldin ?? '—'}</td>
                                            <td>{m.train_time}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cluster Visualization */}
                    <div className="chart-container" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div className="section-title" style={{ fontSize: '16px', margin: 0 }}>
                                🔬 {showTrue ? 'True Labels (Ground Truth)' : 'Predicted Clusters'} — PCA 2D Projection
                            </div>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowTrue(!showTrue)}
                                style={{ fontSize: '12px', padding: '6px 16px' }}
                            >
                                {showTrue ? 'Show Predicted' : 'Show True Labels'}
                            </button>
                        </div>

                        {data.pca_variance && (
                            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                                <span className="badge badge-pink">PC1: {(data.pca_variance.pc1 * 100).toFixed(1)}% variance</span>
                                <span className="badge badge-purple">PC2: {(data.pca_variance.pc2 * 100).toFixed(1)}% variance</span>
                            </div>
                        )}

                        <ResponsiveContainer width="100%" height={400}>
                            <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                <XAxis
                                    dataKey="x" name="PC1" type="number"
                                    tick={{ fill: '#9090c0', fontSize: 12 }}
                                    label={{ value: 'Principal Component 1', position: 'bottom', fill: '#9090c0', fontSize: 12 }}
                                />
                                <YAxis
                                    dataKey="y" name="PC2" type="number"
                                    tick={{ fill: '#9090c0', fontSize: 12 }}
                                    label={{ value: 'PC2', angle: -90, position: 'left', fill: '#9090c0', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(26, 26, 58, 0.95)',
                                        border: '1px solid rgba(108, 92, 231, 0.3)',
                                        borderRadius: '8px',
                                        color: '#e8e8ff',
                                    }}
                                    content={({ payload }) => {
                                        if (!payload || !payload.length) return null
                                        const d = payload[0].payload
                                        return (
                                            <div style={{
                                                background: 'rgba(26, 26, 58, 0.95)',
                                                border: '1px solid rgba(108, 92, 231, 0.3)',
                                                borderRadius: '8px',
                                                padding: '10px 14px',
                                                color: '#e8e8ff',
                                                fontSize: '13px',
                                            }}>
                                                <div>PC1: {d.x}</div>
                                                <div>PC2: {d.y}</div>
                                                <div>{showTrue ? `Label: ${d.label}` : `Cluster: ${d.cluster}`}</div>
                                                {!showTrue && d.true_label && <div>True: {d.true_label}</div>}
                                            </div>
                                        )
                                    }}
                                />
                                <Legend />
                                {showTrue
                                    ? Object.entries(groupedTrue).map(([label, points], i) => (
                                        <Scatter
                                            key={label}
                                            name={label}
                                            data={points}
                                            fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                                            fillOpacity={0.7}
                                            r={5}
                                        />
                                    ))
                                    : Object.entries(groupedData).map(([cluster, points], i) => (
                                        <Scatter
                                            key={cluster}
                                            name={`Cluster ${cluster}`}
                                            data={points}
                                            fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                                            fillOpacity={0.7}
                                            r={5}
                                        />
                                    ))
                                }
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <button className="btn-secondary" onClick={() => { setStatus('idle'); setData(null); setVisibleLogs([]); setShowTrue(false) }}>
                            🔄 Train Again
                        </button>
                    </div>
                </div>
            )}

            {status === 'training' && !data && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                    <div className="spinner" />
                </div>
            )}
        </div>
    )
}
