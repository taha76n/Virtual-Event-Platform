import { useState, useEffect } from 'react';
import api from '../api/apiInterceptor';

export const useCatalog = (keyword = '') => { 
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        
        // Pass the keyword as a query string parameter to the backend
        const url = keyword ? `/api/catalog/events?keyword=${keyword}` : '/api/catalog/events';
        const response = await api.get(url);
        
        setEvents(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load event catalog');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, [keyword]); 

  return { events, isLoading, error };
};