"use client";

import * as React from "react";
import {
  Scan,
  Eye,
  Activity,
  FileCheck2,
  Layers,
  Database,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HeroSaasTab {
  title: string;
  image: Image;
}
interface Image {
  src: string;
  alt: string;
  srcDark?: string;
}
interface ButtonType {
  text: string;
  url?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}
interface Buttons {
  primary?: ButtonType;
  secondary?: ButtonType;
}

interface HeroSaasProps {
  className?: string;
  heading: string;
  description: string;
  buttons?: Buttons;
  tabs?: HeroSaasTab[];
}

export interface Hero195Props extends HeroSaasProps {}
export type Props = Partial<Hero195Props>;

const defaultProps: Hero195Props = {
  heading: "AI-Powered Retinal Screening & Diagnostic Workstation",
  description:
    "Instant ICDR Diabetic Retinopathy grading, sub-millimeter ETDRS macular staging, and in-silico laser counterfactual explainability designed for point-of-care tele-ophthalmology.",
  buttons: {
    primary: { text: "Start Screening Intake", url: "#upload" },
    secondary: { text: "Explore Clinical Triage", url: "#queue" },
  },
  tabs: [
    {
      title: "Diagnostic Triage",
      image: {
        src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80",
        srcDark: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80",
        alt: "Clinical Retinal Decision Support System",
      },
    },
    {
      title: "ETDRS Macula Grid",
      image: {
        src: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1600&q=80",
        srcDark: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1600&q=80",
        alt: "ETDRS 9-Zone Macular Risk Profiler",
      },
    },
    {
      title: "Grad-CAM Heatmap",
      image: {
        src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80",
        srcDark: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80",
        alt: "Grad-CAM Deep Neural Saliency Overlay",
      },
    },
    {
      title: "Counterfactual Laser",
      image: {
        src: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80",
        srcDark: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80",
        alt: "In-Silico Laser Ablation and Causal Re-Inference",
      },
    },
  ],
};

const TAB_ICONS: readonly LucideIcon[] = [
  Scan,
  Eye,
  Activity,
  FileCheck2,
  Database,
  Layers,
];

export const Hero195 = (props: Props) => {
  const {
    heading,
    description,
    buttons,
    tabs = [],
    className,
  } = {
    ...defaultProps,
    ...props,
  };
  const [activeTab, setActiveTab] = useState(tabs[0]?.title ?? "");
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.title === activeTab),
  );
  const ActiveIcon = TAB_ICONS[activeIndex % TAB_ICONS.length];

  return (
    <section className={cn("overflow-hidden bg-background text-foreground", className)}>
      <div className="container mx-auto px-4">
        <div className="border-x border-border py-12 md:py-16">
          <div className="relative mx-auto max-w-4xl px-4 pt-4 pb-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              RetinaScan AI • Point-of-Care Diagnostic Engine
            </div>

            <h1 className="mx-auto max-w-4xl text-center text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-foreground">
              {heading}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-muted-foreground md:text-base lg:text-lg">
              {description}
            </p>
            <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              {buttons?.primary && (
                buttons.primary.onClick ? (
                  <Button className="w-full sm:w-auto shadow-md" size="lg" onClick={buttons.primary.onClick}>
                    {buttons.primary.text}
                  </Button>
                ) : (
                  <Button className="w-full sm:w-auto shadow-md" size="lg" asChild>
                    <a href={buttons.primary.url}>{buttons.primary.text}</a>
                  </Button>
                )
              )}
              {buttons?.secondary && (
                buttons.secondary.onClick ? (
                  <Button className="w-full sm:w-auto" variant="outline" size="lg" onClick={buttons.secondary.onClick}>
                    {buttons.secondary.text}
                  </Button>
                ) : (
                  <Button className="w-full sm:w-auto" variant="outline" size="lg" asChild>
                    <a href={buttons.secondary.url}>{buttons.secondary.text}</a>
                  </Button>
                )
              )}
            </div>
          </div>
          {tabs.length > 0 && (
            <div className="mt-8 md:mt-12 lg:mt-16">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="hidden md:block">
                  <TabsList className="mx-auto mb-6 flex h-auto w-fit flex-wrap justify-center gap-2 p-1 md:gap-2 lg:gap-3 bg-muted/60 border border-border">
                    {tabs.map((tab, i) => {
                      const Icon = TAB_ICONS[i % TAB_ICONS.length];
                      return (
                        <TabsTrigger
                          key={tab.title}
                          value={tab.title}
                          className="gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background lg:gap-2.5 lg:px-4 lg:py-2 lg:text-sm cursor-pointer"
                        >
                          <Icon className="size-4" aria-hidden />
                          {tab.title}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
                <div className="relative isolate max-w-5xl mx-auto">
                  <div className="relative z-10 rounded-xl overflow-hidden border border-border shadow-2xl bg-card">
                    {tabs.map((tab) => (
                      <TabsContent
                        key={tab.title}
                        value={tab.title}
                        className={cn(
                          "m-0 relative bg-background transition-opacity duration-300",
                          {
                            "block opacity-100": activeTab === tab.title,
                            "hidden opacity-0": activeTab !== tab.title,
                          },
                        )}
                      >
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900/10">
                          <img
                            src={tab.image.src}
                            alt={tab.image.alt}
                            className="w-full h-full object-cover object-center"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                            <span className="text-white text-sm md:text-base font-semibold drop-shadow-sm">
                              {tab.image.alt}
                            </span>
                          </div>
                        </div>
                        <BorderBeam duration={10} size={150} />
                      </TabsContent>
                    ))}
                  </div>

                  {/* Decorative background framing lines */}
                  <span className="absolute -inset-x-12 top-0 -z-10 h-px bg-border/70 [mask-image:linear-gradient(to_right,transparent_1%,black_10%,black_90%,transparent_99%)]"></span>
                  <span className="absolute -inset-x-12 bottom-0 -z-10 h-px bg-border/70 [mask-image:linear-gradient(to_right,transparent_1%,black_10%,black_90%,transparent_99%)]"></span>
                  <span className="absolute -inset-x-12 top-10 h-px border-t border-dashed border-border/50 [mask-image:linear-gradient(to_right,transparent_1%,black_10%,black_90%,transparent_99%)]"></span>
                  <span className="absolute -inset-x-12 bottom-10 h-px border-t border-dashed border-border/50 [mask-image:linear-gradient(to_right,transparent_1%,black_10%,black_90%,transparent_99%)]"></span>
                  <span className="absolute -inset-y-12 left-8 w-px border-r border-dashed border-border/50 [mask-image:linear-gradient(to_bottom,transparent_1%,black_10%,black_90%,transparent_99%)]"></span>
                  <span className="absolute -inset-y-12 right-8 w-px border-r border-dashed border-border/50 [mask-image:linear-gradient(to_bottom,transparent_1%,black_10%,black_90%,transparent_99%)]"></span>
                </div>
                <nav
                  className="mt-6 flex flex-col items-center gap-4 md:hidden"
                  aria-label="Feature slides"
                >
                  <div className="flex items-center gap-2" role="tablist">
                    {tabs.map((tab) => (
                      <button
                        key={tab.title}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.title}
                        aria-label={tab.title}
                        onClick={() => setActiveTab(tab.title)}
                        className={cn(
                          "h-2 rounded-full transition-all cursor-pointer",
                          activeTab === tab.title
                            ? "w-8 bg-primary"
                            : "w-2 bg-muted-foreground/40",
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
                    <ActiveIcon
                      key={activeTab}
                      className="size-5 text-foreground"
                      aria-hidden
                    />
                  </div>
                </nav>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero195;
