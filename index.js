const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

function expandRange(range) {
    const [start, end] = range.split('-').map(Number);
    const expandedRange = [];
    for (let i = start; i <= end; i++) {
        expandedRange.push(i);
    }
    return expandedRange.join(', ');
}

// Allow access from any origin
app.use(cors());

app.get('/', (req, res) => {
    res.send(`
    

    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>ChaiWala API</title>
        <style>
            body {
                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #000000;
                color: #495057;
                line-height: 1.6;
            }
            header {
                background-color: #000000;
                color: #fff;
                text-align: center;
                padding: 1.5em 0;
                margin-bottom: 1em;
            }
            h1 {
                margin-bottom: .5em;
                font-size: 2em;
                color: #00ff4c;
            }
            p {
                color: #ffffff;
                margin-bottom: 1.5em;
            }
            code {
                background-color: #0f0f0f;
                padding: .2em .4em;
                border-radius: 4px;
                font-family: "Courier New", Courier, monospace;
                color: #495057;
            }
            .container {
                margin: 1em;
                padding: 1em;
                background-color: #000000;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, .1);
                color: #fff;
            }
            li, ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            li {
                margin-bottom: .5em;
            }
            li code {
                background-color: #161616;
                color: #ffffff;
            }
            a {
                color: #00ac39;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            footer {
                background-color: #000000;
                color: #fff;
                padding: 1em 0;
                text-align: center;
            }
            .sample-request {
                margin-top: 1em;
            }
            .toggle-response {
                cursor: pointer;
                color: #00852c;
                text-decoration: underline;
            }
            .sample-response {
                display: none;
                margin-top: 1em;
            }
            pre {
                background-color: #f3f4f7;
                padding: 1em;
                border-radius: 4px;
                overflow-x: auto;
            }
        </style>
    </head>
    <body>
        <header>
            <h1>API Dashboard</h1>
            <p>The ChaiWala Filler API provides access to a wide range of anime-related data.</p>
            <p class="support">For support, visit our <a href="https://discord.gg/V8QWSyVx88" target="_blank">Discord Server</a>.</p>
        </header>
        <div class="container">
            <h2>API Description:</h2>
            <p>The ChaiWala Filler allows you to access filler ep data, </p>
        </div>
        <div class="container">
            <h2>Routes:</h2>
            <ul>
                <li><code>/{anime-name}</code> - Get the filler list</li>
                <li><code>https://shedule.chaiwala-anime.workers.dev/</code> - Get upcoming animes from anilist</li>
                
            </ul>
        </div>
        <div class="container">
            <h2>Support and Contact:</h2>
            <p>For support and questions, visit our <a href="https://discord.gg/V8QWSyVx88" target="_blank">Discord Server</a>.</p>
        </div>
        <footer>
            <p>© 2024 ChaiWala API. All rights reserved.</p>
        </footer>
    </body>
    </html>
    
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
            const cannonEpisodes = [];

            $('div.filler span.Label').each((index, element) => {
                if ($(element).text().trim() === 'Filler Episodes:') {
                    const fillerEpisode = $(element).next().text().trim();
                    const episodes = fillerEpisode.split(',').map(ep => {
                        if (ep.includes('-')) {
                            return expandRange(ep.trim());
                        } else {
                            return ep.trim();
                        }
                    });
                    fillerEpisodes.push(episodes.join(', '));
                }
            });

            $('div.mixed_canon\\/filler span.Label').each((index, element) => {
                if ($(element).text().trim() === 'Mixed Canon/Filler Episodes:') {
                    const cannonEpisode = $(element).next().text().trim();
                    const episodes = cannonEpisode.split(',').map(ep => {
                        if (ep.includes('-')) {
                            return expandRange(ep.trim());
                        } else {
                            return ep.trim();
                        }
                    });
                    cannonEpisodes.push(episodes.join(', '));
                }
            });

            res.json({ animeName, fillerEpisodes, cannonEpisodes });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
