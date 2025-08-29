
import { useState } from "react";
import { useFeedback } from "../providers/FeedbackProvider";

function useApiFeedback() {
  const [localError, setLocalError] = useState(null);
  const [localSuccess, setLocalSuccess] = useState(null);
  const { notifyError, notifySuccess } = useFeedback();

  const handleError = (error, global = false) => {
    const msg = error?.message || "Something went wrong!";
    setLocalError(msg);
    if (global) notifyError(msg);// escalate to global provider
    setLocalSuccess(null);
  }

  const handleSuccess = (success, global = true) => {
    const msg = typeof success === "string" ? success : success?.message || "Success";
    setLocalSuccess(msg);
    if (global) notifySuccess(msg);
    setLocalError(null);
  }
  return {localError, localSuccess, handleError, handleSuccess};
}

export default useApiFeedback;