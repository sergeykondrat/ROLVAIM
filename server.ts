import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import Database from "better-sqlite3";
import fs from "fs";
import Papa from "papaparse";

const db = new Database("royalties.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER,
    title TEXT,
    isrc TEXT,
    album TEXT,
    UNIQUE(artist_id, title, isrc),
    FOREIGN KEY(artist_id) REFERENCES artists(id)
  );

  CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS royalties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER,
    artist_id INTEGER,
    track_id INTEGER,
    platform_id INTEGER,
    label_id INTEGER,
    period TEXT,
    streams INTEGER,
    revenue REAL,
    FOREIGN KEY(report_id) REFERENCES reports(id),
    FOREIGN KEY(artist_id) REFERENCES artists(id),
    FOREIGN KEY(track_id) REFERENCES tracks(id),
    FOREIGN KEY(platform_id) REFERENCES platforms(id),
    FOREIGN KEY(label_id) REFERENCES labels(id)
  );

  CREATE INDEX IF NOT EXISTS idx_royalties_artist ON royalties(artist_id);
  CREATE INDEX IF NOT EXISTS idx_royalties_track ON royalties(track_id);
  CREATE INDEX IF NOT EXISTS idx_royalties_platform ON royalties(platform_id);
  CREATE INDEX IF NOT EXISTS idx_royalties_period ON royalties(period);
