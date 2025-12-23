
import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  X,
  Maximize2,
  FileUser,
  FolderKanban,
  FileText,
  BookText,
  Mail,
  Aperture,
  UserRound,
  CloudSun
} from 'lucide-react'
import { Rnd } from 'react-rnd'
import { Widget } from '@/components/Widget'
import File from '@/components/File'
import Window from '@/components/Window'
import Button from '@/components/Button'
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";



export const Route = createFileRoute('/')({ component: App })



function App() {

  const [isOpen, setIsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);
  const [siteInfoOpen, setSiteInfoOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const desktopRef = useRef<HTMLDivElement | null>(null);
  const [contactFormSubmitted, setContactFormSubmitted] = useState(false);
  const [contactFormLoading, setContactFormLoading] = useState(false);
  const [contactFormError, setContactFormError] = useState<string | null>(null);

  // contact form
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const submitContactForm = useMutation(api.contact.submitContactForm);


  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormLoading(true);
    const { name, email, message } = contactFormData;

    await submitContactForm({ name, email, message });
    setContactFormSubmitted(true);
    setContactFormLoading(false);
    setContactFormData({ name: '', email: '', message: '' });
  }


  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="w-full h-full inset-0 bg-black z-[-1] overflow-hidden" >
        <video
          autoPlay
          loop
          muted
          className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-80"
        >

          <source src="/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <header className="w-full py-2 px-4 bg-slate-800 backdrop-blur-md flex justify-between items-center z-40">
        <div className="flex items-center space-x-2">
          <Aperture size={20} className="text-sky-400" />
          <span className="text-sm text-white font-semibold">Cris's Desktop</span>
        </div>
        <div className="flex items-center space-x-2">

          <div className="text-xs text-white/50">Guest</div>
          <UserRound size={20} className="text-sky-400" />
        </div>
      </header>


      <section ref={desktopRef} className="grid grid-cols-4 place-items-center min-h-screen bg-gradient-to-br from-slate-700 via-stone-950 to-cyan-900 text-white overflow-hidden">
        {/* background video */}
        <File
          name="ABOUT_ME.txt"
          onClick={() => setIsOpen(!isOpen)}
          icon={
            <FileUser size={36} />

          }
          position={{ x: 20, y: 20 }}
        />
        <File
          name="PROJECTS.d"
          onClick={() => setProjectsOpen(!projectsOpen)}
          icon={
            <FolderKanban size={36} />

          }
          position={{ x: 20, y: 120 }}
        />
        <File
          name="BLOG.txt"
          onClick={() => setBlogOpen(!blogOpen)}
          icon={
            <FileText size={36} />

          }
          position={{ x: 20, y: 220 }}
        />
        <File
          name="README.md"
          onClick={() => setSiteInfoOpen(!siteInfoOpen)}
          icon={
            <BookText size={36} />

          }
          position={{ x: 20, y: 320 }}
        />
        <File
          name="ContactMe.app"
          onClick={() => setContactOpen(!contactOpen)}
          icon={
            <Mail size={36} />

          }
          position={{ x: 20, y: 420 }}
        />
        <Window open={isOpen} title="ABOUT_ME.txt" subtitle="Developer | Cloud Engineer | Tinkerer" content={
          <div className=" h-full">
            <div className="grid grid-cols-2" >
              <div>
                <p className="mb-2">Hello! My name is Cristian Sepulveda and I am a software developer based in Santiago, Chile. I have been working for 10 years in IT in different positions and roles. If I am honest I stumbled into this carreer a bit by accident. I started out as a WordPress administrator at a startup and well, fell in love with programming right away. Starting out by just writing a bit of HTML and CSS and then learning PHP and JavaScript. I am passionate about technology and solving problems in creative ways.</p>
                <p>
                  I love working with modern technologies and frameworks to create seamless user experiences.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <img src="/me.jpeg" alt="Profile" className="w-fit h-auto border border-sky-600 ml-4 mb-4 col-span-1" />
                <span className="text-xs text-white/50">Me on my trip through Scandinavia</span>
              </div>
            </div>
            <div className="mt-4">
              <p>In my free time, I enjoy hiking, photography, and exploring new technologies. Feel free to reach out to me for collaboration or just to say hi!</p>
            </div>
          </div>
        }
          handler={() => setIsOpen(!isOpen)}
          parentRef={desktopRef}
        />

        <Window open={projectsOpen} title="PROJECTS.d" subtitle="Things I've Done" content={
          <div>
            <span className="font-semibold text-sky-500 text-md mb-2">Arduino/Microcontroller Projects:</span>
            <ul className="list-disc list-inside mb-4">
              <li>Self watering planter</li>
              <li>ESP32 weather station</li>
              <li>Home automation system with MQTT</li>
            </ul>
            <span className="font-semibold text-sky-500 text-md mb-2">Web Development Projects:</span>
            <ul className="list-disc list-inside">
              <li>DNRO - Gig worker app.</li>
              <li>Parkit - Airbnb for parking spots.</li>
              <li></li>
            </ul>
          </div>
        }
          handler={() => setProjectsOpen(!projectsOpen)}
          parentRef={desktopRef}
        />

        <Window open={blogOpen} title="BLOG.txt" subtitle="I write in human language sometimes" content={
          <div>
            <p>Check out my latest  posts on Medium! I tend to write about technology, web frameworks, DevOpsthings and more.</p>
            <ul className="list-disc list-inside mt-4">
              <li className="mb-2">
                <a href="https://medium.com/@csep94/why-convex-feels-like-cheating-d20d9f9c8ce1" target="_blank" className="text-sky-400 hover:underline">Why Convex Feels Like Cheating</a>
              </li>
            </ul>
          </div>
        }
          handler={() => setBlogOpen(!blogOpen)}
          parentRef={desktopRef}
        />
        <Window open={siteInfoOpen} title="README.md" subtitle="About this site" content={
          <div>
            <p>I set the goal to make my personal website as a desktop environment. I was tired of creating the same old boring websites so I thought, why not make it fun? Sometimes that is my sole motivator for trying things. Making it fun and engaging for the user all the while having a bit of fun myself while building things. Feel free to explore and interact with the different files on the desktop!</p>
            <h3 className="mt-4 mb-2 text-sky-500  font-semibold">The Design</h3>
            <p>
              I am inspired by futuristic and cyberpunk aesthetics and I wanted to recreate that vibe here.
              Am fascinated by the blue tinted screens and neon lights you often see in movies and games
              so I tried incorporating some of those elements into the design of this site. I have to admit, I was also lazy and wanted to come up with a design that allowed to reuse a lot of the same components so windows and files made perfect sense. I also did not want to spend time messing with routing and navigation (again, lazy) so a desktop metaphor made perfect sense. After all these years making corporate and business websites, I just wanted to have fun and make something different.
            </p>
          </div>
        }
          handler={() => setSiteInfoOpen(!siteInfoOpen)}
          parentRef={desktopRef}
        />
        <Window open={contactOpen} title="ContactMe.app" subtitle="Get in touch" content={
          <div>
            <p>If you'd like to get in touch, use the contact form below:</p>
            <form className="mt-4" onSubmit={(e) => handleContactFormSubmit(e)} >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="name">Name:</label>
                <input value={contactFormData.name} required onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })} type="text" id="name" className="w-full p-2 border border-sky-600 rounded bg-slate-800 text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full p-2 border border-sky-600 rounded bg-slate-800 text-white"
                  value={contactFormData.email}
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="message">Message:</label>
                <textarea
                  id="message"
                  rows={4}
                  required
                  className="w-full p-2 border border-sky-600 rounded bg-slate-800 text-white"
                  value={contactFormData.message}
                  onChange={(e) => setContactFormData({ ...contactFormData, message: e.target.value })}
                >
                </textarea>
              </div>
              <Button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded"
                isLoading={contactFormLoading}
              >
                Send
              </Button>
            </form>
            {contactFormSubmitted && (
              <p className="mt-4 text-green-400 font-semibold">Thank you for reaching out! I'll get back to you soon.</p>
            )}
          </div>
        }
          handler={() => setContactOpen(!contactOpen)}
          parentRef={desktopRef}
        />

        <section data-testid="widget-bar" className="hidden md:grid md:col-start-4 w-full h-full grid-rows-4 bg-slate-900/20 shadow-lg  backdrop-blur-sm gap-4 p-4 place-items-start self-start row-start-1">

          <Widget
            title="Cris's Stress Level"
            content={
              <div>
                <p>Current Stress Level: <span className="font-bold text-red-400">High</span></p>
                <div className="relative flex-row mt-2">
                  {[...Array(30)].map((_, i) => (
                    <div className="relative inline-block w-1 h-6 mx-0.5" key={i}>
                      <div className={`absolute bottom-0 left-0 h-full w-full ${i <= 10 ? 'bg-green-400' : i > 11 && i <= 20 ? 'bg-amber-400' : i > 20 ? 'bg-red-400' : 'bg-green-400'} rounded animate-ping opacity-75`} style={{ animationDelay: `${i * 15}ms` }}></div>
                      <div key={i} className={`relative inline-block w-1 h-6 ${i <= 10 ? 'bg-green-500' : i > 11 && i <= 20 ? 'bg-amber-500' : i > 20 ? 'bg-red-500' : 'bg-green-500'} rounded`}>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-white/50 text-sm italic">Cris's stress level is high due to tight deadlines and multiple projects. He may take longer to respond if you reach out to him now.</p>
              </div>
            }
          />
          <Widget
            title="Office Temperature"
            content={
              <div className="w-full">
                <div className="flex flex-row items-center">

                  <span className="text-6xl font-bold text-amber-400">22</span>
                  <div className="relative h-10 w-6">
                    <span className="absolute bottom-0 left-0 text-2xl font-semibold text-amber-300 mb-3">°C</span>
                  </div>

                  <CloudSun size={48} className="text-amber-400 ml-4 inline-block" />
                </div>
                <p className="mt-2 text-white/50 text-sm italic">Provided by: An ESP32 sitting on my desk.</p>
              </div>
            }
          />

        </section>

      </section >
    </div >
  )
}
