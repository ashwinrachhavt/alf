import { GraphNode, GraphEdge } from "@/components/KnowledgeGraph3D";

/**
 * Extract knowledge graph from markdown research content
 * This analyzes the markdown to find entities, topics, and relationships
 */
export function extractKnowledgeGraph(markdown: string): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  if (!markdown || markdown.trim().length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();

  // Extract headings as main topics
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  let match;
  const topics: string[] = [];

  while ((match = headingRegex.exec(markdown)) !== null) {
    const heading = match[1].trim();
    if (
      heading &&
      !heading.toLowerCase().includes("source") &&
      heading.length < 100
    ) {
      topics.push(heading);

      const id = `topic-${topics.length}`;
      const node: GraphNode = {
        id,
        label: heading,
        type: "topic",
        size: 0.5,
      };
      nodes.push(node);
      nodeMap.set(heading.toLowerCase(), node);
    }
  }

  // Extract URLs as sources
  const urlRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const sources: Set<string> = new Set();
  let sourceCount = 0;

  while ((match = urlRegex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();

    if (url.startsWith("http") && !sources.has(url)) {
      sources.add(url);
      sourceCount++;

      const id = `source-${sourceCount}`;
      const domain = new URL(url).hostname.replace("www.", "");
      const node: GraphNode = {
        id,
        label: domain,
        type: "source",
        size: 0.3,
      };
      nodes.push(node);
      nodeMap.set(url, node);

      // Connect sources to topics (first topic if available)
      if (topics.length > 0) {
        edges.push({
          source: id,
          target: `topic-1`,
          strength: 0.5,
        });
      }
    }
  }

  // Extract key entities using common patterns
  const entityPatterns = [
    // Quoted terms
    /"([^"]+)"/g,
    // Technical terms in backticks
    /`([^`]+)`/g,
    // Bold terms
    /\*\*([^*]+)\*\*/g,
  ];

  const entities: Set<string> = new Set();
  let entityCount = 0;

  entityPatterns.forEach((pattern) => {
    const regex = new RegExp(pattern);
    let entityMatch;

    while ((entityMatch = regex.exec(markdown)) !== null) {
      const entity = entityMatch[1].trim();

      if (
        entity &&
        entity.length > 2 &&
        entity.length < 50 &&
        !entities.has(entity.toLowerCase())
      ) {
        entities.add(entity.toLowerCase());
        entityCount++;

        if (entityCount <= 20) {
          // Limit entities
          const id = `entity-${entityCount}`;
          const node: GraphNode = {
            id,
            label: entity,
            type: "entity",
            size: 0.25,
          };
          nodes.push(node);
          nodeMap.set(entity.toLowerCase(), node);

          // Connect entities to topics
          topics.forEach((topic, idx) => {
            if (
              markdown
                .toLowerCase()
                .includes(topic.toLowerCase() + " " + entity.toLowerCase()) ||
              markdown
                .toLowerCase()
                .includes(entity.toLowerCase() + " " + topic.toLowerCase())
            ) {
              edges.push({
                source: id,
                target: `topic-${idx + 1}`,
                strength: 0.3,
              });
            }
          });
        }
      }
    }
  });

  // Extract key concepts from bullet points
  const bulletRegex = /^[-*]\s+(.+)$/gm;
  const concepts: Set<string> = new Set();
  let conceptCount = 0;

  while ((match = bulletRegex.exec(markdown)) !== null) {
    const bullet = match[1].trim();

    // Extract first few words as concept
    const words = bullet.split(/\s+/).slice(0, 3).join(" ");
    if (
      words &&
      words.length > 5 &&
      words.length < 40 &&
      !concepts.has(words.toLowerCase())
    ) {
      concepts.add(words.toLowerCase());
      conceptCount++;

      if (conceptCount <= 15) {
        // Limit concepts
        const id = `concept-${conceptCount}`;
        const node: GraphNode = {
          id,
          label: words,
          type: "concept",
          size: 0.28,
        };
        nodes.push(node);
        nodeMap.set(words.toLowerCase(), node);

        // Connect concepts to the first topic
        if (topics.length > 0) {
          edges.push({
            source: id,
            target: `topic-1`,
            strength: 0.4,
          });
        }
      }
    }
  }

  // Create connections between topics
  for (let i = 0; i < topics.length - 1; i++) {
    edges.push({
      source: `topic-${i + 1}`,
      target: `topic-${i + 2}`,
      strength: 0.6,
    });
  }

  // If we have very few nodes, add a central query node
  if (nodes.length < 3) {
    const centralNode: GraphNode = {
      id: "central",
      label: "Research Query",
      type: "topic",
      size: 0.6,
      color: "#ffffff",
    };
    nodes.push(centralNode);

    // Connect all existing nodes to central
    nodes.forEach((node) => {
      if (node.id !== "central") {
        edges.push({
          source: node.id,
          target: "central",
          strength: 0.5,
        });
      }
    });
  }

  return { nodes, edges };
}
