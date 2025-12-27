import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getWidgetByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("widgets")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
  },
});

export const createWidget = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { name, description }) => {
    const widgetId = await ctx.db.insert("widgets", {
      name,
      description,
      value: 0,
      updatedAt: new Date().toISOString(),
    });
    return widgetId;
  },
});

export const updateWidgetValue = mutation({
  args: {
    widgetId: v.id("widgets"),
    newValue: v.number(),
  },
  handler: async (ctx, { widgetId, newValue }) => {
    await ctx.db.patch(widgetId, {
      value: newValue,
      updatedAt: new Date().toISOString(),
    });
  },
});
