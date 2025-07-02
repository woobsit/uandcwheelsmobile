import React, { ComponentType } from 'react';
import { RefreshControl } from 'react-native';

const withRefreshControl = <P extends object>(
  WrappedComponent: ComponentType<P>,
  refreshAction: () => Promise<void> | void,
) => {
  return (props: P) => {
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = async () => {
      setRefreshing(true);
      try {
        await refreshAction();
      } finally {
        setRefreshing(false);
      }
    };

    return (
      <WrappedComponent
        {...props}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            title="Refreshing..."
          />
        }
      />
    );
  };
};

export default withRefreshControl;
