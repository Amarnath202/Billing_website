import React, { createContext, useContext, useState, useEffect } from 'react';

const AppSettingsContext = createContext();

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

export const AppSettingsProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState({
    applicationName: 'Control N',
    footerText: 'Copyright© Control N- 2025',
    language: 'English',
    timezone: '(GMT/UTC 05:30)Kolkata',
    dateFormat: 'Y-m-d',
    timeFormat: '24 Hours',
    favicon: null,
    coloredLogo: null,
    // Email Settings
    smtpHost: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    smtpStatus: 'Enable'
  });

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    console.log('AppSettingsContext - Loading settings from localStorage...');
    const savedSettings = localStorage.getItem('appSettings');
    console.log('Raw localStorage data:', savedSettings);

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('Loading saved settings from localStorage:', parsedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    } else {
      console.log('No saved settings found in localStorage, using defaults');
    }
    setIsInitialized(true);
  }, []);

  // Save settings to localStorage whenever settings change (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      console.log('Saving settings to localStorage:', settings);
      localStorage.setItem('appSettings', JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const updateSettings = (newSettings) => {
    console.log('Updating settings:', newSettings);
    setSettings(prev => {
      const updatedSettings = {
        ...prev,
        ...newSettings
      };
      console.log('Updated settings:', updatedSettings);
      return updatedSettings;
    });
  };

  const resetSettings = () => {
    const defaultSettings = {
      applicationName: 'Control N',
      footerText: 'Copyright© Control N- 2025',
      language: 'English',
      timezone: '(GMT/UTC 05:30)Kolkata',
      dateFormat: 'Y-m-d',
      timeFormat: '24 Hours',
      favicon: null,
      coloredLogo: null,
      // Email Settings
      smtpHost: '',
      smtpPort: '',
      smtpUsername: '',
      smtpPassword: '',
      smtpEncryption: 'tls',
      smtpStatus: 'Enable'
    };
    setSettings(defaultSettings);
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    sidebarCollapsed,
    toggleSidebar
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export default AppSettingsContext;
