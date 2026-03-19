import "./style.scss";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  markdownContent: string;
}

export const MarkdownModal = ({
  isOpen,
  onClose,
  title = "Documentation",
  markdownContent,
}: MarkdownModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="md_modal_overlay" onClick={onClose}>
      <div className="md_modal" onClick={(e) => e.stopPropagation()}>
        <div className="md_modal_header">
          <h2>{title}</h2>
          <button className="md_modal_close" onClick={onClose}>
            <i className="fi fi-rr-cross" />
          </button>
        </div>
        <div className="md_modal_content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
