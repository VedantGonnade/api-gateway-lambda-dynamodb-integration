import {MatchEvent} from "./match-event";

export interface Matches {
  match_id: string;
  team: string;
  opponent: string;
  date: string;
  event?: MatchEvent[] | null;
}