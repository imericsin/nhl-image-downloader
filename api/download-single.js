// api/download-single.js
import axios from 'axios';
import sharp from 'sharp';

function getImageUrls(teamCode, playerId) {
  return [
    `https://assets.nhle.com/mugs/nhl/20252026/${teamCode.toUpperCase()}/${playerId}.png`,
    `https://assets.nhle.com/mugs/nhl/20242025/${teamCode.toUpperCase()}/${playerId}.png`,
    `https://assets.nhle.com/mugs/nhl/20232024/${teamCode.toUpperCase()}/${playerId}.png`
  ];
}

async function fetchImageWithFallback(teamCode, playerId) {
  const urls = getImageUrls(teamCode, playerId);
  
  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      return Buffer.from(response.data);
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('No image found in any season folder');
}

async function cropAndResizeImage(imageBuffer) {
  const metadata = await sharp(imageBuffer).metadata();
  const size = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - size) / 2);
  const top = Math.floor((metadata.height - size) / 2);
  
  return await sharp(imageBuffer)
    .extract({ left, top, width: size, height: size })
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { teamCode, playerId } = req.query;
  
  if (!teamCode || !playerId) {
    return res.status(400).json({ error: 'Team code and player ID required' });
  }
  
  try {
    console.log(`Fetching image for player ${playerId}...`);
    
    const imageBuffer = await fetchImageWithFallback(teamCode, playerId);
    const processedImage = await cropAndResizeImage(imageBuffer);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="player.png"');
    res.status(200).send(processedImage);
    
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: 'Download failed', details: error.message });
  }
}