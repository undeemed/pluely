import { GithubIcon } from "lucide-react";

export const Disclaimer = () => {
  return (
    <div className="flex items-center justify-between py-3 px-4">
      <p className="text-xs text-muted-foreground text-center font-medium">
        💳 Your wallet, your choice! 🤝 All API costs are on you
      </p>
      <div className="flex items-center gap-2">
        <a
          href="https://github.com/iamsrikanthnani/pluely"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground text-center font-medium"
        >
          <GithubIcon className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};
