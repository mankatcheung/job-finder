import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/styles.css';

// Dark mode here is a `.dark` class toggle on an ancestor element, not
// `prefers-color-scheme` — matches apps/web's convention (see styles.css).
const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
