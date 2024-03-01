const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080; 

function expandFillerRange(range) {
  const [start, end] = range.split('-').map(Number);
  const expandedRange = [];
  for (let i = start; i <= end; i++) {
    expandedRange.push(i);
  }
  return expandedRange.join(', ');
}

app.use(cors());

app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to Anime Filler Episodes API</h1>
    <p>Please provide an anime name in the URL to get its filler episodes.</p>
  `);
});

app.get('/:animeName', async (req, res) => {
  const animeName = req.params.animeName;
  if (!animeName) {
    return res.status(400).send(`
      <h1>Error: Anime name is missing</h1>
      <p>Please provide an anime name in the URL.</p>
    `);
  }

  const url = `https://www.animefillerlist.com/shows/${animeName}`;

  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);

      const fillerEpisodes = [];

      $('div.filler span.Label').each((index, element) => {
        if ($(element).text().trim() === 'Filler Episodes:') {
          const fillerEpisode = $(element).next().text().trim();
          const episodes = fillerEpisode.split(',').map(ep => {
            if (ep.includes('-')) {
              return expandFillerRange(ep.trim());
            } else {
              return ep.trim();
            }
          });
          fillerEpisodes.push(episodes.join(', '));
        }
      });

      res.json({ animeName, fillerEpisodes });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
