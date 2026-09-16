import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getRootFiles = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("files")
      .filter((q) =>
        q.and(
          q.eq(q.field("parentId"), undefined),
          q.neq(q.field("deleted"), true),
        ),
      )
      .collect();
  },
});

export const getFilesByParent = query({
  args: {
    parentId: v.id("files"),
  },
  handler: async (ctx, { parentId }) => {
    return await ctx.db
      .query("files")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .filter((q) => q.neq(q.field("deleted"), true))
      .collect();
  },
});

export const getFileById = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, { fileId }) => {
    return await ctx.db.get(fileId);
  },
});

export const getFileByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("files")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
  },
});

export const createFile = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("directory"), v.literal("app")),
    content: v.optional(v.string()),
    appComponent: v.optional(v.string()),
    parentId: v.optional(v.id("files")),
    modifiable: v.boolean(),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("files", {
      name: args.name,
      type: args.type,
      content: args.content,
      appComponent: args.appComponent,
      parentId: args.parentId,
      modifiable: args.modifiable,
      updatedAt: new Date().toISOString(),
      position: args.position,
    });
    return fileId;
  },
});

export const updateFileContent = mutation({
  args: {
    fileId: v.id("files"),
    newContent: v.string(),
  },
  handler: async (ctx, { fileId, newContent }) => {
    const doc = await ctx.db.get(fileId);
    if (!doc || doc.modifiable === false) {
      throw new Error("This file cannot be modified.");
    }
    await ctx.db.patch(fileId, {
      content: newContent,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const renameFile = mutation({
  args: {
    fileId: v.id("files"),
    newName: v.string(),
  },
  handler: async (ctx, { fileId, newName }) => {
    const doc = await ctx.db.get(fileId);
    if (!doc || doc.modifiable === false) {
      throw new Error("This file cannot be modified.");
    }
    await ctx.db.patch(fileId, {
      name: newName,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, { fileId }) => {
    const doc = await ctx.db.get(fileId);
    if (!doc || doc.modifiable === false) {
      throw new Error("This file cannot be deleted.");
    }
    await ctx.db.patch(fileId, {
      deleted: true,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateFilePosition = mutation({
  args: {
    fileId: v.id("files"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, { fileId, position }) => {
    await ctx.db.patch(fileId, {
      position: position,
      updatedAt: new Date().toISOString(),
    });
  },
});
