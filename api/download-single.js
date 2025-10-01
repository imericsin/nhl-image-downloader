// api/download-single.js
import axios from 'axios';
import sharp from 'sharp';

function getImageUrl(teamCode, playerId) {
  return `https://assets.nhle.com/mugs/nhl/20242025/${teamCode.toUpperCase()}/${playerId}.png`;
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
    const imageUrl = getImageUrl(teamCode, playerId);
    console.log(`Fetching image for player ${playerId}...`);
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    const processedImage = await cropAndResizeImage(Buffer.from(response.data));
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="player.png"');
    res.status(200).send(processedImage);
    
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: 'Download failed', details: error.message });
  }
}