import {PlayerType} from "./player-type"

export interface EventDetailsType {
  player: PlayerType;
  goal_type?: string;
  minute: string;
  assist: PlayerType;
  video_url: string;
}