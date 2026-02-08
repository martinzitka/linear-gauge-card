import { LitElement, html, css, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LinearGaugeCardConfig, ColorThreshold, HassEntity } from './types';

@customElement('linear-gauge-card')
export class LinearGaugeCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: LinearGaugeCardConfig;
  private _prevValueSign: number | null = null;

  public static getConfigElement(): HTMLElement {
    return document.createElement('linear-gauge-card-editor');
  }

  public static getStubConfig(hass: HomeAssistant): Partial<LinearGaugeCardConfig> {
    const entities = Object.keys(hass.states).filter((eid) => {
      const s = hass.states[eid];
      return !isNaN(Number(s.state)) && s.entity_id.startsWith('sensor.');
    });
    return {
      entity: entities[0] || '',
      min: 0,
      max: 100,
    };
  }

  public setConfig(config: LinearGaugeCardConfig): void {
    if (!config.entity) {
      throw new Error('Entity is required');
    }
    this._config = {
      min: 0,
      max: 100,
      show_value: true,
      show_label: true,
      show_icon: true,
      zero_indicator: 'none',
      sharp_zero_edge: false,
      animated: true,
      layout: 'default',
      ...config,
    };
  }

  public getCardSize(): number {
    return this._config?.layout === 'inline' ? 1 : 2;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_config')) return true;
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    if (!oldHass) return true;
    return oldHass.states[this._config.entity] !== this.hass.states[this._config.entity];
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;

    const entity = this.hass.states[this._config.entity];
    if (!entity) {
      return html`
        <ha-card>
          <div class="card-content">Entity not found: ${this._config.entity}</div>
        </ha-card>
      `;
    }

    const stateValue = entity.state;
    const isUnavailable = stateValue === 'unavailable' || stateValue === 'unknown';
    const numericValue = isUnavailable ? null : Number(stateValue);

    const min = this._config.min ?? 0;
    const max = this._config.max ?? 100;
    const unit = this._config.unit ?? entity.attributes.unit_of_measurement ?? '';
    const name = this._config.title ?? entity.attributes.friendly_name ?? this._config.entity;

    const activeColor = this._getActiveColor(numericValue);
    const crossesZero = min < 0 && max > 0;
    const showZero = this._config.zero_indicator !== 'none' && crossesZero;
    const zeroPercent = crossesZero ? ((0 - min) / (max - min)) * 100 : 0;

    const noTransition = this._config.animated === false ? ' transition: none;' : '';

    let fillHtml;
    if (crossesZero) {
      // Two fill divs anchored at zero so only width animates across sign changes
      const clamped = numericValue !== null ? Math.max(min, Math.min(max, numericValue)) : 0;
      const valuePercent = ((clamped - min) / (max - min)) * 100;
      const positiveWidth = numericValue !== null ? Math.max(0, valuePercent - zeroPercent) : 0;
      const negativeWidth = numericValue !== null ? Math.max(0, zeroPercent - valuePercent) : 0;
      const r = '6px';
      const posRadius = this._config.sharp_zero_edge ? `0 ${r} ${r} 0` : r;
      const negRadius = this._config.sharp_zero_edge ? `${r} 0 0 ${r}` : r;

      // Sequence animation when crossing zero: shrink old side first, then grow new side
      const currentSign = numericValue !== null ? Math.sign(numericValue) : null;
      const crossed =
        this._config.animated !== false &&
        this._prevValueSign !== null &&
        currentSign !== null &&
        this._prevValueSign !== 0 &&
        currentSign !== 0 &&
        this._prevValueSign !== currentSign;
      const posDelay = crossed && currentSign! > 0 ? ' transition-delay: 0.5s;' : '';
      const negDelay = crossed && currentSign! < 0 ? ' transition-delay: 0.5s;' : '';
      this._prevValueSign = currentSign;

      fillHtml = html`
        <div
          class="fill"
          style="left: ${zeroPercent}%; width: ${positiveWidth}%; background-color: ${activeColor}; border-radius: ${posRadius};${posDelay}${noTransition}"
        ></div>
        <div
          class="fill"
          style="right: ${100 - zeroPercent}%; width: ${negativeWidth}%; background-color: ${activeColor}; border-radius: ${negRadius};${negDelay}${noTransition}"
        ></div>
      `;
    } else {
      const barPos = this._computeBarPosition(numericValue, min, max);
      const fillRadius = this._computeFillBorderRadius(min, max, numericValue, 6);
      fillHtml = html`
        <div
          class="fill"
          style="left: ${barPos.left}%; width: ${barPos.width}%; background-color: ${activeColor}; border-radius: ${fillRadius};${noTransition}"
        ></div>
      `;
    }

    const zeroLineHtml =
      showZero && this._config.zero_indicator === 'line'
        ? html`<div class="zero-line" style="left: ${zeroPercent}%;"></div>`
        : nothing;

    if (this._config.layout === 'inline') {
      return html`
        <ha-card @click=${this._handleClick}>
          <div class="card-content inline">
            <div class="inline-container">
              ${this._renderIcon(entity)}
              ${this._renderLabel(name)}
              <div class="gauge">
                <div class="track">
                  ${fillHtml}
                  ${zeroLineHtml}
                </div>
              </div>
              ${this._renderValue(isUnavailable, stateValue, numericValue, unit)}
            </div>
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card @click=${this._handleClick}>
        <div class="card-content">
          <div class="header">
            ${this._renderIcon(entity)}
            ${this._renderLabel(name)}
            ${this._renderValue(isUnavailable, stateValue, numericValue, unit)}
          </div>
          <div class="gauge">
            <div class="track">
              ${fillHtml}
              ${zeroLineHtml}
            </div>
            ${showZero && this._config.zero_indicator === 'arrow'
              ? html`<div class="zero-arrow" style="left: ${zeroPercent}%;"></div>`
              : nothing}
          </div>
        </div>
      </ha-card>
    `;
  }

  private _renderIcon(entity: HassEntity) {
    if (!this._config.show_icon) return nothing;
    return html`<ha-state-icon
      .hass=${this.hass}
      .stateObj=${entity}
      style=${this._config.icon_color ? `color: ${this._config.icon_color}` : ''}
    ></ha-state-icon>`;
  }

  private _renderLabel(name: string) {
    if (!this._config.show_label) return nothing;
    const maxWidth =
      this._config.layout === 'inline' && this._config.label_width
        ? `max-width: ${this._config.label_width}px`
        : '';
    return html`<span class="name" style=${maxWidth}>${name}</span>`;
  }

  private _renderValue(
    isUnavailable: boolean,
    stateValue: string,
    numericValue: number | null,
    unit: string,
  ) {
    if (!this._config.show_value) return nothing;
    const minWidth =
      this._config.layout === 'inline' && this._config.value_width
        ? `min-width: ${this._config.value_width}px`
        : '';
    return html`<span class="value" style=${minWidth}
      >${isUnavailable ? stateValue : numericValue}${unit
        ? html`<span class="unit">${unit}</span>`
        : nothing}</span
    >`;
  }

  private _computeFillBorderRadius(
    min: number,
    max: number,
    value: number | null,
    radius: number,
  ): string {
    const r = `${radius}px`;
    if (!this._config.sharp_zero_edge || min >= 0 || max <= 0 || value === null) {
      return r;
    }
    if (value >= 0) {
      // Bar fills from zero rightward — left (zero) edge sharp
      return `0 ${r} ${r} 0`;
    }
    // Bar fills from value to zero — right (zero) edge sharp
    return `${r} 0 0 ${r}`;
  }

  private _computeBarPosition(
    value: number | null,
    min: number,
    max: number,
  ): { left: number; width: number } {
    if (value === null || max <= min) return { left: 0, width: 0 };

    const clamped = Math.max(min, Math.min(max, value));
    const range = max - min;

    if (min >= 0) {
      // Entirely positive range: fill from left edge
      const width = ((clamped - min) / range) * 100;
      return { left: 0, width };
    }

    // Range includes negative values
    const zeroPos = ((0 - min) / range) * 100;
    const valuePos = ((clamped - min) / range) * 100;

    if (clamped >= 0) {
      // Value is non-negative: fill from zero to value
      return { left: zeroPos, width: valuePos - zeroPos };
    } else {
      // Value is negative: fill from value to zero
      return { left: valuePos, width: zeroPos - valuePos };
    }
  }

  private _getActiveColor(value: number | null): string {
    const colors = this._config.colors;
    if (!colors || colors.length === 0 || value === null) {
      return 'var(--primary-color)';
    }

    const sorted = [...colors].sort((a: ColorThreshold, b: ColorThreshold) => a.value - b.value);

    // Find the highest threshold whose value <= current value
    let activeColor = sorted[0].color; // fallback to lowest threshold
    for (const threshold of sorted) {
      if (value >= threshold.value) {
        activeColor = threshold.color;
      }
    }
    return activeColor;
  }

  private _handleClick(): void {
    if (!this._config.entity) return;
    const event = new CustomEvent('hass-more-info', {
      detail: { entityId: this._config.entity },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  static styles = css`
    ha-card {
      cursor: pointer;
    }
    .card-content {
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .header ha-state-icon {
      flex-shrink: 0;
      color: var(--primary-text-color);
      --mdc-icon-size: 24px;
    }
    .name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .value {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
      white-space: nowrap;
    }
    .unit {
      font-size: 12px;
      font-weight: 400;
      color: var(--secondary-text-color);
      margin-left: 2px;
    }
    .gauge {
      position: relative;
    }
    .track {
      position: relative;
      height: 12px;
      border-radius: 6px;
      background-color: var(--divider-color, rgba(0, 0, 0, 0.12));
      overflow: hidden;
    }
    .fill {
      position: absolute;
      top: 0;
      height: 100%;
      transition: left 0.5s ease, right 0.5s ease, width 0.5s ease, background-color 0.5s ease, border-radius 0.3s ease;
    }
    .zero-line {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      transform: translateX(-1px);
      z-index: 1;
    }
    .zero-arrow {
      position: absolute;
      top: 100%;
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 6px solid var(--secondary-text-color);
      transform: translateX(-5px);
      margin-top: 2px;
    }
    /* Inline layout */
    .card-content.inline {
      padding: 8px 16px;
    }
    .inline-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .inline-container ha-state-icon {
      flex-shrink: 0;
      color: var(--primary-text-color);
      --mdc-icon-size: 24px;
    }
    .inline-container .name {
      flex-shrink: 1;
      min-width: 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .inline-container .gauge {
      flex: 1;
      min-width: 0;
    }
    .inline-container .track {
      height: 10px;
      border-radius: 5px;
    }
    .inline-container .value {
      flex-shrink: 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
      white-space: nowrap;
      text-align: right;
    }
    .inline-container .unit {
      font-size: 12px;
      font-weight: 400;
      color: var(--secondary-text-color);
      margin-left: 2px;
    }
  `;
}
