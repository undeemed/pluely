import { Card } from "./components/ui/card";

const App = () => {
  return (
    <div className="w-screen h-screen flex overflow-hidden justify-center items-start bg-white/10 backdrop-blur-lg rounded-lg shadow-lg">
      <Card className="w-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Hello World</h1>
      </Card>
    </div>
  );
};

export default App;
