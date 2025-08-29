import { GoogleOAuthProvider } from "@react-oauth/google";
import ErrorBoundary from "./ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { FeedbackProvider } from "./FeedbackProvider";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <FeedbackProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <GoogleOAuthProvider clientId={googleClientId} >
          {children}
        </GoogleOAuthProvider>
      </FeedbackProvider>
    </ErrorBoundary>
  )
}

export default AppProviders;