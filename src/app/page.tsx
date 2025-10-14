import Link from "next/link";

import {
  NotionTemplate,
  NotionTemplateCard,
  NotionTemplateDivider,
  NotionTemplateFootnote,
  NotionTemplateGrid,
  NotionTemplateHeader,
  NotionTemplateList,
  NotionTemplatePill,
  NotionTemplateSection,
  NotionTemplateToolbar,
} from "@/components/notion";
import { Button } from "@/components/ui/button";

const principles = [
  {
    title: "Neutral Layers",
    description:
      "Stack warm greys with controlled contrast. Rely on shadows, borders, and texture instead of saturated color.",
    icon: "◑",
  },
  {
    title: "Rhythmic Spacing",
    description:
      "Base spacing on 4px increments. Keep blocks airy and align to a 12-column grid for instant balance.",
    icon: "⌘",
  },
  {
    title: "Purposeful Motion",
    description:
      "Ease content in with small y-axes shifts and restrained durations so interactions stay calm.",
    icon: "≋",
  },
];

const buildingBlocks = [
  {
    title: "Surface Shell",
    description:
      "Glassmorphic frame with radial ambience for the hero or top-level summary views.",
    eyebrow: "Layout",
    icon: "☰",
    actions: "Wrap primary flows to get instant Notion vibes.",
  },
  {
    title: "Split Section",
    description:
      "Two-column detail block with sticky guidance on the left and flexible content on the right.",
    eyebrow: "Structure",
    icon: "☷",
    actions: "Great for feature rundowns or knowledge hubs.",
  },
  {
    title: "Minimal Card",
    description:
      "Bordered storytelling block with eyebrow, icon slot, and optional metadata.",
    eyebrow: "Component",
    icon: "□",
    actions: "Use for resources, highlights, or callouts.",
  },
];

const motionRecipes = [
  {
    title: "Surface Entrance",
    description:
      "Fade from 0 to 1 with a 20px rise over 450ms. The ambient grid lines reinforce depth without noise.",
    meta: "load",
  },
  {
    title: "Section Reveal",
    description:
      "Trigger whileInView with a -64px margin to let blocks glide into place just before they appear.",
    meta: "scroll",
  },
  {
    title: "Hover Lift",
    description:
      "Raise cards by 6px with a 300ms ease to communicate affordance while keeping the silhouette tight.",
    meta: "hover",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <NotionTemplate>
        <NotionTemplateHeader
          kicker="Design System"
          title="Monochrome Notion Starter"
          description="A black and white template kit that fuses framer-motion patterns with shadcn primitives for Notion-style knowledge work."
          meta={<span>Version 0.3 · Updated April 2025</span>}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/research">Start research</Link>
              </Button>
              <Button variant="ghost" className="border border-neutral-200/60 text-neutral-700 dark:border-neutral-800 dark:text-neutral-100">
                Duplicate template
              </Button>
            </>
          }
        />

        <NotionTemplateToolbar>
          <NotionTemplatePill>Monochrome</NotionTemplatePill>
          <NotionTemplatePill>Framer Motion</NotionTemplatePill>
          <NotionTemplatePill>Shadcn Ready</NotionTemplatePill>
        </NotionTemplateToolbar>

        <NotionTemplateSection
          kicker="Principles"
          title="Foundation Rules"
          description="Carry these through every block to preserve the quiet, methodical Notion aesthetic."
        >
          <NotionTemplateGrid columns={3}>
            {principles.map((principle) => (
              <NotionTemplateCard
                key={principle.title}
                title={principle.title}
                description={principle.description}
                icon={<span className="text-lg">{principle.icon}</span>}
              />
            ))}
          </NotionTemplateGrid>
        </NotionTemplateSection>

        <NotionTemplateDivider label="Reusable Blocks" />

        <NotionTemplateSection
          title="Composable Surfaces"
          description="Drop these shell patterns into any page, then swap in shadcn/ui primitives for inputs, tables, or toggles."
          aside={
            <p>
              Keep typography at 14–16px with <span className="font-medium text-neutral-900 dark:text-neutral-100">1.5rem</span> line height to mirror Notion's calm cadence.
            </p>
          }
        >
          <NotionTemplateGrid columns={3}>
            {buildingBlocks.map((block) => (
              <NotionTemplateCard
                key={block.title}
                title={block.title}
                description={block.description}
                eyebrow={block.eyebrow}
                icon={<span className="text-lg">{block.icon}</span>}
                actions={block.actions}
              />
            ))}
          </NotionTemplateGrid>
        </NotionTemplateSection>

        <NotionTemplateSection
          kicker="Motion"
          title="Framer Motion Recipes"
          description="These interactions are wired directly into each primitive so defaults feel cohesive."
          layout="single"
        >
          <NotionTemplateList items={motionRecipes} />
        </NotionTemplateSection>

        <NotionTemplateFootnote>
          <p>
            Tip: Pair these shells with <span className="font-medium text-neutral-900 dark:text-neutral-100">shadcn/ui</span> buttons, tables, and dialogs to stay consistent while scaling.
          </p>
        </NotionTemplateFootnote>
      </NotionTemplate>
    </main>
  );
}
