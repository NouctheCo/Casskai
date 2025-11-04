import { DashboardWidget } from '@/types/dashboard-widget.types';

type WidgetSize = DashboardWidget['size'];

export const DASHBOARD_GRID_COLUMNS = 12;

interface SizePreset {
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
}

const SIZE_PRESETS: Record<WidgetSize, SizePreset> = {
  small: { defaultW: 4, defaultH: 3, minW: 2, minH: 2 },
  medium: { defaultW: 6, defaultH: 4, minW: 4, minH: 3 },
  large: { defaultW: 8, defaultH: 6, minW: 5, minH: 4 },
};

export function getSizePreset(size: WidgetSize): SizePreset {
  return SIZE_PRESETS[size] ?? SIZE_PRESETS.medium;
}

export function inferSizeFromWidth(width: number): WidgetSize {
  if (width >= 8) {
    return 'large';
  }
  if (width >= 5) {
    return 'medium';
  }
  return 'small';
}

export function calculateNextPosition(widgets: DashboardWidget[], size: WidgetSize) {
  const { defaultW: w, defaultH: h } = getSizePreset(size);

  if (!widgets.length) {
    return { x: 0, y: 0, w, h };
  }

  const sorted = [...widgets].sort((a, b) => {
    if (a.position.y === b.position.y) {
      return a.position.x - b.position.x;
    }
    return a.position.y - b.position.y;
  });

  const lastRowY = sorted[sorted.length - 1].position.y;
  const widgetsInLastRow = sorted.filter(widget => widget.position.y === lastRowY);
  const orderedRow = widgetsInLastRow.sort((a, b) => a.position.x - b.position.x);

  let cursorX = 0;
  for (const widget of orderedRow) {
    if (widget.position.x - cursorX >= w) {
      return { x: cursorX, y: lastRowY, w, h };
    }
    cursorX = widget.position.x + widget.position.w;
  }

  if (DASHBOARD_GRID_COLUMNS - cursorX >= w) {
    return { x: cursorX, y: lastRowY, w, h };
  }

  const maxBottom = sorted.reduce((acc, widget) => {
    const bottom = widget.position.y + widget.position.h;
    return bottom > acc ? bottom : acc;
  }, 0);

  return { x: 0, y: maxBottom, w, h };
}

export function createLayoutItem(widget: DashboardWidget) {
  const preset = getSizePreset(widget.size);

  return {
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: Math.min(widget.position.w, preset.minW),
    minH: Math.min(widget.position.h, preset.minH),
  };
}
