import Aura from '@primeuix/themes/aura';
import { $dt, definePreset } from "@primeuix/themes";

export default definePreset(Aura, {
  components: {
    card: {
      colorScheme: {
        light: {
          root: {
            background: 'rgb(from {surface.0} r g b / 0.25)',
          }
        },
        dark: {
          root: {
            background: 'rgb(from {surface.0} r g b / 0.05)',
          }
        },
      }
    },
    button: {
      colorScheme: {
        light: {
          root: {
            secondary: {
              color: '{surface.800}',
              hoverColor: '{button.secondary.color}',
              activeColor: '{button.secondary.color}',
              background: 'rgb(from {surface.0} r g b / 0.75)',
              borderColor: 'rgb(from {surface.950} r g b / 0.10)',
              hoverBackground: 'rgb(from {surface.100} r g b / 0.75)',
              hoverBorderColor: 'rgb(from {surface.950} r g b / 0.15)',
            }
          }
        },
        dark: {
          root: {
            secondary: {
              color: '{surface.100}',
              hoverColor: '{button.secondary.color}',
              activeColor: '{button.secondary.color}',
              background: 'rgb(from {surface.0} r g b / 0.05)',
              borderColor: 'rgb(from {surface.0} r g b / 0.10)',
              hoverBorderColor: 'rgb(from {surface.0} r g b / 0.15)',
              hoverBackground: 'rgb(from {surface.0} r g b / 0.15)',
              activeBorderColor: 'rgb(from {surface.0} r g b / 0.25)',
              activeBackground: 'rgb(from {surface.0} r g b / 0.25)',
            }
          }
        }
      },
      extend: {
        transparent: {
          color: '{surface.800}',
          hoverColor: '{button.transparent.color}',
          activeColor: '{button.transparent.color}',
          background: 'rgb(from {surface.0} r g b / 0.55)',
          borderColor: 'rgb(from {surface.0} r g b / 0.15)',
          hoverBorderColor: 'rgb(from {surface.0} r g b / 0.25)',
          hoverBackground: 'rgb(from {surface.0} r g b / 0.65)',
          activeBorderColor: 'rgb(from {surface.0} r g b / 0.25)',
          activeBackground: 'rgb(from {surface.0} r g b / 0.75)',
          shadow: '0 0.125rem 0.25rem rgb(from {surface.950} r g b / 0.15)',
          hoverShadow: '0 0.125rem 0.375rem rgb(from {surface.950} r g b / 0.25)',
        }
      },
      css: ({dt}) => /*css*/`
        .p-button-transparent {
          background: ${dt('button.transparent.background')};
          color: ${dt('button.transparent.color')};
          border-color: ${dt('button.transparent.borderColor')};
          box-shadow: ${dt('button.transparent.shadow')};

          &:not(:disabled):hover {
            background: ${dt('button.transparent.hoverBackground')};
            color: ${dt('button.transparent.hoverColor')};
            border-color: ${dt('button.transparent.hoverBorderColor')};
            box-shadow: ${dt('button.transparent.hoverShadow')};
          }

          &:not(:disabled):active {
            background: ${dt('button.transparent.activeBackground')};
            color: ${dt('button.transparent.activeColor')};
            border-color: ${dt('button.transparent.activeBorderColor')};
          }
        }
      `
    }
  },
  extend: {
    colorScheme: {
      light: {
        textColor: '{surface.800}',
        overlayModal: {
          background: 'rgb(from {surface.0} r g b / 0.75)',
          borderColor: 'rgb(from {surface.950} r g b / 0.10)',
        },
        formField: {
          background: 'rgb(from {surface.0} r g b / 0.75)',
          borderColor: 'rgb(from {surface.950} r g b / 0.10)',
          hoverBorderColor: 'rgb(from {surface.950} r g b / 0.25)',
        }
      },
      dark: {
        textColor: '{surface.100}',
        overlayModal: {
          background: 'rgb(from {surface.0} r g b / 0.05)',
          borderColor: 'rgb(from {surface.0} r g b / 0.10)',
        },
        formField: {
          background: 'rgb(from {surface.0} r g b / 0.05)',
          borderColor: 'rgb(from {surface.0} r g b / 0.10)',
          hoverBorderColor: 'rgb(from {surface.0} r g b / 0.25)',
        }
      },
    }
  },
  semantic: {
    colorScheme: {
      light: {
        background: '{surface.50}',
        // formField: {
        //   background: 'red !important',
        // },
        surface: {
          0: 'hsl(220deg 10% 99%)',
          50: 'hsl(220deg 10% 95%)',
          100: 'hsl(220deg 10% 90%)',
          200: 'hsl(220deg 10% 80%)',
          300: 'hsl(220deg 10% 70%)',
          400: 'hsl(220deg 10% 60%)',
          500: 'hsl(220deg 10% 50%)',
          600: 'hsl(220deg 10% 40%)',
          700: 'hsl(220deg 10% 30%)',
          800: 'hsl(220deg 10% 20%)',
          900: 'hsl(220deg 10% 10%)',
          950: 'hsl(220deg 10%  5%)',
        }
      },
      dark: {
        background: '{surface.900}',
        // formField: {
        //   background: 'red !important',
        // },
        surface: {
          0: 'hsl(220deg 10% 100%)',
          50: 'hsl(220deg 10%  95%)',
          100: 'hsl(220deg 10%  90%)',
          200: 'hsl(220deg 10%  80%)',
          300: 'hsl(220deg 10%  70%)',
          400: 'hsl(220deg 10%  60%)',
          500: 'hsl(220deg 10%  50%)',
          600: 'hsl(220deg 10%  40%)',
          700: 'hsl(220deg 10%  30%)',
          800: 'hsl(220deg 10%  20%)',
          900: 'hsl(220deg 10%  10%)',
          950: 'hsl(220deg 10%   5%)',
        }
      }
    }
  },
  css: `
    .p-dialog {
      backdrop-filter: var(--backdrop-blur);
    }
  `,
});