`);

// Migration: Add label_id to royalties if missing
try {
  db.prepare("ALTER TABLE royalties ADD COLUMN label_id INTEGER REFERENCES labels(id)").run();
} catch (e) {
  // Column already exists or other error we can ignore if it's just "duplicate column"
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_royalties_label ON royalties(label_id);
`);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }
  
  const upload = multer({ dest: "uploads/" });

  app.use(express.json());

  // --- API Routes ---

  // Upload and Parse
  app.post("/api/upload", upload.array("files"), async (req: any, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Файлы не загружены" });

    const reportIds = [];
    for (const file of req.files) {
      const reportId = db.prepare("INSERT INTO reports (file_name) VALUES (?)").run(file.originalname).lastInsertRowid;
      reportIds.push(reportId);
      // Start background processing for each file
      processCsv(file.path, reportId as number).catch(console.error);
    }

    res.json({ reportIds, message: "Загрузка успешна, обработка начата." });
  });

  // Get Reports Status
  app.get("/api/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM reports ORDER BY upload_date DESC").all();
    res.json(reports);
  });

  // Dashboard Stats with Filters
  app.get("/api/stats", (req, res) => {
    const { artist_id, label_id, platform_id, start_period, end_period } = req.query;
    
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (artist_id) {
      whereClause += " AND artist_id = ?";
      params.push(artist_id);
    }
    if (label_id) {
      whereClause += " AND label_id = ?";
      params.push(label_id);
    }
    if (platform_id) {
      whereClause += " AND platform_id = ?";
      params.push(platform_id);
    }
    if (start_period) {
      whereClause += " AND period >= ?";
      params.push(start_period);
    }
    if (end_period) {
      whereClause += " AND period <= ?";
      params.push(end_period);
    }

    const totalRevenue = db.prepare(`SELECT SUM(revenue) as total FROM royalties ${whereClause}`).get(...params) as any;
    const totalStreams = db.prepare(`SELECT SUM(streams) as total FROM royalties ${whereClause}`).get(...params) as any;
    
    const topArtists = db.prepare(`
      SELECT a.name, SUM(r.revenue) as revenue, SUM(r.streams) as streams
      FROM royalties r
      JOIN artists a ON r.artist_id = a.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY revenue DESC
      LIMIT 10
    `).all(...params);

    const topTracks = db.prepare(`
      SELECT t.title, a.name as artist, SUM(r.revenue) as revenue, SUM(r.streams) as streams
      FROM royalties r
      JOIN tracks t ON r.track_id = t.id
      JOIN artists a ON t.artist_id = a.id
      ${whereClause}
      GROUP BY t.id
      ORDER BY revenue DESC
      LIMIT 10
    `).all(...params);

    const topLabels = db.prepare(`
      SELECT l.name, SUM(r.revenue) as revenue, SUM(r.streams) as streams
      FROM royalties r
      JOIN labels l ON r.label_id = l.id
      ${whereClause}
      GROUP BY l.id
      ORDER BY revenue DESC
      LIMIT 10
    `).all(...params);

    const revenueByPlatform = db.prepare(`
      SELECT p.name, SUM(r.revenue) as revenue
      FROM royalties r
      JOIN platforms p ON r.platform_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY revenue DESC
    `).all(...params);

    const revenueByMonth = db.prepare(`
      SELECT period, SUM(revenue) as revenue
      FROM royalties
      ${whereClause}
      GROUP BY period
      ORDER BY period ASC
    `).all(...params);

    res.json({
      totalRevenue: totalRevenue?.total || 0,
      totalStreams: totalStreams?.total || 0,
      topArtists,
      topTracks,
      topLabels,
      revenueByPlatform,
      revenueByMonth
    });
  });

  // Artists List
  app.get("/api/artists", (req, res) => {
    const artists = db.prepare(`
      SELECT a.id, a.name, SUM(r.streams) as totalStreams, SUM(r.revenue) as totalRevenue
      FROM artists a
      LEFT JOIN royalties r ON a.id = r.artist_id
      GROUP BY a.id
      ORDER BY totalRevenue DESC
    `).all();
    res.json(artists);
  });

  // Labels List
  app.get("/api/labels", (req, res) => {
    const labels = db.prepare(`
      SELECT l.id, l.name, SUM(r.streams) as totalStreams, SUM(r.revenue) as totalRevenue
      FROM labels l
      LEFT JOIN royalties r ON l.id = r.label_id
      GROUP BY l.id
      ORDER BY totalRevenue DESC
    `).all();
    res.json(labels);
  });

  // Platforms List
  app.get("/api/platforms", (req, res) => {
    const platforms = db.prepare(`
      SELECT p.id, p.name, SUM(r.streams) as totalStreams, SUM(r.revenue) as totalRevenue
      FROM platforms p
      LEFT JOIN royalties r ON p.id = r.platform_id
      GROUP BY p.id
      ORDER BY totalRevenue DESC
    `).all();
    res.json(platforms);
  });

  // Tracks List
  app.get("/api/all-tracks", (req, res) => {
    const tracks = db.prepare(`
      SELECT t.id, t.title, t.isrc, t.album, a.name as artist, SUM(r.streams) as totalStreams, SUM(r.revenue) as totalRevenue
      FROM tracks t
      JOIN artists a ON t.artist_id = a.id
      LEFT JOIN royalties r ON t.id = r.track_id
      GROUP BY t.id
      ORDER BY totalRevenue DESC
    `).all();
    res.json(tracks);
  });

  // Periods List
  app.get("/api/periods", (req, res) => {
    const periods = db.prepare(`
      SELECT DISTINCT period FROM royalties ORDER BY period ASC
    `).all();
    res.json(periods.map((p: any) => p.period));
  });

  // Report Detail
  app.get("/api/reports/:id", (req, res) => {
    const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id) as any;
    if (!report) return res.status(404).json({ error: "Отчет не найден" });

    const royalties = db.prepare(`
      SELECT r.*, a.name as artist, t.title as track, p.name as platform, l.name as label
      FROM royalties r
      JOIN artists a ON r.artist_id = a.id
      JOIN tracks t ON r.track_id = t.id
      JOIN platforms p ON r.platform_id = p.id
      JOIN labels l ON r.label_id = l.id
      WHERE r.report_id = ?
      LIMIT 1000
    `).all(req.params.id);

    res.json({ ...report, royalties });
  });

  // Label Detail
  app.get("/api/labels/:id", (req, res) => {
    const label = db.prepare("SELECT * FROM labels WHERE id = ?").get(req.params.id) as any;
    if (!label) return res.status(404).json({ error: "Лейбл не найден" });

    const stats = db.prepare(`
      SELECT SUM(streams) as totalStreams, SUM(revenue) as totalRevenue
      FROM royalties WHERE label_id = ?
    `).get(req.params.id) as any;

    const artists = db.prepare(`
      SELECT a.id, a.name, SUM(r.streams) as streams, SUM(r.revenue) as revenue
      FROM artists a
      JOIN royalties r ON a.id = r.artist_id
      WHERE r.label_id = ?
      GROUP BY a.id
      ORDER BY revenue DESC
    `).all(req.params.id);

    res.json({ ...label, ...stats, artists });
  });

  // Track Detail
  app.get("/api/tracks/:id", (req, res) => {
    const track = db.prepare(`
      SELECT t.*, a.name as artist
      FROM tracks t
      JOIN artists a ON t.artist_id = a.id
      WHERE t.id = ?
    `).get(req.params.id) as any;
    if (!track) return res.status(404).json({ error: "Track not found" });

    const stats = db.prepare(`
      SELECT SUM(streams) as totalStreams, SUM(revenue) as totalRevenue
      FROM royalties WHERE track_id = ?
    `).get(req.params.id) as any;

    const streamsByPlatform = db.prepare(`
      SELECT p.name, SUM(r.streams) as streams
      FROM royalties r
      JOIN platforms p ON r.platform_id = p.id
      WHERE r.track_id = ?
      GROUP BY p.id
    `).all(req.params.id);

    const revenueByPlatform = db.prepare(`
      SELECT p.name, SUM(r.revenue) as revenue
      FROM royalties r
      JOIN platforms p ON r.platform_id = p.id
      WHERE r.track_id = ?
      GROUP BY p.id
    `).all(req.params.id);

    res.json({ ...track, ...stats, streamsByPlatform, revenueByPlatform });
  });

  // Search
  app.get("/api/search", (req, res) => {
    const q = `%${req.query.q}%`;
    const results = db.prepare(`
      SELECT 'artist' as type, id, name as title, NULL as subtitle, NULL as extra
      FROM artists WHERE name LIKE ?
      UNION ALL
      SELECT 'track' as type, t.id, t.title, a.name as subtitle, t.isrc as extra
      FROM tracks t JOIN artists a ON t.artist_id = a.id
      WHERE t.title LIKE ? OR t.isrc LIKE ? OR t.album LIKE ?
      LIMIT 20
    `).all(q, q, q, q);
    res.json(results);
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// --- Background CSV Processing ---
async function processCsv(filePath: string, reportId: number) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        db.prepare("UPDATE reports SET total_rows = ?, status = 'processing' WHERE id = ?").run(rows.length, reportId);

        const insertArtist = db.prepare("INSERT OR IGNORE INTO artists (name) VALUES (?)");
        const getArtistId = db.prepare("SELECT id FROM artists WHERE name = ?");
        const insertTrack = db.prepare("INSERT OR IGNORE INTO tracks (artist_id, title, isrc, album) VALUES (?, ?, ?, ?)");
        const getTrackId = db.prepare("SELECT id FROM tracks WHERE artist_id = ? AND title = ? AND isrc = ?");
        const insertPlatform = db.prepare("INSERT OR IGNORE INTO platforms (name) VALUES (?)");
        const getPlatformId = db.prepare("SELECT id FROM platforms WHERE name = ?");
        const insertRoyalty = db.prepare(`
          INSERT INTO royalties (report_id, artist_id, track_id, platform_id, label_id, period, streams, revenue)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((data) => {
          let count = 0;
          if (data.length === 0) return 0;

          // Helper to find key loosely
          const keys = Object.keys(data[0]);
          const findKey = (search: string) => keys.find(k => k.trim().toLowerCase() === search.toLowerCase());

          const artistKey = findKey("Исполнитель") || findKey("Artist");
          const trackKey = findKey("Название трека") || findKey("Track Title") || findKey("Title");
          const platformKey = findKey("Площадка") || findKey("Platform") || findKey("Service");
          const labelKey = findKey("Копирайт") || findKey("Copyright") || findKey("Label") || findKey("Лейбл");
          const streamsKey = findKey("Количество") || findKey("Quantity") || findKey("Streams");
          const revenueKey = findKey("Итого вознаграждение ЛИЦЕНЗИАРА") || findKey("Net Amount") || findKey("Revenue") || findKey("Total Revenue");
          const periodKey = findKey("Период использования") || findKey("Period");
          const isrcKey = findKey("ISRC");
          const albumKey = findKey("Название альбома") || findKey("Album");

          for (const row of data) {
            const artistName = artistKey ? row[artistKey]?.trim() : null;
            const trackTitle = trackKey ? row[trackKey]?.trim() : null;
            const platformName = (platformKey ? row[platformKey]?.trim() : null) || "Unknown Platform";
            let labelName = (labelKey ? row[labelKey]?.trim() : null) || "Unknown Label";
            
            // Clean label name (remove (P), (C), years etc)
            if (labelName && labelName !== "Unknown Label") {
              labelName = labelName
                .replace(/^(\(P\)|\(C\)|©|℗)\s*/i, '') // Remove (P), (C) etc
                .replace(/^\d{4}\s+/, '')              // Remove leading year
                .replace(/\s+\d{4}$/, '')              // Remove trailing year
                .trim();
            }

            const streams = streamsKey ? (parseInt(row[streamsKey]) || 0) : 0;
            const revenueRaw = revenueKey ? row[revenueKey] : "0";
            const revenue = parseFloat(revenueRaw?.toString().replace(",", ".").replace(/[^0-9.-]/g, "")) || 0;
            const period = (periodKey ? row[periodKey]?.trim() : null) || "Unknown Period";
            const isrc = isrcKey ? row[isrcKey]?.trim() : "";
            const album = albumKey ? row[albumKey]?.trim() : "";

            if (!artistName || !trackTitle) continue;

            insertArtist.run(artistName);
            const artistId = (getArtistId.get(artistName) as any).id;

            insertTrack.run(artistId, trackTitle, isrc, album);
            const trackId = (getTrackId.get(artistId, trackTitle, isrc) as any).id;

            insertPlatform.run(platformName);
            const platformId = (getPlatformId.get(platformName) as any).id;

            const insertLabel = db.prepare("INSERT OR IGNORE INTO labels (name) VALUES (?)");
            const getLabelId = db.prepare("SELECT id FROM labels WHERE name = ?");
            insertLabel.run(labelName);
            const labelId = (getLabelId.get(labelName) as any).id;

            insertRoyalty.run(reportId, artistId, trackId, platformId, labelId, period, streams, revenue);
            count++;
          }
          return count;
        });

        try {
          const processed = transaction(rows);
          db.prepare("UPDATE reports SET processed_rows = ?, status = 'completed' WHERE id = ?").run(processed, reportId);
          fs.unlinkSync(filePath);
          resolve(processed);
        } catch (err) {
          db.prepare("UPDATE reports SET status = 'error' WHERE id = ?").run(reportId);
          reject(err);
        }
      },
      error: (err) => {
        db.prepare("UPDATE reports SET status = 'error' WHERE id = ?").run(reportId);
        reject(err);
      }
    });
  });
}

startServer();
