const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

const appledown = {
  getData: async (urls) => {
    const url = `https://aaplmusicdownloader.com/api/applesearch.php?url=${urls}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'MyApp/1.0',
                'Referer': 'https://aaplmusicdownloader.com/'
            }
        });
        return response.data;
    } catch (error) {
        return { success: false, message: error.message };
    }
  },
  getAudio: async (trackName, artist, urlMusic, token) => {
    const url = 'https://aaplmusicdownloader.com/api/composer/swd.php';
    const data = {
        song_name: trackName,
        artist_name: artist,
        url: urlMusic,
        token: token
    };
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'MyApp/1.0',
        'Referer': 'https://aaplmusicdownloader.com/song.php#'
    };
    try {
        const response = await axios.post(url, qs.stringify(data), { headers });
        return response.data.dlink;
    } catch (error) {
        return { success: false, message: error.message };
    }
  },
  download: async (req, res) => {
    const urls = req.query.url;
    res.setHeader('Access-Control-Allow-Origin', '*'); // Mendukung CORS
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const musicData = await appledown.getData(urls);
    if (musicData) {
        // Ekstraksi data lainnya dan generate link
        const downloadLink = await appledown.getAudio(musicData.name, musicData.artist, urls, musicData.token);
        const extractedData = {
            name: musicData.name,
            albumname: musicData.albumname,
            artist: musicData.artist,
            thumb: musicData.thumb,
            duration: musicData.duration,
            url: urls,
            downloadLink: downloadLink.replace(/ /g, '%20') // Ganti spasi dengan %20
        };
        res.json(extractedData);
    } else {
        res.json({ success: false, message: "Data tidak ditemukan" });
    }
  }
};

module.exports = (req, res) => {
  if (req.method === 'GET') {
    return appledown.download(req, res);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Mendukung CORS untuk OPTIONS
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(405).send('Method Not Allowed');
  }
};
