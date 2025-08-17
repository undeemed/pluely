import { MicIcon, PaperclipIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Settings } from "./components/settings";

const App = () => {
  return (
    <div className="w-screen h-screen flex overflow-hidden justify-center items-start bg-white/10 backdrop-blur-lg rounded-lg shadow-lg">
      <Card className="w-full flex flex-row items-center gap-2 p-4">
        <Button size="icon">
          <MicIcon />
        </Button>
        <Input placeholder="Enter your prompt" />
        <Button size="icon">
          <PaperclipIcon />
        </Button>
        <Settings />
      </Card>
    </div>
  );
};

export default App;
