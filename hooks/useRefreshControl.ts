import { useState, useCallback } from 'react';

interface UseRefreshControlOptions {
  refreshAction: () => Promise<void> | void;
  onRefreshStart?: () => void;
  onRefreshEnd?: () => void;
}

const useRefreshControl = (options: UseRefreshControlOptions) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    options.onRefreshStart?.();
    
    try {
      await options.refreshAction();
    } finally {
      setRefreshing(false);
      options.onRefreshEnd?.();
    }
  }, [options]);
  
  return {
    refreshing,
    onRefresh,
  };
};

export default useRefreshControl;