import { mutation } from "./_generated/server";

const SYSTEM_FILES = [
  {
    name: "ABOUT_ME.txt",
    type: "file" as const,
    modifiable: false,
    position: { x: 20, y: 20 },
    content: `# About Me

**Developer | Cloud Engineer | Tinkerer**

Hello! My name is Cristian Sepulveda and I am a software developer based in Santiago, Chile. I have been working for 10 years in IT in different positions and roles. If I am honest I stumbled into this career a bit by accident. I started out as a WordPress administrator at a startup and well, fell in love with programming right away. Starting out by just writing a bit of HTML and CSS and then learning PHP and JavaScript. I am passionate about technology and solving problems in creative ways.

I love working with modern technologies and frameworks to create seamless user experiences.

![Me on my trip through Scandinavia](/me.jpeg)

*Me on my trip through Scandinavia*

---

In my free time, I enjoy hiking, photography, and exploring new technologies. Feel free to reach out to me for collaboration or just to say hi!`,
  },
  {
    name: "PROJECTS.d",
    type: "file" as const,
    modifiable: false,
    position: { x: 20, y: 120 },
    content: `# Projects

**Things I've Done**

## Arduino/Microcontroller Projects

- Self watering planter
- ESP32 weather station
- Home automation system with MQTT

## Web Development Projects

- **DNRO** — Gig worker app.
- **Parkit** — Airbnb for parking spots.`,
  },
  {
    name: "BLOG.txt",
    type: "file" as const,
    modifiable: false,
    position: { x: 20, y: 220 },
    content: `# Blog

**I write in human language sometimes**

Check out my latest posts on Medium! I tend to write about technology, web frameworks, DevOps things and more.

- [Why Convex Feels Like Cheating](https://medium.com/@csep94/why-convex-feels-like-cheating-d20d9f9c8ce1)`,
  },
  {
    name: "README.md",
    type: "file" as const,
    modifiable: false,
    position: { x: 20, y: 320 },
    content: `# README

**About this site**

I set the goal to make my personal website as a desktop environment. I was tired of creating the same old boring websites so I thought, why not make it fun? Sometimes that is my sole motivator for trying things. Making it fun and engaging for the user all the while having a bit of fun myself while building things. Feel free to explore and interact with the different files on the desktop!

## The Design

I am inspired by futuristic and cyberpunk aesthetics and I wanted to recreate that vibe here. Am fascinated by the blue tinted screens and neon lights you often see in movies and games so I tried incorporating some of those elements into the design of this site. I have to admit, I was also lazy and wanted to come up with a design that allowed to reuse a lot of the same components so windows and files made perfect sense. I also did not want to spend time messing with routing and navigation (again, lazy) so a desktop metaphor made perfect sense. After all these years making corporate and business websites, I just wanted to have fun and make something different.`,
  },
  {
    name: "ContactMe.app",
    type: "app" as const,
    modifiable: false,
    appComponent: "contact",
    position: { x: 20, y: 420 },
  },
];

export const seed = mutation({
  handler: async (ctx) => {
    for (const file of SYSTEM_FILES) {
      const existing = await ctx.db
        .query("files")
        .withIndex("by_name", (q) => q.eq("name", file.name))
        .first();

      if (!existing) {
        await ctx.db.insert("files", {
          name: file.name,
          type: file.type,
          modifiable: file.modifiable,
          content: file.content,
          appComponent: file.appComponent,
          position: file.position,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  },
});
