# Linear Gauge Card

A modern, feature-rich linear gauge card for Home Assistant Lovelace UI.

## Features

- Modern, clean design
- Configurable min/max values
- Color thresholds
- Optional value display
- Animations
- Works with any numeric entity
- Works fine with negative values
  - When the minimum is negative and the value is negative, the bar should be colour-filled from zero to the left up to the value
  - When the minimum is negative and the value is positive, the bar should be colour-filled from zero to the right up to the value
- Optional feature to show where the zero is, either using a thin vertical line inside the bar, or using a tiny triangle/arrow below the bar

## Look and feel

- Functionality is inspired by custom bar-card (https://github.com/custom-cards/bar-card). However, that one is obsolete and does not follow modern UI concepts.
- Look and feel should be inspired by the Mushroom number card (https://github.com/piitaya/lovelace-mushroom/blob/main/docs/cards/number.md). However, this one does not support plain numeric entities/sensors, only controllable entities/inputs.
- Another similar project is Entity progress card (https://github.com/francois-le-ko4la/lovelace-entity-progress-card) but it's not configurable and does not support negative values.

Look and feel should be close to modern Lovelace cards, like the Tile card in Home assistant and the Mushroom number card.

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to Integrations
3. Click the three dots menu
4. Select "Custom repositories"
5. Add this repository URL
6. Search for "Linear Gauge Card" and install

### Manual

1. Download `dist/linear-gauge-card.js`
2. Place it in `/config/www/linear-gauge-card/`
3. Add resource in Lovelace: `/local/linear-gauge-card/linear-gauge-card.js`

## Configuration

```yaml
type: custom:linear-gauge-card
entity: sensor.temperature
title: Temperature
min: 0
max: 100
unit: C
show_value: true
show_label: true
colors:
  - color: '#2196F3'
    value: 50
  - color: '#FFC107'
    value: 75
  - color: '#F44336'
    value: 100
```

## Development

```bash
npm install
npm run build
npm run watch
```

## Credits

Inspired by bar-card and other custom Home Assistant cards.
