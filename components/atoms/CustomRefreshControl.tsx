import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';

interface CustomRefreshControlProps extends RefreshControlProps {
  tintColor?: string;
  title?: string;
}

const CustomRefreshControl: React.FC<CustomRefreshControlProps> = ({
  refreshing,
  onRefresh,
  tintColor = '#007AFF',
  title = 'Refreshing...',
  ...props
}) => (
  <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    tintColor={tintColor}
    title={title}
    titleColor={tintColor}
    colors={[tintColor]}
    progressBackgroundColor="#ffffff"
    {...props}
  />
);

export default CustomRefreshControl;
