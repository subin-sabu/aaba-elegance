// src/providers/FeedbackProvider.jsx

import { useState, createContext, useContext, useCallback } from "react";
import { toast } from "react-hot-toast";

const FeedbackContext = createContext(null);

// export #1
export function FeedbackProvider({children}) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // normalising messages
  const getMessage = (input, fallback = "Something went wrong!!") => {
    if (!input) return fallback;
    if (typeof input === "string") return input;
    if (input instanceof Error) return input.message;
    if (typeof input === "object") {
      return (
        input.message || 
        input.data?.message || 
        input.response?.data?.message || 
        fallback
      )
    }
    return fallback;
  }

  const notifyError = useCallback((err, showToast = true) => {
    const msg = getMessage(err, "Global: Something went wrong"); 
    setError(msg);
    if (showToast) toast.error(msg);
    logError(err);
  }, []);

  const notifySuccess = useCallback((res, showToast = true) => {
    const msg = getMessage(res, "Success!!")
    setSuccess(msg);
    if (showToast) toast.success(msg);
  }, []);

  return (
    <FeedbackContext.Provider value={{error, success, notifyError, notifySuccess}}>
      {children}
    </FeedbackContext.Provider>
  )
}

// export #2
export function useFeedback() {
  return useContext(FeedbackContext);
}



// helper. It can be replaced with a custom logger or use to pipe local errors and global errors. 
function logError(err) {
  console.error("Error:", err);
}