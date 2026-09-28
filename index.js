const express = require('express');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/translate', (req, res) => {
  const { text, from, to } = req.query;
  if (!text || !from || !to) {
    return res.status(400).json({ error: 'text, from and to are required' });
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}&de=${encodeURIComponent(
    process.env.TRANSLATE_CONTACT_EMAIL || ''
  )}`;

  https
    .get(url, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => (data += chunk));
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const translated = parsed?.responseData?.translatedText;
          if (!translated) {
            return res.status(502).json({ error: 'Translation failed', raw: parsed });
          }
          res.json({ translatedText: translated });
        } catch (err) {
          res.status(502).json({ error: 'Invalid response from translation service' });
        }
      });
    })
    .on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
});

app.listen(PORT, () => {
  console.log(`Pharmacy voice translator running at http://localhost:${PORT}`);
});
