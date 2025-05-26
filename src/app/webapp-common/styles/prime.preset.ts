import {definePreset} from '@primeng/themes';
import {SliderDesignTokens} from '@primeng/themes/types/slider';
import {DataTableDesignTokens} from '@primeng/themes/types/datatable';

export const cmlPreset = definePreset({}, {
  components: {
    //datatable-row-selected-background
    datatable: {
      columnResizerWidth: '8px',
      resizeIndicator: {
        width: '1px',
        color: 'var(--color-outline)'
      },
      bodyCell: {
        borderColor: 'var(--row-border-color)',
        selectedBorderColor: 'var(--row-border-color)',
      },
      css: () => `
        p-scroller {
          height: 100%;
        }
        th.resize-enabled .p-datatable-column-resizer:hover {
          background: color-mix(in srgb, var(--color-primary), transparent 80%);
          background-clip: content-box;
        }
        .p-icon {
          color: var(--color-primary);
        }
      `
    } as DataTableDesignTokens,
    // custom button tokens and additional style
    slider: {
      root: {
        transitionDuration: '0.2s'
      },
      handle: {
        width: '40px',
        height: '12px',
        background: 'var(--color-primary-container)',
        borderRadius: '12px',
        hoverBackground: 'var(--color-primary)',
        content: {
          width: '0',
          height: '0',
        }
      },
      track: {
        size: '4px',
        background: 'var(--color-surface-container-highest)'
      },
      range: {
        background: 'var(--color-surface-container-highest)'
      },
      css: ({dt}) => `
      .p-slider-vertical {
        height: 100%;
      }
      .p-slider-vertical .p-slider-handle {
        width: ${dt('slider.handle.height')};
        height: ${dt('slider.handle.width')};
        margin-inline-start: calc(-1 * calc(${dt('slider.handle.height')} / 2));
        margin-bottom: calc(-1 * calc(${dt('slider.handle.width')} / 2));
      }
      `,
    } as SliderDesignTokens
  }
});
