import { useEffect } from "react";


export const RightClickMenu = ({ position, onClose, onCreateFile }: { position: { x: number, y: number }, onClose: () => void, onCreateFile: () => void }) => {


  useEffect(() => {
    const handleClickOutside = () => {
      onClose();
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="absolute z-50 w-48 bg-slate-950 border border-gray-300/25 rounded shadow-lg" style={{ top: position.y, left: position.x }}>
      <ul className="py-1" >
        <li className="px-4 text-white py-2 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
          onClick={() => {
            onCreateFile();
            onClose();
          }}
        > Create New File</li>
      </ul>
    </div>
  );
}
