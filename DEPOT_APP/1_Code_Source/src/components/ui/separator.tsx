import React from 'react';

export const Separator: React.FC<{ className?: string }> = ({ className = '' }) => (
	<hr
		className={`my-4 border-t border-gray-200 dark:border-gray-700 ${className}`.trim()}
		aria-orientation="horizontal"
	/>
);
