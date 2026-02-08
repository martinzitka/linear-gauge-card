export interface ColorThreshold {
  color: string;
  value: number;
}

export type ZeroIndicator = 'none' | 'line' | 'arrow';

export interface LinearGaugeCardConfig {
  type: string;
  entity: string;
  min?: number;
  max?: number;
  title?: string;
  unit?: string;
  colors?: ColorThreshold[];
  show_value?: boolean;
  show_label?: boolean;
  show_icon?: boolean;
  zero_indicator?: ZeroIndicator;
  sharp_zero_edge?: boolean;
  animated?: boolean;
  icon_color?: string;
}

// Home Assistant types not available via npm
export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService: (domain: string, service: string, data?: Record<string, any>) => Promise<void>;
  localize: (key: string, ...args: any[]) => string;
  language: string;
  themes: any;
  selectedTheme: any;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    icon?: string;
    unit_of_measurement?: string;
    [key: string]: any;
  };
  last_changed: string;
  last_updated: string;
}

export interface LovelaceCard extends HTMLElement {
  hass: HomeAssistant;
  setConfig(config: any): void;
  getCardSize(): number;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass: HomeAssistant;
  lovelace?: any;
  setConfig(config: any): void;
}
