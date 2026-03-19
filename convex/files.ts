import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const getFiles = query({
  handler: async (ctx) => {
    return await ctx.db.query("files").filter((q) => q.neq(q.field("deleted"), true)).collect();
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
    content: v.string(),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  },
  handler: async (ctx, { name, content, position }) => {
    const fileId = await ctx.db.insert("files", {
      name,
      content,
      updatedAt: new Date().toISOString(),
      position: position,

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

