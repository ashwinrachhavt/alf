import Link from "next/link";

import {
  NotionTemplate,
  NotionTemplateCard,
  NotionTemplateDivider,
  NotionTemplateGrid,
  NotionTemplateHeader,
  NotionTemplateList,
  NotionTemplatePill,
  NotionTemplateSection,
} from "@/components/notion";
import { Button } from "@/components/ui/button";

const foundations = [
  {
    title: "Black & White First",
    description:
      "Keep the palette reduced to layered neutrals. Use opacity and texture rather than saturated color to build hierarchy.",
    icon: "◐",
  },
  {
    title: "Structured Breathing Room",
    description:
      "Balance dense text blocks with deliberate negative space. Anchor every section to a grid and keep typography restrained.",
    icon: "⌘",
  },
  {
    title: "Micro-Interactions",
    description:
      "Use subtle motion to reinforce focus states. Ease-in-out, short distances, and shadow shifts mirror Notion's calm feel.",
    icon: "≋",
  },
];

const components = [
  {
    title: "Hero Shell",
    description:
      "A translucent frame with radial light, perfect for top-level narratives or collection overviews.",
    eyebrow: "Layout",
    icon: "☰",
  },
  {
    title: "Section Split",
    description:
      "Two-column arrangement that keeps copy on the left and dynamic content on the right for scannable flow.",
    eyebrow: "Structure",
    icon: "☷",
  },
  {
    title: "Minimal Card",
    description:
      "Bordered block with icon slot, eyebrow text, and fluid body copy for features, resources, or callouts.",
    eyebrow: "Component",
    icon: "□",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 py-12">
      <NotionTemplate>
        <div className="space-y-12">
          <NotionTemplateHeader
            kicker="Design System"
            title="Notion-Inspired Minimal Template"
            description="A black and white component kit with motion primitives you can drop into Notion-style knowledge bases, dashboards, or documentation."
            meta={<span>Version 0.2 · Updated April 2025</span>}
            actions={
              <>
                <Button asChild variant="outline">
                  <Link href="/research">Start research</Link>
                </Button>
                <Button variant="ghost" className="border border-neutral-200/60 text-neutral-700 dark:border-neutral-800 dark:text-neutral-200">
                  Duplicate template
                </Button>
              </>
            }
          />

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
            <NotionTemplatePill>Monochrome</NotionTemplatePill>
            <NotionTemplatePill>Shadcn Ready</NotionTemplatePill>
            <NotionTemplatePill>Motion Enabled</NotionTemplatePill>
          </div>

          <NotionTemplateSection
            kicker="Principles"
            title="Foundations"
            description="The base rules that keep every surface calm, legible, and endlessly remixable."
          >
            <NotionTemplateGrid columns={3}>
              {foundations.map((foundation) => (
                <NotionTemplateCard
                  key={foundation.title}
                  title={foundation.title}
                  description={foundation.description}
                  icon={<span className="text-lg">{foundation.icon}</span>}
                />
              ))}
            </NotionTemplateGrid>
          </NotionTemplateSection>

          <NotionTemplateDivider label="Components" />

          <NotionTemplateSection
            title="Reusable Blocks"
            description="Mix and match layout shells with shadcn/ui primitives. Everything inherits the same typographic rhythm and spacing."
            aside={
              <p>
                Need more? Wireframe a block in Notion, then translate it with <span className="font-medium text-neutral-900 dark:text-neutral-100">NotionTemplate*</span> primitives for instant parity.
              </p>
            }
          >
            <NotionTemplateGrid columns={3}>
              {components.map((component) => (
                <NotionTemplateCard
                  key={component.title}
                  title={component.title}
                  description={component.description}
                  eyebrow={component.eyebrow}
                  icon={<span className="text-lg">{component.icon}</span>}
                  actions={<span>Use with Card, Grid, or Sheet layouts.</span>}
                />
              ))}
            </NotionTemplateGrid>
          </NotionTemplateSection>

          <NotionTemplateSection
            kicker="Guidance"
            title="Framer Motion Patterns"
            description="Keep animations purposeful. These defaults are bundled with every template component so you can stay consistent."
            aside={
              <div className="space-y-2">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">Timings</p>
                <p>0.45s ease (0.16, 1, 0.3, 1) for entrances. Micro-lifts hover at 0.3s with the same curve.</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">Depth</p>
                <p>Limit movement to 4–12px. Shadows shift subtly instead of scaling.</p>
              </div>
            }
          >
            <NotionTemplateList
              items={[
                {
                  title: "Template Shell",
                  description: "Fade and rise on load for a calm welcome. The radial wash mimics Notion's ambient gradients.",
                  meta: "useEffect",
                },
                {
                  title: "Section Reveal",
                  description: "Sections animate into view with a slight delay as you scroll, guiding attention without distraction.",
                  meta: "whileInView",
                },
                {
                  title: "Card Hover",
                  description: "Cards lift by 4px and tighten their borders to signal interactivity while staying minimal.",
                  meta: "whileHover",
                },
              ]}
            />
          </NotionTemplateSection>
        </div>
      </NotionTemplate>
    </div>
  );
}
