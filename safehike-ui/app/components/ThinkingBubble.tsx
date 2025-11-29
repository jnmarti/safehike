
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import Markdown from 'react-markdown'

const ThinkingBubble = ({content}: {content: string}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determine if content needs truncation (e.g., more than 150 characters)
  const needsTruncation = content.length > 150;
  const displayContent = !isExpanded && needsTruncation 
    ? <Markdown>{content.slice(0, 150) + '...'}</Markdown>
    : <Markdown>{content}</Markdown>;

  return (
    <div className="flex items-start gap-3 max-w-2xl py-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Brain className="w-4 h-4 text-purple-600" />
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-purple-700">Thinking</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {displayContent}
          </div>
          
          {needsTruncation && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>Show more</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThinkingBubble;