import { useEffect, useState } from "react";
import api from "../api/apiInterceptor";


export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchEvents = async () => {
      try {
        const response = await api.get("/api/catalog/events");

        setEvents(response.data.data);

      } catch (error) {
        const message = error.response?.data?.message || error.message || "Failed to fetch events";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []) // "Run this ONCE when the component first loads"
  return { events, loading, error };
}