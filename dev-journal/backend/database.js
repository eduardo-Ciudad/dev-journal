const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'journal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error opening database:', err);
  else console.log('Connected to SQLite database');
});

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        technologies TEXT DEFAULT '',
        challenges TEXT DEFAULT '',
        learnings TEXT DEFAULT '',
        study_hours REAL DEFAULT 0,
        links TEXT DEFAULT '',
        commits INTEGER DEFAULT 0,
        productivity INTEGER DEFAULT 3,
        mood TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) { console.error('Error creating table:', err); return; }
      console.log('Database table ready');
      seedData();
    });
  });
}

function seedData() {
  db.get('SELECT COUNT(*) as count FROM entries', (err, row) => {
    if (err || row.count > 0) return;

    const entries = [
      {
        date: '2026-05-07',
        title: 'Dia 13 - Desafio de Java',
        summary: 'Trabalhei nos desafios de Java focando em coleções e streams. Implementei soluções para problemas de algoritmos usando ArrayList e HashMap. Resolvi 5 exercícios do HackerRank e participei de uma code review no time.',
        technologies: 'Java,Streams,Collections,Algorithms,HackerRank',
        challenges: 'Entender a diferença de performance entre diferentes estruturas de dados e quando usar cada uma. O uso correto de Stream.collect() vs forEach() me confundiu bastante.',
        learnings: 'Collections.sort() vs Stream.sorted() — para listas pequenas o sort direto é mais eficiente. Aprendi também que streams são lazy e isso muda tudo na composição de pipelines.',
        study_hours: 4.5,
        links: 'https://github.com/usuario/java-challenges,https://www.hackerrank.com/domains/java',
        commits: 7,
        productivity: 4,
        mood: '💪 Focado'
      },
      {
        date: '2026-05-08',
        title: 'Implementação do PerformanceAnalyzerService',
        summary: 'Desenvolvi um serviço completo para análise de performance de operações em listas. O serviço compara diferentes abordagens de implementação usando JMH benchmarks. Escrevi testes unitários abrangentes com Mockito.',
        technologies: 'Java,Spring Boot,JUnit 5,Mockito,JMH',
        challenges: 'Configurar corretamente os mocks do Mockito para testar o serviço de forma isolada sem dependências reais do banco. Também tive dificuldade com o setup do JMH no Maven.',
        learnings: 'A importância de testes unitários bem escritos que cobrem casos edge. Aprendi a usar @InjectMocks e @Mock eficientemente. @ExtendWith(MockitoExtension.class) é o caminho correto no JUnit 5.',
        study_hours: 6,
        links: 'https://github.com/usuario/performance-analyzer,https://openjdk.org/projects/code-tools/jmh/',
        commits: 12,
        productivity: 5,
        mood: '🚀 Produtivo'
      },
      {
        date: '2026-05-09',
        title: 'Estudo de Spring Security',
        summary: 'Explorei os conceitos de autenticação e autorização com Spring Security. Implementei JWT tokens e configurei filtros de segurança personalizados. Construí uma API protegida com roles de usuário.',
        technologies: 'Spring Security,JWT,Java,Spring Boot,BCrypt',
        challenges: 'Entender o fluxo completo de autenticação com JWT e como configurar os endpoints públicos vs privados. A configuração do SecurityFilterChain me tomou bastante tempo.',
        learnings: 'SecurityFilterChain substitui o WebSecurityConfigurerAdapter nas versões recentes do Spring. A configuração declarativa com lambdas é mais clara e idiomática. JWT stateless elimina a necessidade de sessões no servidor.',
        study_hours: 5,
        links: 'https://github.com/usuario/spring-security-study,https://docs.spring.io/spring-security/reference/',
        commits: 8,
        productivity: 4,
        mood: '🎯 Determinado'
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO entries (date, title, summary, technologies, challenges, learnings, study_hours, links, commits, productivity, mood)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    entries.forEach(e => {
      stmt.run(e.date, e.title, e.summary, e.technologies, e.challenges, e.learnings,
        e.study_hours, e.links, e.commits, e.productivity, e.mood);
    });

    stmt.finalize(() => console.log('Seed data inserted successfully'));
  });
}

module.exports = { db, initDatabase };
