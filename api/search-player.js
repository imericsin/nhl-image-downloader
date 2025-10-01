// api/search-player.js
import axios from 'axios';

const nhlTeams = {
  'NJD': 'New Jersey Devils', 'NYI': 'New York Islanders', 'NYR': 'New York Rangers',
  'PHI': 'Philadelphia Flyers', 'PIT': 'Pittsburgh Penguins', 'BOS': 'Boston Bruins',
  'BUF': 'Buffalo Sabres', 'MTL': 'Montreal Canadiens', 'OTT': 'Ottawa Senators',
  'TOR': 'Toronto Maple Leafs', 'CAR': 'Carolina Hurricanes', 'FLA': 'Florida Panthers',
  'TBL': 'Tampa Bay Lightning', 'WSH': 'Washington Capitals', 'CHI': 'Chicago Blackhawks',
  'DET': 'Detroit Red Wings', 'NSH': 'Nashville Predators', 'STL': 'St. Louis Blues',
  'CGY': 'Calgary Flames', 'COL': 'Colorado Avalanche', 'EDM': 'Edmonton Oilers',
  'VAN': 'Vancouver Canucks', 'ANA': 'Anaheim Ducks', 'DAL': 'Dallas Stars',
  'LAK': 'Los Angeles Kings', 'SJS': 'San Jose Sharks', 'CBJ': 'Columbus Blue Jackets',
  'MIN': 'Minnesota Wild', 'WPG': 'Winnipeg Jets', 'ARI': 'Utah Hockey Club',
  'VGK': 'Vegas Golden Knights', 'SEA': 'Seattle Kraken'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }
  
  try {
    // Use NHL's search API
    const searchUrl = `https://search.d3.nhle.com/api/v1/search/player?culture=en-us&limit=20&q=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const results = response.data.map(player => ({
      id: player.playerId.toString(),
      name: player.name,
      teamCode: player.teamAbbrev || 'N/A',
      teamName: nhlTeams[player.teamAbbrev] || player.teamAbbrev || 'Unknown Team',
      position: player.positionCode || ''
    }));
    
    res.status(200).json({ results });
    
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
}