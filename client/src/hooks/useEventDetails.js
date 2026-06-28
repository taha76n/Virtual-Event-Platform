import { useEffect, useState } from "react"
import api from "../api/apiInterceptor";

export const useEventDetails = (eventId) => {
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      return
    }

    const fetchEvent = async () => {
      try {
        const response = await api.get(`/api/catalog/event/${eventId}`);
        setEventDetails(response.data.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [eventId])

  return { eventDetails, isLoading, error }
}