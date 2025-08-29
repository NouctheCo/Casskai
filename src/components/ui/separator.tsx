import React from 'react';

export const Separator: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style = {} }) => (
	<hr
		className={`my-4 border-t border-gray-200 dark:border-gray-700 ${className}`.trim()}
		style={style}
		aria-orientation="horizontal"
	/>
);
