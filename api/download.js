// api/download.js
import axios from 'axios';
import JSZip from 'jszip';
import sharp from 'sharp';

function getImageUrl(teamCode, playerId) {
  return `https://assets.nhle.com/mugs/nhl/20242025/${teamCode.toUpperCase()}/${playerId}.png`;
}

async function cropAndResizeImage(imageBuffer) {
  try {
    // Get image metadata to determine original dimensions
    const metadata = await sharp(imageBuffer).metadata();
    
    // NHL images are typically wider than they are tall
    // We want to crop to square (1:1) from the center
    const size = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor((metadata.height - size) / 2);
    
    // Crop to square and resize to 300x300
    const processedImage = await sharp(imageBuffer)
      .extract({ left, top, width: size, height: size })
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();
    
    return processedImage;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  const { teamCode } = req.query;
  
  if (!teamCode) {
    return res.status(400).json({ error: 'Team code required' });
  }
  
  try {
    // Get current origin for the roster API call
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const origin = `${protocol}://${host}`;
    
    // First get the roster
    const rosterResponse = await axios.get(`${origin}/api/roster?teamCode=${teamCode}`);
    const { roster, teamName } = rosterResponse.data;
    
    if (!roster || roster.length === 0) {
      return res.status(404).json({ error: 'No players found' });
    }
    
    const zip = new JSZip();
    const folderName = teamName.replace(/\s+/g, '_') + '_Photos';
    const folder = zip.folder(folderName);
    
    console.log(`Starting download for ${roster.length} players from ${teamName}...`);
    
    let successCount = 0;
    
    for (const player of roster) {
      try {
        const imageUrl = getImageUrl(teamCode, player.id);
        console.log(`Fetching ${player.name}...`);
        
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        
        // Crop and resize the image to 300x300
        console.log(`Processing ${player.name}...`);
        const processedImage = await cropAndResizeImage(Buffer.from(response.data));
        
        const fileName = `${player.name.replace(/\s+/g, '_')}.png`;
        folder.file(fileName, processedImage);
        
        successCount++;
        console.log(`✓ Added ${player.name} (${successCount}/${roster.length})`);
      } catch (error) {
        console.error(`✗ Failed ${player.name}:`, error.message);
      }
    }
    
    if (successCount === 0) {
      return res.status(500).json({ error: 'Failed to download any images' });
    }
    
    console.log(`Generating ZIP file with ${successCount} images...`);
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);
    res.status(200).send(zipBuffer);
    
    console.log(`✓ ZIP sent with ${successCount} images!`);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create ZIP: ' + error.message });
  }
}