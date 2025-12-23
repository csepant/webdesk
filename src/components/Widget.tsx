import { useRef } from 'react';


export function Widget({ title, content, position }: { title: string; content: React.ReactNode; position?: { x: number; y: number } }) {
  const widgetRef = useRef<HTMLDivElement>(null);


  return (
    <div className="flex w-full h-fit">
      <div className="border border-sky-600/50 backdrop-blur-md w-full  bg-slate-950/50 shadow-lg rounded-lg overflow-hidden p-4">
        <div className="bg-transparent text-sky-500 mb-2 border-b border-sky-600/50 pb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="widget-content">

          {content}
        </div>
      </div>
    </div>
  );
}
