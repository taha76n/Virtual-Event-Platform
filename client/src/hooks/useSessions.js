import { useEffect, useState } from "react"
import api from "../api/apiInterceptor";


export const useSession = (eventId) => {

  const [session, setSession] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await api.get(`api/catalog/events/${eventId}/sessions`);
        setSession(response.data.data);
      } catch (error) {
        setError(error.response.data.message || "Failed to fetch session");   
      }finally{
        setLoading(false);
      }
    };

    fetchSessions();
    
  }, [eventId])


  const createSession = async () => {
    try {
        const response = await api.post(`api/catalog/events/${eventId}/sessions`);
        // If successful, we push the newly created session into our existing state array!
       // This causes React to instantly re-render the list without needing to refresh the page.
        setSession(prevSession => [...prevSession, response.data.data]);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create session' 
      }
      
    }
  }

  return {session, loading, error, createSession}
  
}