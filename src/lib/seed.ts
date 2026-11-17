import getDb from './db';

// ── Schema version ────────────────────────────────────────────────────────────
// Bump this string to trigger an automatic migration on next cold-start.
// v1 → old schema (swiper_id INTEGER, hardcoded user 0)
// v2 → current (guest_id TEXT UUID, profile_id INTEGER, incoming_like flag)
const SCHEMA_VERSION = '2';

// ── Profile data ─────────────────────────────────────────────────────────────
interface ProfileRow {
  name: string; age: number; photo: string;
  bio: string; city: string; interests: string;
}

const PROFILES: ProfileRow[] = [
  { name: 'Aanya Sharma',   age: 24, photo: 'https://picsum.photos/seed/aanya-sharma/400/500',   bio: 'Coffee addict, bookworm, and amateur baker. Looking for someone to share Sunday morning chai with.',          city: 'Mumbai',           interests: JSON.stringify(['reading','baking','yoga','travel']) },
  { name: 'Rohan Mehta',    age: 27, photo: 'https://picsum.photos/seed/rohan-mehta/400/500',    bio: 'Software engineer by day, guitarist by night. Passionate about open-source and good food.',               city: 'Bangalore',        interests: JSON.stringify(['music','coding','hiking','cricket']) },
  { name: 'Priya Nair',     age: 25, photo: 'https://picsum.photos/seed/priya-nair/400/500',     bio: 'Dancer, dreamer, and dog lover. Can talk about films for hours.',                                           city: 'Chennai',          interests: JSON.stringify(['dance','films','photography','cooking']) },
  { name: 'Arjun Kapoor',   age: 28, photo: 'https://picsum.photos/seed/arjun-kapoor/400/500',   bio: 'Startup founder who loves trekking. Believes life is too short for bad coffee.',                           city: 'Delhi',            interests: JSON.stringify(['entrepreneurship','trekking','coffee','podcasts']) },
  { name: 'Diya Pillai',    age: 23, photo: 'https://picsum.photos/seed/diya-pillai/400/500',    bio: 'Medical student with a passion for Kathak and street food adventures.',                                    city: 'Kochi',            interests: JSON.stringify(['kathak','medicine','street food','painting']) },
  { name: 'Vikram Singh',   age: 29, photo: 'https://picsum.photos/seed/vikram-singh/400/500',   bio: 'Army officer turned MBA. Weekend photographer and fitness enthusiast.',                                     city: 'Pune',             interests: JSON.stringify(['fitness','photography','travel','cooking']) },
  { name: 'Ishaan Verma',   age: 26, photo: 'https://picsum.photos/seed/ishaan-verma/400/500',   bio: 'UX designer who sketches everywhere. Big fan of indie music and monsoon drives.',                          city: 'Hyderabad',        interests: JSON.stringify(['design','indie music','driving','sketching']) },
  { name: 'Kavya Reddy',    age: 24, photo: 'https://picsum.photos/seed/kavya-reddy/400/500',    bio: 'Data scientist who loves salsa dancing. Trying to master sourdough bread.',                                city: 'Bangalore',        interests: JSON.stringify(['salsa','data science','baking','yoga']) },
  { name: 'Nikhil Joshi',   age: 30, photo: 'https://picsum.photos/seed/nikhil-joshi/400/500',   bio: 'Chef-in-training with a love for cycling and classic Bollywood music.',                                   city: 'Jaipur',           interests: JSON.stringify(['cooking','cycling','bollywood','travel']) },
  { name: 'Ananya Iyer',    age: 22, photo: 'https://picsum.photos/seed/ananya-iyer/400/500',    bio: 'Architecture student who takes long walks and writes poetry on weekends.',                                 city: 'Chennai',          interests: JSON.stringify(['architecture','poetry','walking','films']) },
  { name: 'Kabir Malhotra', age: 27, photo: 'https://picsum.photos/seed/kabir-malhotra/400/500', bio: 'Investment banker who secretly wants to be a stand-up comedian.',                                         city: 'Mumbai',           interests: JSON.stringify(['comedy','finance','cricket','reading']) },
  { name: 'Meera Patel',    age: 25, photo: 'https://picsum.photos/seed/meera-patel/400/500',    bio: 'Fashion designer with an obsession for vintage sarees and filter coffee.',                                 city: 'Ahmedabad',        interests: JSON.stringify(['fashion','design','coffee','music']) },
  { name: 'Rahul Bose',     age: 28, photo: 'https://picsum.photos/seed/rahul-bose/400/500',     bio: 'Wildlife photographer and nature enthusiast. Happiest on a mountain.',                                     city: 'Dehradun',         interests: JSON.stringify(['photography','wildlife','trekking','camping']) },
  { name: 'Tanvi Saxena',   age: 23, photo: 'https://picsum.photos/seed/tanvi-saxena/400/500',   bio: 'Journalist chasing stories and sunsets. Avid reader, chai lover.',                                        city: 'Delhi',            interests: JSON.stringify(['journalism','reading','chai','travel']) },
  { name: 'Siddharth Rao',  age: 31, photo: 'https://picsum.photos/seed/siddharth-rao/400/500',  bio: 'Product manager by profession, traveller by passion. 30 countries and counting.',                        city: 'Bangalore',        interests: JSON.stringify(['travel','product management','photography','hiking']) },
  { name: 'Riya Chandra',   age: 24, photo: 'https://picsum.photos/seed/riya-chandra/400/500',   bio: 'Classical singer and yoga instructor. Believes in living mindfully.',                                     city: 'Varanasi',         interests: JSON.stringify(['classical music','yoga','meditation','painting']) },
  { name: 'Aditya Kumar',   age: 26, photo: 'https://picsum.photos/seed/aditya-kumar/400/500',   bio: 'Mechanical engineer with a knack for robotics and competitive gaming.',                                   city: 'Kolkata',          interests: JSON.stringify(['robotics','gaming','coding','football']) },
  { name: 'Shreya Gupta',   age: 25, photo: 'https://picsum.photos/seed/shreya-gupta/400/500',   bio: 'Clinical psychologist who loves sudoku and Korean dramas.',                                               city: 'Lucknow',          interests: JSON.stringify(['psychology','k-dramas','sudoku','cooking']) },
  { name: 'Kunal Desai',    age: 29, photo: 'https://picsum.photos/seed/kunal-desai/400/500',    bio: 'CA who runs marathons on weekends. Big foodie with a soft spot for Gujarati thali.',                     city: 'Surat',            interests: JSON.stringify(['running','finance','food','cricket']) },
  { name: 'Pooja Menon',    age: 27, photo: 'https://picsum.photos/seed/pooja-menon/400/500',    bio: 'Marine biologist fascinated by the deep ocean. Loves scuba diving and marine conservation.',              city: 'Kochi',            interests: JSON.stringify(['scuba diving','marine biology','environment','reading']) },
  { name: 'Arnav Sharma',   age: 28, photo: 'https://picsum.photos/seed/arnav-sharma/400/500',   bio: 'Civil engineer who built his own tiny home. Fan of minimalism and slow travel.',                         city: 'Pune',             interests: JSON.stringify(['minimalism','travel','architecture','cycling']) },
  { name: 'Nisha Tiwari',   age: 22, photo: 'https://picsum.photos/seed/nisha-tiwari/400/500',   bio: 'BBA student, aspiring entrepreneur, and passionate about women-led startups.',                           city: 'Bhopal',           interests: JSON.stringify(['entrepreneurship','feminism','reading','dance']) },
  { name: 'Sameer Khan',    age: 30, photo: 'https://picsum.photos/seed/sameer-khan/400/500',    bio: 'Screenwriter and film buff. Can debate about cinema all night.',                                          city: 'Mumbai',           interests: JSON.stringify(['films','writing','theatre','music']) },
  { name: 'Divya Krishnan', age: 24, photo: 'https://picsum.photos/seed/divya-krishnan/400/500', bio: 'Bharatanatyam dancer and software developer — bridging tradition and tech.',                             city: 'Coimbatore',       interests: JSON.stringify(['bharatanatyam','coding','music','travel']) },
  { name: 'Manav Chopra',   age: 27, photo: 'https://picsum.photos/seed/manav-chopra/400/500',   bio: 'Environmental consultant. Weekend hiker and obsessive bird-watcher.',                                    city: 'Shimla',           interests: JSON.stringify(['environment','birding','hiking','photography']) },
  { name: 'Isha Bajaj',     age: 26, photo: 'https://picsum.photos/seed/isha-bajaj/400/500',     bio: 'HR professional who moonlights as a Zumba instructor.',                                                  city: 'Chandigarh',       interests: JSON.stringify(['zumba','fitness','travel','cooking']) },
  { name: 'Rahul Nath',     age: 25, photo: 'https://picsum.photos/seed/rahul-nath/400/500',     bio: 'Blockchain developer and crypto enthusiast. Also a passionate cricketer.',                               city: 'Hyderabad',        interests: JSON.stringify(['blockchain','cricket','gaming','finance']) },
  { name: 'Aditi Bhatt',    age: 23, photo: 'https://picsum.photos/seed/aditi-bhatt/400/500',    bio: 'Textile design student. Loves handloom, craft fairs, and black coffee.',                                 city: 'Jaipur',           interests: JSON.stringify(['textiles','design','craft','coffee']) },
  { name: 'Varun Pillai',   age: 29, photo: 'https://picsum.photos/seed/varun-pillai/400/500',   bio: 'Sports coach who follows every F1 race and reads philosophy in spare time.',                             city: 'Thiruvananthapuram', interests: JSON.stringify(['F1','philosophy','sports','fitness']) },
  { name: 'Sana Mirza',     age: 26, photo: 'https://picsum.photos/seed/sana-mirza/400/500',     bio: 'Digital marketer with a love for ghazals, pottery, and long drives.',                                   city: 'Lucknow',          interests: JSON.stringify(['ghazal','pottery','driving','music']) },
  { name: 'Karthik Rajan',  age: 28, photo: 'https://picsum.photos/seed/karthik-rajan/400/500',  bio: 'Aerospace engineer and amateur astronomer. Fascinated by the cosmos.',                                  city: 'Bangalore',        interests: JSON.stringify(['astronomy','aerospace','reading','trekking']) },
  { name: 'Nandini Verma',  age: 25, photo: 'https://picsum.photos/seed/nandini-verma/400/500',  bio: 'Lawyer who bakes stress away and volunteers at an animal shelter.',                                     city: 'Delhi',            interests: JSON.stringify(['law','baking','animals','yoga']) },
];

