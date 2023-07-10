import {EventType} from "./ingress-event-type";
import {EventDetailsType} from "./ingress-event-detail-type";

export interface IngressInput {
  match_id : number;
  timestamp: string;
  team: string;
  opponent: string;
  event_type?: EventType;
  event_details?: EventDetailsType;
}