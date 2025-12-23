import { LoaderCircle } from "lucide-react";

export default function Button({
  children,
  onClick,
  isLoading,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;

}) {
  return (
    <button className="flex flex-row align-items-center w-fit bg-sky-600 hover:bg-sky-700 text-white font-mono uppercase font-semibold cursor-pointer transition-all py-2 px-4 shadow-lg hover:shadow-xl duration-300" onClick={onClick}
      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
      {children}
      {isLoading && <LoaderCircle className="ml-2 animate-spin">...</LoaderCircle>}
    </button>
  );
} 
