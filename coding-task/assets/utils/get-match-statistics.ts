import { MatchStatisticsEvent } from '../models/match-statistics-event';

/**
 * Retrieves match statistics for a specific match ID from the list of items.
 *
 * @param matchID - The match ID for which to retrieve the statistics.
 * @param items - The list of match statistics items.
 * @returns The match statistics including total goals and fouls.
 */
export function getMatchStatistics(matchID: string, items: MatchStatisticsEvent[]) {
  // Filter the items to include only those with a matching match ID
  const matchItems = items.filter((item) => item.match_id === matchID);

  // Count the total goals and fouls in the match items
  const totalGoals = matchItems.filter((item) => item.event_type === 'goal').length;
  const totalFouls = matchItems.filter((item) => item.event_type === 'foul').length;

  // Return the match statistics
  return {
    team: matchItems[0].team,
    opponent: matchItems[0].opponent,
    total_goals: totalGoals,
    total_fouls: totalFouls,
  };
}
