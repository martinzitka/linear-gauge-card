import './card';
import './editor';

const VERSION = '0.1.0';

console.info(
  `%c LINEAR-GAUGE-CARD %c v${VERSION} `,
  'color: white; background: #3498db; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
  'color: #3498db; background: #e8e8e8; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;',
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'linear-gauge-card',
  name: 'Linear Gauge Card',
  description: 'A modern linear gauge card for displaying numeric sensor values',
});
