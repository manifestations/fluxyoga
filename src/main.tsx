import React, { useState, createContext, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { ConfigurationProvider, useConfiguration } from './contexts/ConfigurationContext';
import './styles/global.css';

// Theme context
export const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => {},
});

// Theme configuration function
const createAppTheme = (isDarkMode: boolean) => createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
    primary: {
      main: isDarkMode ? '#f9f9f9' : '#1976d2',
      contrastText: isDarkMode ? '#000000' : '#ffffff',
    },
    secondary: {
      main: isDarkMode ? 'hsl(240, 5%, 65%)' : '#757575',
    },
    background: {
      default: isDarkMode ? '#0a0a0a' : '#f5f5f5',
      paper: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : '#ffffff',
    },
    text: {
      primary: isDarkMode ? '#f9f9f9' : '#212121',
      secondary: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#757575',
    },
    divider: isDarkMode ? 'hsla(240, 5%, 65%, 0.2)' : 'rgba(0, 0, 0, 0.12)',
    action: {
      hover: isDarkMode ? 'hsla(240, 3.7%, 15.9%, 0.8)' : 'rgba(0, 0, 0, 0.04)',
      selected: isDarkMode ? 'hsla(240, 3.7%, 15.9%, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    },
  },
  typography: {
    fontFamily: 'sans-serif',
    h1: {
      color: isDarkMode ? '#f9f9f9' : '#212121',
      fontWeight: 700,
    },
    h2: {
      color: isDarkMode ? '#f9f9f9' : '#212121',
      fontWeight: 700,
    },
    h3: {
      color: isDarkMode ? '#f9f9f9' : '#212121',
      fontWeight: 700,
    },
    h4: {
      color: isDarkMode ? '#f9f9f9' : '#212121',
      fontWeight: 700,
    },
    h5: {
      color: isDarkMode ? '#f9f9f9' : '#212121',
      fontWeight: 700,
    },
    h6: {
      color: isDarkMode ? '#f9f9f9' : '#212121',
      fontWeight: 700,
    },
    body1: {
      color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#424242',
    },
    body2: {
      color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#757575',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : '#ffffff',
          border: isDarkMode ? '1px solid hsla(240, 5%, 65%, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '20px',
          boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          padding: '30px 50px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#757575',
          '&.Mui-selected': {
            color: isDarkMode ? '#f9f9f9' : '#1976d2',
          },
          '&:hover': {
            color: isDarkMode ? '#f9f9f9' : '#1976d2',
            backgroundColor: isDarkMode ? 'hsla(240, 3.7%, 15.9%, 0.8)' : 'rgba(25, 118, 210, 0.04)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: isDarkMode ? '#f9f9f9' : '#1976d2',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'transparent',
            color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#424242',
            borderRadius: '5px',
            '& fieldset': {
              borderColor: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: isDarkMode ? 'hsl(240, 5%, 64.9%)' : 'rgba(0, 0, 0, 0.87)',
            },
            '&.Mui-focused fieldset': {
              borderColor: isDarkMode ? '#f9f9f9' : '#1976d2',
            },
          },
          '& .MuiInputLabel-root': {
            color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#757575',
            '&.Mui-focused': {
              color: isDarkMode ? '#f9f9f9' : '#1976d2',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#424242',
            '&::placeholder': {
              color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#757575',
              opacity: 0.8,
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '5px',
          textTransform: 'none',
          transition: '250ms ease',
        },
        contained: {
          backgroundColor: isDarkMode ? '#f9f9f9' : '#1976d2',
          color: isDarkMode ? '#000000' : '#ffffff',
          '&:hover': {
            backgroundColor: isDarkMode ? 'hsla(0, 0%, 95%, 0.9)' : '#1565c0',
          },
          '&:active': {
            backgroundColor: isDarkMode ? 'hsla(0, 0%, 80%, 0.9)' : '#0d47a1',
          },
        },
        outlined: {
          borderColor: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : 'rgba(0, 0, 0, 0.23)',
          color: isDarkMode ? '#f9f9f9' : '#1976d2',
          '&:hover': {
            backgroundColor: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : 'rgba(25, 118, 210, 0.04)',
            borderColor: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#1976d2',
          },
          '&:active': {
            backgroundColor: isDarkMode ? 'hsl(240, 3%, 12%)' : 'rgba(25, 118, 210, 0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : '#ffffff',
          border: isDarkMode ? '1px solid hsla(240, 5%, 65%, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '20px',
          backgroundImage: 'none',
          boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#424242',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : 'rgba(0, 0, 0, 0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isDarkMode ? 'hsl(240, 5%, 64.9%)' : 'rgba(0, 0, 0, 0.87)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: isDarkMode ? '#f9f9f9' : '#1976d2',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: isDarkMode ? 'hsl(240, 5%, 64.9%)' : '#424242',
          '&:hover': {
            backgroundColor: isDarkMode ? 'hsl(240, 3.7%, 15.9%)' : 'rgba(0, 0, 0, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: isDarkMode ? 'hsla(240, 3.7%, 15.9%, 0.8)' : 'rgba(25, 118, 210, 0.08)',
            color: isDarkMode ? '#f9f9f9' : '#1976d2',
          },
        },
      },
    },
  },
});

// Theme wrapper that integrates with configuration
const ThemedApp: React.FC = () => {
  const { config, updateSection } = useConfiguration();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from configuration or default
    if (config.ui.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return config.ui.theme === 'dark';
  });

  // Sync theme changes with configuration
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    await updateSection('ui', { theme: newTheme });
  };

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (config.ui.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [config.ui.theme]);

  // Update theme when configuration changes
  useEffect(() => {
    if (config.ui.theme === 'auto') {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setIsDarkMode(config.ui.theme === 'dark');
    }
  }, [config.ui.theme]);

  const theme = createAppTheme(isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

function AppWrapper() {
  return (
    <ConfigurationProvider>
      <ThemedApp />
    </ConfigurationProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
