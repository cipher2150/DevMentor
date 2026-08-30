/**
 * Service to build visual Knowledge Map graph data (nodes & edges)
 */

export function buildKnowledgeMapGraph(repoName, tree, parseResults) {
  const nodes = [
    { id: 'root', label: repoName || 'Repository', category: 'root', x: 400, y: 50 },
    { id: 'src', label: 'Source Modules', category: 'layer', x: 250, y: 160 },
    { id: 'config', label: 'Configuration & Deps', category: 'layer', x: 550, y: 160 }
  ];

  const edges = [
    { from: 'root', to: 'src' },
    { from: 'root', to: 'config' }
  ];

  const concepts = parseResults.coreConcepts || [];
  concepts.forEach((concept, index) => {
    const conceptNodeId = `concept_${concept.id}`;
    const xPos = 180 + index * 140;
    nodes.push({
      id: conceptNodeId,
      label: concept.title,
      category: 'concept',
      x: xPos,
      y: 280,
      conceptId: concept.id
    });
    edges.push({ from: 'src', to: conceptNodeId });
  });

  return { nodes, edges };
}
