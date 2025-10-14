"use client";

import { useMemo } from 'react';
import DocumentExplorer, { type ExplorerDocument } from './DocumentExplorer';

export default function DocumentGrid3D() {
  // Generate sample clustered documents
  const documents = useMemo(() => {
    const docs: ExplorerDocument[] = [];
    const numClusters = 5;
    const docsPerCluster = 6;

    const topics = [
      'Research', 'Machine Learning', 'Web Development',
      'Data Science', 'Design', 'Product Strategy',
      'Engineering', 'Marketing', 'Finance'
    ];

    for (let cluster = 0; cluster < numClusters; cluster++) {
      for (let i = 0; i < docsPerCluster; i++) {
        docs.push({
          id: `doc-${cluster}-${i}`,
          title: `${topics[cluster % topics.length]} ${i + 1}`,
          preview: `This is a research document about ${topics[cluster % topics.length].toLowerCase()}. It contains important insights and findings...`,
          cluster,
          category: topics[cluster % topics.length],
        });
      }
    }

    return docs;
  }, []);

  return <DocumentExplorer documents={documents} height="600px" />;
}
