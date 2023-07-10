import * as Joi from 'joi';
import { IngressInput } from '../models/ingress-input';

/**
 * Validates the input data for the ingress request.
 *
 * @param body - The body of the ingress request.
 * @returns A validation error message if the input is invalid, otherwise null.
 */
export function validateInput(body: IngressInput): string | null {
  // Define the validation schema using Joi
  const schema = Joi.object({
    match_id: Joi.string().required(),
    timestamp: Joi.string().required(),
    team: Joi.string().required().max(30),
    opponent: Joi.string().required().max(30),
    event_type: Joi.string().valid('goal', 'foul', 'corner', 'offside'),
    event_details: Joi.object({
      player: Joi.object({
        name: Joi.string(),
        position: Joi.string(),
        number: Joi.number(),
      }),
      goal_type: Joi.string().valid('open play', 'penalty', 'free-kick'),
      minute: Joi.number().max(120),
      assist: Joi.object({
        name: Joi.string(),
        position: Joi.string(),
        number: Joi.number(),
      }),
      video_url: Joi.string(),
    }),
  });

  // Validate the body against the schema
  const { error } = schema.validate(body);

  // Return the validation error message, if any
  return error ? error.details[0].message : null;
}
