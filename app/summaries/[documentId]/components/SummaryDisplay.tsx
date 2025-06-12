// Component to display structured overview
const DisplayOverview = ({ content }: { content: string }) => {
  // Split the content into paragraphs, removing empty ones
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <div className="overview-container">
      {paragraphs.map((paragraph, index) => {
        // Dynamically apply styles based on paragraph position
        const isFirst = index === 0;
        const isLast = index === paragraphs.length - 1;

        return (
          <p
            key={index}
            className={`overview-paragraph ${isFirst ? 'overview-introduction' : ''} ${isLast ? 'overview-conclusion' : ''}`}
          >
            {paragraph}
          </p>
        );
      })}
    </div>
  );
};

// Component to display structured key points
const DisplayKeyPoints = ({ content }: { content: string }) => {
  // Split the content into key points
  const points = content.split('\n').filter(p => p.trim());

  return (
    <div className="key-points-container">
      <ul className="key-points-list">
        {points.map((point, index) => {
          const importanceMatch = point.match(/\((high|medium|low)\)$/i);
          const importance = importanceMatch ? importanceMatch[1].toLowerCase() : '';
          const pointText = importance ? point.replace(/\s*\((high|medium|low)\)$/i, '') : point;

          return (
            <li
              key={index}
              className={`key-point ${importance ? `importance-${importance}` : ''}`}
            >
              {pointText.replace(/^- /, '')}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// Component to display chapter summaries
const DisplayChapterSummary = ({ content, title }: { content: string, title: string }) => {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <div className="chapter-summary-container">
      <h3 className="chapter-title">{title}</h3>
      <div className="chapter-content">
        {paragraphs.map((paragraph, index) => {
          const isFirst = index === 0;
          const isLast = index === paragraphs.length - 1;

          return (
            <p
              key={index}
              className={`chapter-paragraph ${isFirst ? 'chapter-overview' : ''} ${isLast ? 'chapter-significance' : ''}`}
            >
              {paragraph}
            </p>
          );
        })}
      </div>
    </div>
  );
};
