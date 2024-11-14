const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav', '4k'];
const formatVideo = ['360', '480', '720', '1080', '1440'];

const appleMusicDownloader = async (url) => {
  try {
    const response = await axios.get(`https://api.applemusicdownloader.com/download?url=${url}`);
    const data = response.data;
    return {
      success: true,
      fitur: "applemusic",
      title: data.title,
      artist: data.artist,
      thumbnail: data.thumbnail,
      downloadUrl: data.downloadUrl
    };
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
    return { success: false, message: error.message };
  }
};

const youtubeDownloader = {
  download: async (url, format) => {
    try {
      const response = await axios.get(`https://p.oceansaver.in/ajax/download.php?copyright=0&format=${format}&url=${url}`, {
        headers: {
          'User-Agent': 'MyApp/1.0',
          'Referer': 'https://ddownr.com/enW7/youtube-video-downloader'
        }
      });

      const data = response.data;
      const media = await youtubeDownloader.cekProgress(data.id);
      return {
        success: true,
        fitur: "youtube",
        format: format,
        title: data.title,
        thumbnail: data.info.image,
        downloadUrl: media
      };
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error.message);
      return { success: false, message: error.message };
    }
  },
  cekProgress: async (id) => {
    try {
      const progressResponse = await axios.get(`https://p.oceansaver.in/ajax/progress.php?id=${id}`, {
        headers: {
          'User-Agent': 'MyApp/1.0',
          'Referer': 'https://ddownr.com/enW7/youtube-video-downloader'
        }
      });

      const data = progressResponse.data;

      if (data.progress === 1000) {
        return data.download_url;
      } else {
        console.log('Masih belum selesai wak 😂, sabar gw cek lagi...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return youtubeDownloader.cekProgress(id);
      }
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error.message);
      return { success: false, message: error.message };
    }
  }
};

app.get('/api/appledown/download', async (req, res) => {
  const { url, fitur, format } = req.query;

  if (!url || !fitur) {
    return res.status(400).json({ success: false, message: "URL dan fitur diperlukan" });
  }

  if (fitur === 'youtube') {
    if (!format || ![...formatAudio, ...formatVideo].includes(format)) {
      return res.status(400).json({ success: false, message: "Format tidak valid untuk YouTube" });
    }

    const result = await youtubeDownloader.download(url, format);
    res.json(result);

  } else if (fitur === 'applemusic') {
    const result = await appleMusicDownloader(url);
    res.json(result);

  } else {
    res.status(400).json({ success: false, message: "Fitur tidak valid, pilih 'youtube' atau 'applemusic'" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
