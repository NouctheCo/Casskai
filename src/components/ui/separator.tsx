import React from 'react';

export const Separator: React.FC<{ className?: string; orientation?: 'horizontal' | 'vertical'; strokeWidth?: number }> = ({ className = '', orientation = 'horizontal' }) => (
	<hr
		className={`${orientation === 'vertical' ? 'mx-2 h-full border-l border-t-0' : 'my-4 border-t'} border-gray-200 dark:border-gray-700 ${className}`.trim()}
		aria-orientation={orientation}
	/>
);
