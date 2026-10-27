import { Hero195 } from "@/components/ui/hero-195";

interface DemoOneProps {
  onStartIntake?: () => void;
  onExploreQueue?: () => void;
}

const DemoOne = ({ onStartIntake, onExploreQueue }: DemoOneProps = {}) => {
  return (
    <Hero195
      buttons={{
        primary: {
          text: "Start Screening Intake",
          onClick: onStartIntake,
          url: "#upload",
        },
        secondary: {
          text: "Explore Clinical Triage",
          onClick: onExploreQueue,
          url: "#queue",
        },
      }}
    />
  );
};

export { DemoOne };
export default DemoOne;
