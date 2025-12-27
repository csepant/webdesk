
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  contact: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
  }),

  widgets: defineTable({
    name: v.string(),
    description: v.string(),
    value: v.number(),
    updatedAt: v.string(),
  }).index("by_name", ["name"]),

  files: defineTable({
    name: v.string(),
    content: v.string(),
    updatedAt: v.string(),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  }).index("by_name", ["name"]),

});
