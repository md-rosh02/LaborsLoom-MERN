import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("https://laborsloom-mern-1.onrender.com/api/jobs");
        setJobs(response.data);
        console.log(response.data);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <JobContext.Provider value={{ jobs, loading, error }}>
      {children}
    </JobContext.Provider>
  );
};
