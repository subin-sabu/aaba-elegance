import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../services/authService";
import useApiFeedback from "../hooks/useApiFeedback";

function LoginWithGoogle({ setUser }) {
  const { localError, handleError, handleSuccess } = useApiFeedback();
  
  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential; // Google ID token
      const data = await loginWithGoogle(idToken);
      setUser(data?.user);
      handleSuccess(`Welcome ${ data?.user?.name ?? ""}!`, true);// global toast
    } catch (err) {
      handleError(err, true); // escalate to global provider
    }
  };

  const handleLoginError = () => {
    handleError({message: "Google Login Failed"}, true); 
  };

  return (
    <div style={{ width: "100%" }}>
      <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
      {localError && <p style={{color: "red"}}>{localError}</p>}
    </div>
  );
}

export default LoginWithGoogle;