// Exactly 10 profiles carry a standing "like" for every visitor.
// Stored as a column flag (incoming_like=1) instead of swipe rows so it
// works independently of which guest is visiting.
const INCOMING_LIKE_IDS = new Set([5, 9, 13, 17, 20, 23, 25, 28, 30, 32]);

// ── Singleton guard ──────────────────────────────────────────────────────────
let initPromise: Promise<void> | null = null;

/**
 * Ensures schema + seed are ready. Safe to call on every request.
 * - First call: runs migration + seed, caches the promise
 * - Subsequent calls in the same process: returns the cached promise instantly
 * - New serverless invocations: re-runs the check (fast path after first deploy)
 */
export async function ensureDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = _init().catch((err) => {
    // Reset on error so the next request retries
    initPromise = null;
    throw err;
  });
  return initPromise;
}

async function _init(): Promise<void> {
  const db = getDb();

  // ── 1. Meta table (version tracking) ──────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // ── 2. Schema migration ────────────────────────────────────────────────────
  const vRow = await db.execute({
    sql: "SELECT value FROM meta WHERE key = 'schema_version'",
    args: [],
  });
  const currentVersion = (vRow.rows[0]?.value as string | undefined) ?? '0';

  if (currentVersion !== SCHEMA_VERSION) {
    // Drop old tables and recreate with the new schema.
    // This is safe for a demo app — the seed re-runs immediately after.
    await db.executeMultiple(`
      DROP TABLE IF EXISTS swipes;
      DROP TABLE IF EXISTS profiles;

      CREATE TABLE profiles (
        id            INTEGER PRIMARY KEY,
        name          TEXT    NOT NULL,
        age           INTEGER NOT NULL,
        photo         TEXT    NOT NULL,
        bio           TEXT    NOT NULL,
        city          TEXT    NOT NULL,
        interests     TEXT    NOT NULL,
        incoming_like INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE swipes (
        id         INTEGER  PRIMARY KEY AUTOINCREMENT,
        guest_id   TEXT     NOT NULL,
        profile_id INTEGER  NOT NULL,
        direction  TEXT     NOT NULL CHECK(direction IN ('like','pass')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(guest_id, profile_id)
      );
    `);

    await db.execute({
      sql: "INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)",
      args: [SCHEMA_VERSION],
    });
  }

  // ── 3. Seed profiles (idempotent) ──────────────────────────────────────────
  const countRow = await db.execute('SELECT COUNT(*) AS cnt FROM profiles');
  const cnt = Number(countRow.rows[0]?.cnt ?? 0);
  if (cnt > 0) return; // Already seeded

  // Single atomic batch — INSERT OR IGNORE makes it safe if two cold-starts
  // race each other on a fresh deployment.
  const statements = PROFILES.map((p, idx) => {
    const id = idx + 1;
    return {
      sql: `INSERT OR IGNORE INTO profiles
              (id, name, age, photo, bio, city, interests, incoming_like)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, p.name, p.age, p.photo, p.bio, p.city, p.interests,
        INCOMING_LIKE_IDS.has(id) ? 1 : 0,
      ] as (string | number)[],
    };
  });

  await db.batch(statements, 'write');
}
