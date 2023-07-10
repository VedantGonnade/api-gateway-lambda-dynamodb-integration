import {EventDetailsType} from "./ingress-event-detail-type";

export interface MatchEvent {
event_type: string;
date: string;
event_details:  EventDetailsType
}