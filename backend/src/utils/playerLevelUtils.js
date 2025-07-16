/**
 * Utility functions for determining player levels consistently across the application
 */

/**
 * Determines the player level based on the player's team affiliations
 * @param {Object} player - Player object with team fields
 * @returns {string} Player level (College, High School, Youth/Travel, Independent, Affiliate, Little League, or N/A)
 */
const getPlayerLevel = (player) => {
  if (!player) return 'N/A';
  
  if (player.college) {
    return 'College';
  } else if (player.high_school) {
    return 'High School';
  } else if (player.travel_team) {
    return 'Youth/Travel';
  } else if (player.indy) {
    return 'Independent';
  } else if (player.affiliate) {
    return 'Affiliate';
  } else if (player.little_league) {
    return 'Little League';
  }
  
  return 'N/A';
};

/**
 * Updates a player's level fields based on the provided level and team information
 * @param {Object} player - Player object to update
 * @param {string} level - Desired player level
 * @param {string} teamName - Team name
 * @param {string} teamType - Type of team (optional, for disambiguation)
 * @returns {Object} Updated player data
 */
const updatePlayerLevel = (player, level, teamName, teamType = null) => {
  const updateData = {
    college: null,
    high_school: null,
    travel_team: null,
    indy: null,
    affiliate: null,
    little_league: null
  };

  switch (level.toLowerCase()) {
    case 'college':
      updateData.college = teamName;
      break;
    case 'high school':
      if (teamType === 'travel_team') {
        updateData.travel_team = teamName;
      } else {
        updateData.high_school = teamName;
      }
      break;
    case 'youth/travel':
      if (teamType === 'little_league') {
        updateData.little_league = teamName;
      } else {
        updateData.travel_team = teamName;
      }
      break;
    case 'independent':
      updateData.indy = teamName;
      break;
    case 'affiliate':
      updateData.affiliate = teamName;
      break;
    case 'little league':
      updateData.little_league = teamName;
      break;
  }

  return updateData;
};

module.exports = {
  getPlayerLevel,
  updatePlayerLevel
}; 