import { useState } from "react";
import { useRouter } from "expo-router";
import OnboardingSlide from "@/components/OnboardingSlide";

export default function Index() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const slides = [
    { image: require("../assets/images/im1.png"), text: "Bienvenue sur notre app !", buttonLabel: "Next" },
    { image: require("../assets/images/im2.png"), text: "Apprends facilement avec nous.", buttonLabel: "Next" },
    { image: require("../assets/images/im3.png"), text: "Prêt à commencer ?", buttonLabel: "Commencer" },
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      router.push("/auth/login");
    }
  };

  const handleSkip = () => {
    router.push("/auth/login");
  };

  const handleSelectStep = (selectedStep: number) => {
    setStep(selectedStep); 
  };

  return (
    <OnboardingSlide
      image={slides[step].image}
      text={slides[step].text}
      buttonLabel={slides[step].buttonLabel}
      onNext={handleNext}
      onSkip={handleSkip}
      totalSteps={slides.length}
      currentStep={step}
      onSelectStep={handleSelectStep} 
    />
  );
}
