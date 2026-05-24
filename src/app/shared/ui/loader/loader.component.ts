import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

export type LoaderVariant = 'pulse' | 'cut' | 'spin' | 'draw' | 'glow' | 'snip';
export type LoaderTheme = 'light' | 'dark';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="vexion-loader"
      [ngClass]="['vexion-loader--' + variant, 'vexion-loader--' + theme]"
      [style.width.px]="size"
      [style.height.px]="size"
      role="status"
      [attr.aria-label]="ariaLabel"
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="translate(100, 100)" class="vexion-loader__group">
          <line
            class="vexion-loader__blade vexion-loader__blade--left"
            x1="-50"
            y1="-50"
            x2="8"
            y2="36"
            stroke-width="10"
            stroke-linecap="round"
          />
          <line
            class="vexion-loader__blade vexion-loader__blade--right"
            x1="50"
            y1="-50"
            x2="-8"
            y2="36"
            stroke-width="10"
            stroke-linecap="round"
          />
          <circle class="vexion-loader__dot" cx="0" cy="-8" r="10" />
        </g>
      </svg>
      @if (label) {
        <span class="vexion-loader__label">{{ label }}</span>
      }
      <span class="vexion-loader__sr-only">{{ ariaLabel }}</span>
    </div>
  `,
  styles: [
    `
      .vexion-loader {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }
      .vexion-loader svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .vexion-loader__label {
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.3px;
      }
      .vexion-loader__sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Light */
      .vexion-loader--light .vexion-loader__blade--left {
        stroke: var(--accent, #5a453a);
      }
      .vexion-loader--light .vexion-loader__blade--right {
        stroke: var(--primary, #d9a05a);
      }
      .vexion-loader--light .vexion-loader__dot {
        fill: var(--text-primary, #14110e);
      }
      .vexion-loader--light .vexion-loader__label {
        color: var(--text-muted, #6b5d44);
      }

      /* Dark */
      .vexion-loader--dark .vexion-loader__blade--left {
        stroke: var(--accent, #8a7a5e);
      }
      .vexion-loader--dark .vexion-loader__blade--right {
        stroke: var(--primary, #e8b870);
      }
      .vexion-loader--dark .vexion-loader__dot {
        fill: var(--text-primary, #f5f0e8);
      }
      .vexion-loader--dark .vexion-loader__label {
        color: var(--text-muted, #c8b8a0);
      }

      /* Variant: pulse */
      .vexion-loader--pulse .vexion-loader__group {
        animation: vexion-pulse 1.4s ease-in-out infinite;
        transform-origin: center;
      }
      @keyframes vexion-pulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(0.85);
          opacity: 0.6;
        }
      }

      /* Variant: cut */
      .vexion-loader--cut .vexion-loader__blade--left {
        transform-origin: 0 -8px;
        animation: vexion-cut-left 1.2s ease-in-out infinite;
      }
      .vexion-loader--cut .vexion-loader__blade--right {
        transform-origin: 0 -8px;
        animation: vexion-cut-right 1.2s ease-in-out infinite;
      }
      @keyframes vexion-cut-left {
        0%,
        100% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(-25deg);
        }
      }
      @keyframes vexion-cut-right {
        0%,
        100% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(25deg);
        }
      }

      /* Variant: spin */
      .vexion-loader--spin svg {
        animation: vexion-spin 2s linear infinite;
      }
      @keyframes vexion-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Variant: draw */
      .vexion-loader--draw .vexion-loader__blade {
        stroke-dasharray: 110;
        animation: vexion-draw 1.8s ease-in-out infinite;
      }
      .vexion-loader--draw .vexion-loader__blade--right {
        animation-delay: 0.2s;
      }
      .vexion-loader--draw .vexion-loader__dot {
        animation: vexion-dot-appear 1.8s ease-in-out infinite;
      }
      @keyframes vexion-draw {
        0% {
          stroke-dashoffset: 110;
        }
        50%,
        70% {
          stroke-dashoffset: 0;
        }
        100% {
          stroke-dashoffset: -110;
        }
      }
      @keyframes vexion-dot-appear {
        0%,
        40% {
          opacity: 0;
          transform: scale(0);
        }
        55%,
        75% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(0);
        }
      }

      /* Variant: glow */
      .vexion-loader--glow .vexion-loader__blade {
        animation: vexion-glow 1.6s ease-in-out infinite;
      }
      .vexion-loader--glow .vexion-loader__dot {
        animation: vexion-dot-bounce 1.6s ease-in-out infinite;
        transform-origin: 0 -8px;
      }
      @keyframes vexion-glow {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      @keyframes vexion-dot-bounce {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.4);
        }
      }

      /* Variant: snip */
      .vexion-loader--snip .vexion-loader__blade--left {
        transform-origin: 0 -8px;
        animation: vexion-snip-left 1s ease-in-out infinite;
      }
      .vexion-loader--snip .vexion-loader__blade--right {
        transform-origin: 0 -8px;
        animation: vexion-snip-right 1s ease-in-out infinite;
      }
      @keyframes vexion-snip-left {
        0%,
        100% {
          transform: rotate(0deg);
        }
        25%,
        75% {
          transform: rotate(-15deg);
        }
        50% {
          transform: rotate(0deg);
        }
      }
      @keyframes vexion-snip-right {
        0%,
        100% {
          transform: rotate(0deg);
        }
        25%,
        75% {
          transform: rotate(15deg);
        }
        50% {
          transform: rotate(0deg);
        }
      }

      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        .vexion-loader *,
        .vexion-loader svg {
          animation-duration: 3s !important;
          animation-iteration-count: infinite !important;
        }
        .vexion-loader--spin svg,
        .vexion-loader--snip .vexion-loader__blade,
        .vexion-loader--cut .vexion-loader__blade {
          animation: vexion-pulse 3s ease-in-out infinite !important;
        }
      }
    `,
  ],
})
export class LoaderComponent {
  @Input() variant: LoaderVariant = 'cut';
  @Input() theme: LoaderTheme = 'light';
  @Input() size: number = 64;
  @Input() label?: string;
  @Input() ariaLabel: string = 'Carregando';
}
