import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const sessions = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/sessions" }),
  schema: z.object({
    title: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date(),
    stage: z.string(),
    stageOrder: z.number(),
    kind: z.enum(["talk", "workshop", "break"]),
    speakers: z
      .array(
        z.object({
          name: z.string(),
          role: z.string().optional(),
          image: z.string(),
        })
      )
      .default([]),
  }),
})

export const collections = { sessions }
