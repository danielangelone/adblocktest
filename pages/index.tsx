import { useState } from 'react';
import Head from 'next/head';
import adblockDomains from '../data/adblock-domains.json';

interface DomainResult {
  domain: string;
  blocked: boolean;
  testing?: boolean;
}

interface CategoryResult {
  category: string;
  provider: string;
  domains: DomainResult[];
  blockedCount: number;
  totalCount: number;
}

export default function Home() {
  const [results, setResults] = useState<CategoryResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [totalTests, setTotalTests] = useState(0);

  const prepareDomains = () => {
    const categories: CategoryResult[] = [];

    Object.entries(adblockDomains).forEach(([category, providers]) => {
      Object.entries(providers as Record<string, string[]>).forEach(([provider, domains]) => {
        categories.push({
          category,
          provider,
          domains: domains.map((domain) => ({
            domain,
            blocked: false,
            testing: false,
          })),
          blockedCount: 0,
          totalCount: domains.length,
        });
      });
    });

    return categories;
  };

  const testDomain = async (domain: string): Promise<DomainResult> => {
    const testUrl = `https://${domain}/adblock-test-${Date.now()}.js`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      // HEAD + no-cors: ideal para detectar bloqueio de rede
      await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return { domain, blocked: false };
    } catch (err) {
      // Qualquer falha de rede (incluindo abort por timeout) = bloqueado
      return { domain, blocked: true };
    }
  };

  const startTest = async () => {
    setIsTesting(true);
    setTestProgress(0);

    const categories = prepareDomains();
    setResults(categories);

    const total = categories.reduce((sum, cat) => sum + cat.domains.length, 0);
    setTotalTests(total);

    let completed = 0;

    for (const category of categories) {
      for (const domainResult of category.domains) {
        // Marcar como "testing"
        setResults((prev) =>
          prev.map((cat) =>
            cat.category === category.category && cat.provider === category.provider
              ? {
                  ...cat,
                  domains: cat.domains.map((d) =>
                    d.domain === domainResult.domain ? { ...d, testing: true } : d
                  ),
                }
              : cat
          )
        );

        // Executar teste
        const result = await testDomain(domainResult.domain);
        completed++;
        setTestProgress(completed);

        // Atualizar resultado
        setResults((prev) =>
          prev.map((cat) => {
            if (cat.category === category.category && cat.provider === category.provider) {
              const updatedDomains = cat.domains.map((d) =>
                d.domain === domainResult.domain ? { ...result, testing: false } : d
              );
              const blockedCount = updatedDomains.filter((d) => d.blocked).length;
              return { ...cat, domains: updatedDomains, blockedCount };
            }
            return cat;
          })
        );
      }
    }

    setIsTesting(false);
  };

  const getBlockedPercentage = (category: CategoryResult): number => {
    if (category.totalCount === 0) return 0;
    return Math.round((category.blockedCount / category.totalCount) * 100);
  };

  const getOverallStats = () => {
    let totalBlocked = 0;
    let totalDomains = 0;

    results.forEach((cat) => {
      totalBlocked += cat.blockedCount;
      totalDomains += cat.domains.length;
    });

    return {
      blocked: totalBlocked,
      total: totalDomains,
      percentage: totalDomains > 0 ? Math.round((totalBlocked / totalDomains) * 100) : 0,
    };
  };

  const stats = getOverallStats();

  return (
    <>
      <Head>
        <title>adblocktest - Teste seu Bloqueador de Anúncios</title>
        <meta
          name="description"
          content="Teste se seu bloqueador de anúncios está funcionando corretamente"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container">
        <div className="header">
          <h1>🛡️ adblocktest</h1>
          <p>Teste se seu bloqueador de anúncios está funcionando corretamente</p>
        </div>

        <div className="controls">
          <button onClick={startTest} disabled={isTesting} className="test-button">
            {isTesting ? `Testando... ${testProgress}/${totalTests}` : 'Iniciar Teste'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="stats">
            <div className="stat-card">
              <h3>Estatísticas Gerais</h3>
              <div className="stat-numbers">
                <div>
                  <span className="stat-value">{stats.blocked}</span>
                  <span className="stat-label">Bloqueados</span>
                </div>
                <div>
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div>
                  <span className="stat-value">{stats.percentage}%</span>
                  <span className="stat-label">Taxa de Bloqueio</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="results">
          {results.map((category, idx) => (
            <div key={`${category.category}-${category.provider}-${idx}`} className="category-card">
              <div className="category-header">
                <h2>{category.provider}</h2>
                <span className="category-badge">{category.category}</span>
                <span className="percentage-badge">
                  {getBlockedPercentage(category)}% bloqueado
                </span>
              </div>

              <div className="domains-list">
                {category.domains.map((domainResult, domainIdx) => (
                  <div
                    key={`${domainResult.domain}-${domainIdx}`}
                    className={`domain-item ${
                      domainResult.testing
                        ? 'testing'
                        : domainResult.blocked
                        ? 'blocked'
                        : 'not-blocked'
                    }`}
                  >
                    <span className="domain-name">{domainResult.domain}</span>
                    <span className="domain-status">
                      {domainResult.testing
                        ? '⏳'
                        : domainResult.blocked
                        ? '✅ Bloqueado'
                        : '❌ Não Bloqueado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
            Cantarell, sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .header h1 {
          font-size: 3rem;
          margin: 0 0 1rem 0;
          color: #1a1a1a;
        }

        .header p {
          font-size: 1.2rem;
          color: #666;
        }

        .controls {
          text-align: center;
          margin-bottom: 2rem;
        }

        .test-button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .test-button:hover:not(:disabled) {
          background: #0051cc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 112, 243, 0.4);
        }

        .test-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .stats {
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-card h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
        }

        .stat-numbers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 2rem;
        }

        .stat-numbers > div {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .results {
          display: grid;
          gap: 1.5rem;
        }

        .category-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .category-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #1a1a1a;
        }

        .category-badge {
          background: #f0f0f0;
          color: #666;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
        }

        .percentage-badge {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .domains-list {
          display: grid;
          gap: 0.5rem;
        }

        .domain-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .domain-item.blocked {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
        }

        .domain-item.not-blocked {
          background: #ffebee;
          border-left: 4px solid #f44336;
        }

        .domain-item.testing {
          background: #fff3e0;
          border-left: 4px solid #ff9800;
        }

        .domain-name {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9rem;
          color: #333;
          word-break: break-all;
        }

        .domain-status {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .domain-item.blocked .domain-status {
          color: #2e7d32;
        }

        .domain-item.not-blocked .domain-status {
          color: #c62828;
        }

        .domain-item.testing .domain-status {
          color: #e65100;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .header h1 {
            font-size: 2rem;
          }

          .stat-numbers {
            grid-template-columns: 1fr;
          }

          .category-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
