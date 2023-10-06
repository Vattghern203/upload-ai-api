import { FastifyInstance } from "fastify";

import { z } from "zod";
import { prisma } from "../lib/prisma";
import { openai } from "../lib/openai";


export async function generateAICompletionRoute(app: FastifyInstance) {


    app.post('/ai/complete', async (req, reply) => {

        try {

            const bodySchema = z.object({
                videoId: z.string().uuid(),
                description: z.string(),
                temperature: z.number().min(0).max(1).default(0.5)

            })

            const { videoId, description, temperature } = bodySchema.parse(req.body)

            const video = await prisma.video.findUniqueOrThrow({
                where: {
                    id: videoId
                }
            })

            if (!video.transcription) {
                return reply.status(400).send({
                    error: 'Video transcription was not generated yet.'
                })
            }

            const promptMessage = description.replace('{transcription}', video.transcription)

            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo-16k'
            })

            return {
                videoId,
                description,
                temperature
            }

        } catch (err) {

            console.error(err)
        }
    })
}