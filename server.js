// server.js - Node.js Backend for NHL Image Downloads
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const JSZip = require('jszip')

const app = express()
const PORT = 3000

// Enable CORS
app.use(cors())
app.use(express.json())

// Dallas Stars roster
const teamRosters = {
  dal: [
    { id: '3998', name: 'Jamie Benn' },
    { id: '4233875', name: 'Jason Robertson' },
    { id: '3904183', name: 'Roope Hintz' },
    { id: '5430', name: 'Tyler Seguin' },
    { id: '4874740', name: 'Wyatt Johnston' },
    { id: '4196914', name: 'Jake Oettinger' },
    { id: '5161', name: 'Matt Duchene' },
    { id: '3899938', name: 'Mikko Rantanen' },
    { id: '4233536', name: 'Miro Heiskanen' },
    { id: '4565239', name: 'Thomas Harley' },
    { id: '3069352', name: 'Esa Lindell' },
    { id: '3025540', name: 'Casey DeSmith' },
    { id: '4352800', name: 'Nils Lundkvist' },
    { id: '4342107', name: 'Ilya Lyubushkin' },
    { id: '2976842', name: 'Radek Faksa' },
    { id: '4024998', name: 'Sam Steel' },
    { id: '4697413', name: 'Mavrik Bourque' },
    { id: '2590857', name: 'Colin Blackwell' },
  ],
}

function getImageUrl(playerId) {
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/${playerId}.png&w=350&h=254`
}

// Get roster
app.get('/api/roster/:teamCode', (req, res) => {
  const { teamCode } = req.params
  const roster = teamRosters[teamCode]

  if (!roster)
    return res.status(404).json({ error: 'Team not found' })

  res.json({ teamCode, roster })
})

// Download images as ZIP
app.get('/api/download/:teamCode', async (req, res) => {
  const { teamCode } = req.params
  const roster = teamRosters[teamCode]

  if (!roster)
    return res.status(404).json({ error: 'Team not found' })

  try {
    const zip = new JSZip()
    const folder = zip.folder('Dallas_Stars_Photos')

    console.log(`Starting download for ${roster.length} players...`)

    for (const player of roster) {
      try {
        const imageUrl = getImageUrl(player.id)
        console.log(`Fetching ${player.name}...`)

        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
        })

        const fileName = `${player.name.replace(/\s+/g, '_')}.png`
        folder.file(fileName, response.data)

        console.log(`✓ Added ${player.name}`)
      }
      catch (error) {
        console.error(`✗ Failed ${player.name}`)
      }
    }

    console.log('Generating ZIP file...')
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="Dallas_Stars_Photos.zip"',
      'Content-Length': zipBuffer.length,
    })

    res.send(zipBuffer)
    console.log('✓ ZIP file sent!')
  }
  catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to create ZIP' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`🏒 Server running on http://localhost:${PORT}`)
})
