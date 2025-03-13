import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  // Simple markdown parsing for basic elements
  const parseMarkdown = (markdown: string) => {
    // Replace headings
    let html = markdown
      .replace(
        /^### (.+)$/gm,
        '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>',
      )
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(
        /^# (.+)$/gm,
        '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>',
      );

    // Replace lists
    html = html.replace(
      /^\d+\. (.+)$/gm,
      '<li class="ml-6 list-decimal">$1</li>',
    );
    html = html.replace(/^- (.+)$/gm, '<li class="ml-6 list-disc">$1</li>');

    // Replace bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Replace links
    html = html.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-blue-600 hover:underline">$1</a>',
    );

    // Replace horizontal rules
    html = html.replace(
      /^---$/gm,
      '<hr class="my-4 border-t border-gray-200" />',
    );

    // Replace paragraphs (must be done last)
    html = html.replace(/^(?!<[a-z]).+$/gm, '<p class="my-2">$&</p>');

    // Fix consecutive list items
    html = html.replace(/<\/li>\s*<li/g, "</li><li");

    // Wrap lists in ul/ol tags
    html = html.replace(
      /(<li class="ml-6 list-disc">.*?<\/li>)/gs,
      '<ul class="my-3">$1</ul>',
    );
    html = html.replace(
      /(<li class="ml-6 list-decimal">.*?<\/li>)/gs,
      '<ol class="my-3">$1</ol>',
    );

    // Fix nested lists
    html = html.replace(/<\/ul>\s*<ul/g, "");
    html = html.replace(/<\/ol>\s*<ol/g, "");

    return html;
  };

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
