/**
 * Test Email Auth Endpoint
 *
 * Simple endpoint to verify email auth backend is working
 */

import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"

export class TestEmailAuth extends OpenAPIRoute {
	schema = {
		tags: ["System"],
		summary: "Test email auth endpoint",
		description: "Verify the email auth backend is reachable",
		responses: {
			"200": {
				description: "Email auth endpoint is reachable",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							message: z.string(),
							timestamp: z.string()
						})
					}
				}
			}
		}
	}

	async handle(c: AppContext) {
		return Response.json({
			success: true,
			message: "Email auth endpoint is reachable!",
			timestamp: new Date().toISOString()
		})
	}
}
