import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ThinkBlock from './ThinkBlock';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS

interface MarkdownViewProps {
  content: string;
  className?: string;
}

const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  // Logic to parse <think> tags
  // We handle two cases:
  // 1. <think>...</think> (Completed thought)
  // 2. <think>... (Streaming thought)

  const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
  const match = content.match(thinkRegex);

  let thoughtContent = '';
  let finalContent = content;

  if (match) {
    thoughtContent = match[1];
    // Remove the think block from the content to be displayed as main answer
    finalContent = content.replace(match[0], '').trim();
  }

  const isThinkingComplete = content.includes('</think>');

  return (
    <div className={`markdown-body ${className}`}>
      {thoughtContent && <ThinkBlock content={thoughtContent} isComplete={isThinkingComplete} />}
      {finalContent && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {finalContent}
        </ReactMarkdown>
      )}
    </div>
  );
};

export default MarkdownView;
