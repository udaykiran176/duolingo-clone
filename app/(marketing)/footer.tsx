import Image from "next/image";

import { Button } from "@/components/ui/button";
import { FaGoogle,FaMicrosoft } from "react-icons/fa";
import { AiOutlineOpenAI } from "react-icons/ai";
export const Footer = () => {
  return (
    <div className="hidden h-20 w-full border-t-2 border-slate-200 p-2 lg:block">
      <div className="mx-auto flex h-full max-w-screen-lg items-center justify-evenly">
        <Button size="lg" variant="ghost" className="w-full cursor-default">
        <FaGoogle className="mr-2" size={20} />
          Google
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <FaMicrosoft className="mr-2" size={20} />
          Microsoft
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <AiOutlineOpenAI className="mr-2" size={20} />
          chatGPT
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <AiOutlineOpenAI className="mr-2" size={20} />
          cursor
        </Button>

        <Button size="lg" variant="ghost" className="w-full cursor-default">
          <AiOutlineOpenAI className="mr-2" size={20} />
          Gemini
        </Button>
      </div>
    </div>
  );
};
