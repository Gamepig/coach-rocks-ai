/**
 * Health Check Endpoint
 *
 * Simple endpoint to verify the backend service is running
 */

import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"

export class Health extends OpenAPIRoute {
	schema = {
		tags: ["System"],
		summary: "Health check",
		description: "Verify the backend service is running",
		responses: {
			"200": {
				description: "Service is healthy",
				content: {
					"application/json": {
						schema: z.object({
							status: z.string(),
							timestamp: z.string(),
							service: z.string()
						})
					}
				}
			}
		}
	}

	async handle(c: AppContext) {
		return Response.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			service: "coach-backend"
		})
	}
}
