import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts'

// ── helpers ─────────────────────────────────────────────────────
const CORR_POS = (v) => `rgba(108,92,231,${Math.min(Math.abs(v), 1).toFixed(2)})`
const CORR_NEG = (v) => `rgba(245,86,108,${Math.min(Math.abs(v), 1).toFixed(2)})`

function EDASection({ eda }) {
    if (!eda) return null
    return (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="section-title">🔍 Exploratory Data Analysis</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Class Distribution */}
                {eda.class_distribution && (
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                            📊 Class Distribution
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={eda.class_distribution} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,92,231,0.1)" />
                                <XAxis dataKey="class" tick={{ fill: '#9090c0', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#9090c0', fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: 'rgba(26,26,58,0.95)', border: '1px solid rgba(108,92,231,0.3)', borderRadius: '8px', color: '#e8e8ff' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {eda.class_distribution.map((_, i) => (
                                        <Cell key={i} fill={['#6c5ce7', '#4facfe', '#f093fb'][i % 3]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

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
                                            <td style={{ fontWeight: 600, color: 'var(--color-accent-purple)', fontSize: '11px' }}>{f.feature}</td>
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


const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

const HEATMAP_COLORS = [
    'rgba(108, 92, 231, 0.05)',
    'rgba(108, 92, 231, 0.15)',
    'rgba(108, 92, 231, 0.3)',
    'rgba(108, 92, 231, 0.5)',
    'rgba(108, 92, 231, 0.7)',
    'rgba(108, 92, 231, 0.85)',
    'rgba(108, 92, 231, 1)',
]

function getHeatmapColor(value, maxVal) {
    if (maxVal === 0) return HEATMAP_COLORS[0]
    const ratio = value / maxVal
    const idx = Math.min(Math.floor(ratio * (HEATMAP_COLORS.length - 1)), HEATMAP_COLORS.length - 1)
    return HEATMAP_COLORS[idx]
}

export default function Classification() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('idle')
    const [data, setData] = useState(null)
    const [visibleLogs, setVisibleLogs] = useState([])
    const [availableDatasets, setAvailableDatasets] = useState(null)
    const [selectedDataset, setSelectedDataset] = useState('iris')
    const [fetchError, setFetchError] = useState(null)
    const logRef = useRef(null)

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                const res = await fetch(`${API_URL}/api/classification/datasets`)
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
            const res = await fetch(`${API_URL}/api/classification/train?dataset=${selectedDataset}`)
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

    const maxCMVal = data?.confusion_matrix
        ? Math.max(...data.confusion_matrix.matrix.flat())
        : 1

    return (
        <div className="page-wrapper">
            <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>

            <div style={{ marginTop: '16px', marginBottom: '32px' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    }}>🎯</div>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800 }} className="gradient-text-purple">Classification</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                            Pick a dataset to classify samples into categories
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
                                        border: selectedDataset === ds.id ? '1px solid var(--color-accent-purple)' : '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.2s ease',
                                        background: selectedDataset === ds.id ? 'rgba(108, 92, 231, 0.1)' : 'rgba(255,255,255,0.02)'
                                    }}
                                    onClick={() => setSelectedDataset(ds.id)}
                                >
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: selectedDataset === ds.id ? 'var(--color-accent-purple)' : '#fff' }}>{ds.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
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
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Classes</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.dataset.classes}</div>
                            </div>
                            <div className="metric-card">
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '4px' }}>Best Model</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent-purple)' }}>{data.best_model}</div>
                            </div>
                        </div>
                    </div>

                    {/* EDA */}
                    <EDASection eda={data.eda} />

                    {/* Model Comparison Table */}
                    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <div className="section-title">📊 Model Comparison</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="metrics-table">
                                <thead>
                                    <tr>
                                        <th>Model</th>
                                        <th>Accuracy</th>
                                        <th>Precision</th>
                                        <th>Recall</th>
                                        <th>F1 Score</th>
                                        <th>Train Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.metrics.map(m => (
                                        <tr key={m.model} className={m.model === data.best_model ? 'best-row' : ''}>
                                            <td>
                                                {m.model === data.best_model && <span style={{ marginRight: '8px' }}>🏆</span>}
                                                {m.model}
                                            </td>
                                            <td>{(m.accuracy * 100).toFixed(1)}%</td>
                                            <td>{(m.precision * 100).toFixed(1)}%</td>
                                            <td>{(m.recall * 100).toFixed(1)}%</td>
                                            <td>{(m.f1_score * 100).toFixed(1)}%</td>
                                            <td>{m.train_time}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                        {/* Confusion Matrix */}
                        {data.confusion_matrix && (
                            <div className="chart-container">
                                <div className="section-title" style={{ fontSize: '16px' }}>🔢 Confusion Matrix (Best Model)</div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    {data.confusion_matrix.labels.map(l => (
                                        <span key={l} className="badge badge-purple">{l}</span>
                                    ))}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: `80px repeat(${data.confusion_matrix.labels.length}, 1fr)`,
                                    gap: '4px',
                                }}>
                                    {/* Header row */}
                                    <div />
                                    {data.confusion_matrix.labels.map(l => (
                                        <div key={`h-${l}`} style={{
                                            textAlign: 'center', fontSize: '11px', fontWeight: 600,
                                            color: 'var(--color-text-muted)', padding: '8px 4px',
                                        }}>
                                            {l}
                                        </div>
                                    ))}
                                    {/* Data rows */}
                                    {data.confusion_matrix.matrix.map((row, ri) => (
                                        <>
                                            <div key={`l-${ri}`} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)',
                                                paddingRight: '8px',
                                            }}>
                                                {data.confusion_matrix.labels[ri]}
                                            </div>
                                            {row.map((val, ci) => (
                                                <div
                                                    key={`${ri}-${ci}`}
                                                    className="confusion-cell"
                                                    style={{
                                                        background: getHeatmapColor(val, maxCMVal),
                                                        color: val / maxCMVal > 0.5 ? '#fff' : 'var(--color-text-secondary)',
                                                    }}
                                                >
                                                    {val}
                                                </div>
                                            ))}
                                        </>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Per-class Metrics */}
                        {data.per_class_metrics && (
                            <div className="chart-container">
                                <div className="section-title" style={{ fontSize: '16px' }}>📌 Per-Class Performance</div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.per_class_metrics} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                        <XAxis dataKey="class" tick={{ fill: '#9090c0', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#9090c0', fontSize: 12 }} domain={[0, 1]} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(26, 26, 58, 0.95)',
                                                border: '1px solid rgba(108, 92, 231, 0.3)',
                                                borderRadius: '8px',
                                                color: '#e8e8ff',
                                            }}
                                        />
                                        <Bar dataKey="precision" name="Precision" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="recall" name="Recall" fill="#4facfe" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="f1_score" name="F1 Score" fill="#f093fb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Feature Importance */}
                    {data.feature_importance && data.feature_importance.length > 0 && (
                        <div className="chart-container" style={{ marginBottom: '24px' }}>
                            <div className="section-title" style={{ fontSize: '16px' }}>📌 Feature Importance</div>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={data.feature_importance} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 120 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                                    <XAxis type="number" tick={{ fill: '#9090c0', fontSize: 12 }} />
                                    <YAxis dataKey="feature" type="category" tick={{ fill: '#9090c0', fontSize: 11 }} width={120} />
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
                                            <Cell key={i} fill={`hsl(${260 + i * 20}, 70%, ${60 - i * 5}%)`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                        <button className="btn-secondary" onClick={() => { setStatus('idle'); setData(null); setVisibleLogs([]) }}>
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
