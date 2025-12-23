import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { name, email, message }) => {
    await ctx.db.insert("contact", {
      name,
      email,
      message,
    });
  },
});
