import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd";

export default function FileComponent({ name, onClick, icon, position }: {
  name: string; onClick: () => void, icon: React.ReactNode,
  position?: { x: number; y: number }
}) {
  const [onFocus, setOnFocus] = useState(false);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setOnFocus(false);
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  return (
    <Rnd
      default={{ x: position?.x ? position.x : 20, y: position?.y ? position.y : 20, width: 100, height: 100 }}
      minWidth={80}
      minHeight={80}
      bounds="parent"
      dragGrid={[20, 20]}
      enableResizing={false}
    >
      <div className={`w-full h-full flex flex-col items-center justify-center cursor-pointer ${onFocus ? 'bg-sky-600/30' : 'bg-transparent'} rounded-lg p-2 hover:bg-sky-600/20`}
        onBlur={() => setOnFocus(false)}
        onDoubleClick={onClick}
        onClick={() => setOnFocus(true)}
        onTouchStart={() => { setOnFocus(true); onClick() }}


      >
        <div className="text-sky-400 mb-2 text-shadow-lg">
          {icon}
        </div>
        <div className="text-sm text-white text-center px-2 text-shadow-lg">
          {name}
        </div>
      </div>
    </Rnd>
  )
}

