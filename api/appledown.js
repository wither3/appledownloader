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
      console.error("Error:", error.message);
      return { success: false, message: error.message };
    }
  },
  getAudio: async (trackName, artist, urlMusic, token) => {
    const url = 'https://aaplmusicdownloader.com/api/composer/swd.php';
    const data = { song_name: trackName, artist_name: artist, url: urlMusic, token: token };
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'MyApp/1.0',
      'Referer': 'https://aaplmusicdownloader.com/song.php#'
    };
    try {
      const response = await axios.post(url, qs.stringify(data), { headers });
      let downloadLink = response.data.dlink;
      downloadLink = downloadLink.replace(/ /g, '%20');
      return downloadLink;
    } catch (error) {
      console.error("Error:", error.message);
      return { success: false, message: error.message };
    }
  },
  download: async (urls) => {
    const musicData = await appledown.getData(urls);
    if (musicData) {
      const encodedData = encodeURIComponent(JSON.stringify([
        musicData.name,
        musicData.albumname,
        musicData.artist,
        musicData.thumb,
        musicData.duration,
        musicData.url
      ]));
      const url = 'https://aaplmusicdownloader.com/song.php';
      const headers = {
        'authority': 'aaplmusicdownloader.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://aaplmusicdownloader.com',
        'referer': 'https://aaplmusicdownloader.com/',
        'user-agent': 'MyApp/1.0'
      };
      const data = `data=${encodedData}`;
      try {
        const response = await axios.post(url, data, { headers });
        const $ = cheerio.load(response.data);
        const trackName = $('td:contains("Track Name:")').next().text();
        const albumName = $('td:contains("Album:")').next().text();
        const duration = $('td:contains("Duration:")').next().text();
        const artist = $('td:contains("Artist:")').next().text();
        const thumb = $('figure.image img').attr('src');
        const urlMusic = urls;
        const token = $('a#download_btn').attr('token');
        const downloadLink = await appledown.getAudio(trackName, artist, urlMusic, token);

        const extractedData = {
          name: trackName,
          albumname: albumName,
          artist: artist,
          thumb: thumb,
          duration: duration,
          url: urlMusic,
          downloadLink: downloadLink
        };

        return extractedData;
      } catch (error) {
        console.error("Error:", error.message);
        return { success: false, message: error.message };
      }
    }
  }
};

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

  const result = await appledown.download(url);
  res.json(result);
};
        
