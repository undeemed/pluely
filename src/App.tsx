import { Card, Settings, Completion } from "./components";

const App = () => {
  return (
    <div className="w-screen h-screen flex overflow-hidden justify-center items-start">
      <Card className="w-full flex flex-row items-center gap-2 p-2">
        <Completion />
        <Settings />
      </Card>
    </div>
  );
};

export default App;
