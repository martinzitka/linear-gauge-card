import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LinearGaugeCardConfig, ColorThreshold } from './types';

const SCHEMA = [
  {
    name: 'entity',
    selector: { entity: { domain: ['sensor', 'input_number', 'number', 'counter'] } },
  },
  { name: 'title', selector: { text: {} } },
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'min', selector: { number: { mode: 'box' } } },
      { name: 'max', selector: { number: { mode: 'box' } } },
    ],
  },
  { name: 'unit', selector: { text: {} } },
  {
    name: 'zero_indicator',
    selector: {
      select: {
        options: [
          { value: 'none', label: 'None' },
          { value: 'line', label: 'Line' },
          { value: 'arrow', label: 'Arrow' },
        ],
      },
    },
  },
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'show_value', selector: { boolean: {} } },
      { name: 'show_label', selector: { boolean: {} } },
    ],
  },
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'show_icon', selector: { boolean: {} } },
      { name: 'sharp_zero_edge', selector: { boolean: {} } },
    ],
  },
  { name: 'animated', selector: { boolean: {} } },
];

const ICON_COLORS = [
  { value: '', label: 'Default' },
  { value: 'var(--primary-color)', label: 'Primary' },
  { value: 'var(--accent-color)', label: 'Accent' },
  { value: 'var(--primary-text-color)', label: 'Primary Text' },
  { value: 'var(--secondary-text-color)', label: 'Secondary Text' },
  { value: 'var(--state-icon-color)', label: 'State Icon' },
  { value: '#f44336', label: 'Red' },
  { value: '#ff9800', label: 'Orange' },
  { value: '#ffc107', label: 'Amber' },
  { value: '#ffeb3b', label: 'Yellow' },
  { value: '#4caf50', label: 'Green' },
  { value: '#2196f3', label: 'Blue' },
  { value: '#9c27b0', label: 'Purple' },
  { value: '#607d8b', label: 'Grey' },
];

@customElement('linear-gauge-card-editor')
export class LinearGaugeCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: LinearGaugeCardConfig;

  public setConfig(config: LinearGaugeCardConfig): void {
    this._config = config;
  }

  protected render() {
    if (!this.hass || !this._config) return nothing;

    const data = {
      show_value: true,
      show_label: true,
      show_icon: true,
      min: 0,
      max: 100,
      zero_indicator: 'none',
      sharp_zero_edge: false,
      animated: true,
      ...this._config,
    };

    return html`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${SCHEMA}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._formChanged}
        ></ha-form>

        <ha-select
          .label=${'Icon Color'}
          .value=${this._config.icon_color || ''}
          @selected=${this._iconColorChanged}
          @closed=${(e: Event) => e.stopPropagation()}
          fixedMenuPosition
        >
          ${ICON_COLORS.map(
            (opt) => html`
              <ha-list-item .value=${opt.value} graphic="icon">
                <span
                  slot="graphic"
                  class="color-circle ${opt.value ? '' : 'color-circle-none'}"
                  style=${opt.value ? `background-color: ${opt.value}` : ''}
                ></span>
                ${opt.label}
              </ha-list-item>
            `,
          )}
        </ha-select>

        <div class="colors-section">
          <div class="section-header">
            <span>Color Thresholds</span>
            <ha-icon-button @click=${this._addColor}>
              <ha-icon icon="mdi:plus"></ha-icon>
            </ha-icon-button>
          </div>
          ${(this._config.colors || []).map(
            (threshold: ColorThreshold, index: number) => html`
              <div class="color-row">
                <input
                  type="color"
                  .value=${threshold.color}
                  @change=${(e: Event) => this._colorChanged(index, (e.target as HTMLInputElement).value)}
                />
                <ha-textfield
                  type="number"
                  .value=${String(threshold.value)}
                  label="Value"
                  @change=${(e: Event) => this._thresholdValueChanged(index, (e.target as HTMLInputElement).value)}
                ></ha-textfield>
                <ha-icon-button @click=${() => this._removeColor(index)}>
                  <ha-icon icon="mdi:delete"></ha-icon>
                </ha-icon-button>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  private _computeLabel(schema: { name: string }): string {
    const labels: Record<string, string> = {
      entity: 'Entity',
      title: 'Title',
      min: 'Minimum',
      max: 'Maximum',
      unit: 'Unit',
      zero_indicator: 'Zero Indicator',
      sharp_zero_edge: 'Sharp Zero Edge',
      animated: 'Animated',
      show_value: 'Show Value',
      show_label: 'Show Label',
      show_icon: 'Show Icon',
    };
    return labels[schema.name] || schema.name;
  }

  private _iconColorChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const value = (ev.target as any).value;
    if (value === (this._config.icon_color || '')) return;
    const config = { ...this._config, icon_color: value || undefined };
    this._config = config;
    this._dispatch(config);
  }

  private _formChanged(ev: CustomEvent): void {
    const config = { ...this._config, ...ev.detail.value };
    this._config = config;
    this._dispatch(config);
  }

  private _addColor(): void {
    const colors = [...(this._config.colors || []), { color: '#4caf50', value: 0 }];
    const config = { ...this._config, colors };
    this._config = config;
    this._dispatch(config);
  }

  private _removeColor(index: number): void {
    const colors = (this._config.colors || []).filter((_: ColorThreshold, i: number) => i !== index);
    const config = { ...this._config, colors };
    this._config = config;
    this._dispatch(config);
  }

  private _colorChanged(index: number, color: string): void {
    const colors = [...(this._config.colors || [])];
    colors[index] = { ...colors[index], color };
    const config = { ...this._config, colors };
    this._config = config;
    this._dispatch(config);
  }

  private _thresholdValueChanged(index: number, value: string): void {
    const colors = [...(this._config.colors || [])];
    colors[index] = { ...colors[index], value: Number(value) };
    const config = { ...this._config, colors };
    this._config = config;
    this._dispatch(config);
  }

  private _dispatch(config: LinearGaugeCardConfig): void {
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .colors-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 500;
      font-size: 14px;
      color: var(--primary-text-color);
    }
    .color-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .color-row input[type='color'] {
      width: 40px;
      height: 40px;
      padding: 2px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      cursor: pointer;
      background: none;
    }
    .color-row ha-textfield {
      flex: 1;
    }
    ha-select {
      width: 100%;
    }
    .color-circle {
      display: block;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid var(--divider-color);
    }
    .color-circle-none {
      background: linear-gradient(
        135deg,
        transparent 40%,
        var(--divider-color) 40%,
        var(--divider-color) 60%,
        transparent 60%
      );
    }
  `;
}
