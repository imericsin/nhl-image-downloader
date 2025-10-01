// api/roster.js
import axios from 'axios';

const nhlTeams = {
  'NJD': { id: 1, name: 'New Jersey Devils', abbrev: 'NJD' },
  'NYI': { id: 2, name: 'New York Islanders', abbrev: 'NYI' },
  'NYR': { id: 3, name: 'New York Rangers', abbrev: 'NYR' },
  'PHI': { id: 4, name: 'Philadelphia Flyers', abbrev: 'PHI' },
  'PIT': { id: 5, name: 'Pittsburgh Penguins', abbrev: 'PIT' },
  'BOS': { id: 6, name: 'Boston Bruins', abbrev: 'BOS' },
  'BUF': { id: 7, name: 'Buffalo Sabres', abbrev: 'BUF' },
  'MTL': { id: 8, name: 'Montreal Canadiens', abbrev: 'MTL' },
  'OTT': { id: 9, name: 'Ottawa Senators', abbrev: 'OTT' },
  'TOR': { id: 10, name: 'Toronto Maple Leafs', abbrev: 'TOR' },
  'CAR': { id: 12, name: 'Carolina Hurricanes', abbrev: 'CAR' },
  'FLA': { id: 13, name: 'Florida Panthers', abbrev: 'FLA' },
  'TBL': { id: 14, name: 'Tampa Bay Lightning', abbrev: 'TBL' },
  'WSH': { id: 15, name: 'Washington Capitals', abbrev: 'WSH' },
  'CHI': { id: 16, name: 'Chicago Blackhawks', abbrev: 'CHI' },
  'DET': { id: 17, name: 'Detroit Red Wings', abbrev: 'DET' },
  'NSH': { id: 18, name: 'Nashville Predators', abbrev: 'NSH' },
  'STL': { id: 19, name: 'St. Louis Blues', abbrev: 'STL' },
  'CGY': { id: 20, name: 'Calgary Flames', abbrev: 'CGY' },
  'COL': { id: 21, name: 'Colorado Avalanche', abbrev: 'COL' },
  'EDM': { id: 22, name: 'Edmonton Oilers', abbrev: 'EDM' },
  'VAN': { id: 23, name: 'Vancouver Canucks', abbrev: 'VAN' },
  'ANA': { id: 24, name: 'Anaheim Ducks', abbrev: 'ANA' },
  'DAL': { id: 25, name: 'Dallas Stars', abbrev: 'DAL' },
  'LAK': { id: 26, name: 'Los Angeles Kings', abbrev: 'LAK' },
  'SJS': { id: 28, name: 'San Jose Sharks', abbrev: 'SJS' },
  'CBJ': { id: 29, name: 'Columbus Blue Jackets', abbrev: 'CBJ' },
  'MIN': { id: 30, name: 'Minnesota Wild', abbrev: 'MIN' },
  'WPG': { id: 52, name: 'Winnipeg Jets', abbrev: 'WPG' },
  'ARI': { id: 53, name: 'Utah Hockey Club', abbrev: 'UTA' },
  'VGK': { id: 54, name: 'Vegas Golden Knights', abbrev: 'VGK' },
  'SEA': { id: 55, name: 'Seattle Kraken', abbrev: 'SEA' }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { teamCode } = req.query;
  
  if (!teamCode) {
    return res.status(400).json({ error: 'Team code required' });
  }
  
  const team = nhlTeams[teamCode.toUpperCase()];
  
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  try {
    // Try the new NHL API endpoint
    const apiUrl = `https://api-web.nhle.com/v1/roster/${team.abbrev}/current`;
    console.log('Fetching from:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    const roster = [];
    
    // Process forwards
    if (response.data.forwards) {
      response.data.forwards.forEach(player => {
        roster.push({
          id: player.id.toString(),
          name: `${player.firstName.default} ${player.lastName.default}`,
          position: 'F'
        });
      });
    }
    
    // Process defensemen
    if (response.data.defensemen) {
      response.data.defensemen.forEach(player => {
        roster.push({
          id: player.id.toString(),
          name: `${player.firstName.default} ${player.lastName.default}`,
          position: 'D'
        });
      });
    }
    
    // Process goalies
    if (response.data.goalies) {
      response.data.goalies.forEach(player => {
        roster.push({
          id: player.id.toString(),
          name: `${player.firstName.default} ${player.lastName.default}`,
          position: 'G'
        });
      });
    }
    
    res.status(200).json({ 
      teamCode: teamCode.toUpperCase(),
      teamName: team.name,
      roster: roster,
      totalPlayers: roster.length
    });
    
  } catch (error) {
    console.error('Error fetching roster:', error.message);
    console.error('Full error:', error.response?.data || error);
    res.status(500).json({ 
      error: 'Failed to fetch roster from NHL API',
      details: error.message 
    });
  }
}