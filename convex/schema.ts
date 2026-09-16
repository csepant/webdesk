
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
    type: v.optional(v.union(v.literal("file"), v.literal("directory"), v.literal("app"))),
    content: v.optional(v.string()),
    appComponent: v.optional(v.string()),
    parentId: v.optional(v.id("files")),
    modifiable: v.optional(v.boolean()),
    updatedAt: v.string(),
    position: v.optional(v.object({
      x: v.float64(),
      y: v.float64(),
    })),
    deleted: v.optional(v.boolean()),
  }).index("by_name", ["name"]).index("by_parent", ["parentId"]),

});
