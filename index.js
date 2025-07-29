const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

// Setup MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'mike',
  password: 'password',
  database: 'db',
});

// Connect to DB
db.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to MySQL');
});

// 1. Get all unique makes
app.get('/makes', (req, res) => {
  db.query('SELECT DISTINCT make FROM vehicledescriptions WHERE make IS NOT NULL AND make != ""', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    const makes = results.map((row) => row.make);
    res.json({ status: true, message: 'Fetched makes', data: makes });
  });
});

// 2. Get models by make
app.get('/models/:make', (req, res) => {
  const { make } = req.params;
  db.query(
    'SELECT DISTINCT model FROM vehicledescriptions WHERE make = ? AND model IS NOT NULL AND model != ""',
    [make],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      const models = results.map((row) => row.model);
      res.json({ status: true, message: `Models for make ${make}`, data: models });
    }
  );
});

// 3. Get engines by make and model
app.get('/engines/:make/:model', (req, res) => {
  const { make, model } = req.params;
  db.query(
    'SELECT DISTINCT engdesc FROM vehicledescriptions WHERE make = ? AND model = ? AND engdesc IS NOT NULL AND engdesc != ""',
    [make, model],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      const engines = results.map((row) => row.engdesc);
      res.json({ status: true, message: `Engines for ${make} ${model}`, data: engines });
    }
  );
});

// 4. Get all years for a vehicle make + model
app.get('/years/:make/:model', (req, res) => {
    const { make, model } = req.params;
  
    const query = `
      SELECT MIN(yearbegin) AS minYear, MAX(yearend) AS maxYear
      FROM vehicledescriptions
      WHERE make = ? AND model = ? AND yearbegin IS NOT NULL AND yearend IS NOT NULL
    `;
  
    db.query(query, [make, model], (err, results) => {
      if (err) return res.status(500).json({ error: err });
  
      const row = results[0];
      const minYear = row.minYear;
      const maxYear = row.maxYear;
  
      if (minYear == null || maxYear == null) {
        return res.status(404).json({
          status: false,
          message: `No years found for ${make} ${model}`,
        });
      }
  
      const years = [];
      for (let year = minYear; year <= maxYear; year++) {
        years.push(year);
      }
  
      res.json({
        status: true,
        message: `Available years for ${make} ${model}`,
        data: years,
      });
    });
  });

  // 5. Get full vehicle details based on make, model, engine, and year
app.get('/vehicle/:make/:model/:engine/:year', (req, res) => {
    const { make, model, engine, year } = req.params;
  
    const query = `
      SELECT * FROM vehicledescriptions
      WHERE make = ? AND model = ? AND engdesc = ? AND ? BETWEEN yearbegin AND yearend
      LIMIT 1
    `;
  
    db.query(query, [make, model, engine, year], (err, results) => {
      if (err) return res.status(500).json({ error: err });
  
      if (results.length === 0) {
        return res.status(404).json({
          status: false,
          message: `Vehicle not found for ${make} ${model} ${engine} in year ${year}`,
        });
      }
  
      res.json({
        status: true,
        message: `Vehicle details for ${make} ${model} ${engine} in year ${year}`,
        data: results[0],
      });
    });
  });

  // 6. Get vehicle details by VIN
app.get('/vehicle/vin/:vin', (req, res) => {
    const { vin } = req.params;
  
    const query = `SELECT * FROM vehicledescriptions WHERE vin = ? LIMIT 1`;
  
    db.query(query, [vin], (err, results) => {
      if (err) return res.status(500).json({ error: err });
  
      if (results.length === 0) {
        return res.status(404).json({
          status: false,
          message: `Vehicle not found for VIN ${vin}`,
        });
      }
  
      res.json({
        status: true,
        message: `Vehicle details for VIN ${vin}`,
        data: results[0],
      });
    });
  });



  app.get('/hunter/vin/:vin', (req, res) => {
    const { vin } = req.params;
  
    const query = `SELECT * FROM hunter WHERE vin = ?`;
  
    db.query(query, [vin], (err, results) => {
      if (err) return res.status(500).json({ error: err });
  
      if (results.length === 0) {
        return res.status(404).json({
          status: false,
          message: `No record found in hunter for VIN ${vin}`,
        });
      }
  
      // Attach a random image to each item
      const enrichedResults = results.map((item) => ({
        ...item,
        image: `https://loremflickr.com/640/480/car?random=${Math.floor(Math.random() * 10000)}`
      }));
  
      res.json({
        status: true,
        message: `Hunter records for VIN ${vin}`,
        data: enrichedResults,
      });
    });
  });
  
  
  
  

app.listen(PORT, () => {
  console.log(`🚗 Vehicle API is running on http://localhost:${PORT}`);
});
