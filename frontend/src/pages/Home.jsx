import { useNavigate } from 'react-router-dom'

const categories = [
    {
        title: 'Regression',
        description: 'Predict continuous values using California Housing dataset. Compare Linear Regression, Decision Tree, Random Forest & Gradient Boosting.',
        icon: '📈',
        path: '/regression',
        cardClass: 'card-regression',
        badge: 'badge-blue',
        badgeText: 'Continuous',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00d2ff 100%)',
        metrics: ['R² Score', 'RMSE', 'MAE'],
        dataset: 'California Housing',
        models: 4,
    },
    {
        title: 'Classification',
        description: 'Classify iris flowers into species. Compare Logistic Regression, Decision Tree, Random Forest, SVM, KNN & Gradient Boosting.',
        icon: '🏷️',
        path: '/classification',
        cardClass: 'card-classification',
        badge: 'badge-purple',
        badgeText: 'Categorical',
        gradient: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
        metrics: ['Accuracy', 'Precision', 'F1 Score'],
        dataset: 'Iris',
        models: 6,
    },
    {
        title: 'Clustering',
        description: 'Discover hidden patterns without labels. Compare KMeans, Agglomerative Clustering & DBSCAN with PCA visualization.',
        icon: '🔮',
        path: '/clustering',
        cardClass: 'card-clustering',
        badge: 'badge-pink',
        badgeText: 'Unsupervised',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        metrics: ['Silhouette', 'Calinski-Harabasz', 'Davies-Bouldin'],
        dataset: 'Iris (Unlabeled)',
        models: 4,
    },
]

export default function Home() {
    const navigate = useNavigate()

    return (
        <div className="page-wrapper">
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: '64px', paddingTop: '40px' }} className="fade-in">
                <h1 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
                    <span className="gradient-text">Machine Learning</span>
                    <br />
                    <span style={{ color: 'var(--color-text-primary)' }}>Model Trainer</span>
                </h1>
                <p style={{
                    fontSize: '18px',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '600px',
                    margin: '0 auto 24px',
                    lineHeight: 1.6,
                }}>
                    Explore how <strong style={{ color: 'var(--color-accent-purple)' }}>Regression</strong>,{' '}
                    <strong style={{ color: 'var(--color-accent-blue)' }}>Classification</strong>, and{' '}
                    <strong style={{ color: 'var(--color-accent-pink)' }}>Clustering</strong> work using sklearn datasets.
                    Train models, see the process, and compare metrics — all in your browser.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-green">✨ No setup required</span>
                    <span className="badge badge-blue">📊 sklearn datasets</span>
                    <span className="badge badge-purple">⚡ Real-time training</span>
                </div>
            </div>

            {/* Category Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                marginBottom: '64px',
            }}>
                {categories.map((cat, i) => (
                    <div
                        key={cat.title}
                        className={`glass-card ${cat.cardClass} fade-in fade-in-delay-${i + 1}`}
                        onClick={() => navigate(cat.path)}
                        style={{ cursor: 'pointer', padding: '32px' }}
                    >
                        {/* Icon & Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '14px',
                                background: cat.gradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                            }}>
                                {cat.icon}
                            </div>
                            <span className={`badge ${cat.badge}`}>{cat.badgeText}</span>
                        </div>

                        {/* Title & Description */}
                        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{cat.title}</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                            {cat.description}
                        </p>

                        {/* Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginBottom: '20px',
                        }}>
                            <div style={{
                                background: 'rgba(10, 10, 26, 0.4)',
                                borderRadius: '10px',
                                padding: '12px',
                            }}>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Dataset</div>
                                <div style={{ fontSize: '14px', fontWeight: 600 }}>{cat.dataset}</div>
                            </div>
                            <div style={{
                                background: 'rgba(10, 10, 26, 0.4)',
                                borderRadius: '10px',
                                padding: '12px',
                            }}>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Models</div>
                                <div style={{ fontSize: '14px', fontWeight: 600 }}>{cat.models} algorithms</div>
                            </div>
                        </div>

                        {/* Metrics preview */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {cat.metrics.map(m => (
                                <span key={m} style={{
                                    fontSize: '11px',
                                    color: 'var(--color-text-muted)',
                                    background: 'rgba(108, 92, 231, 0.08)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(108, 92, 231, 0.1)',
                                }}>
                                    {m}
                                </span>
                            ))}
                        </div>

                        {/* CTA */}
                        <div style={{
                            marginTop: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--color-text-secondary)',
                            fontSize: '14px',
                            fontWeight: 500,
                        }}>
                            <span>Train & Explore</span>
                            <span style={{ fontSize: '18px' }}>→</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                Built with <span style={{ color: 'var(--color-accent-purple)' }}>scikit-learn</span> •
                FastAPI • React
            </div>
        </div>
    )
}
