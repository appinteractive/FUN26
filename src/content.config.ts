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
    language: z.enum(["de", "en"]).optional(),
    speakers: z
      .array(
        z.object({
          name: z.string(),
          role: z.string().optional(),
          image: z.string(),
        })
      )
      .default([]),
    resources: z
      .array(
        z.object({
          label: z.string(),
          // Absolute URL or site-relative path (e.g. /resources/foo.pdf)
          url: z.string(),
          kind: z.enum(["slides", "video", "code", "link"]).default("link"),
        })
      )
      .default([]),
  }),
})

const speakers = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/speakers" }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    image: z.string(),
    linkedin: z.url().optional(),
    website: z.url().optional(),
  }),
})

export const collections = { sessions, speakers }
