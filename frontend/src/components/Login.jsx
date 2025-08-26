import { GoogleLogin } from "@react-oauth/google";

function Login(props) {
  const handleLoginSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential; // Google ID token
    console.log("idToken:", idToken)
 
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/google-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      credentials: "include", // <-- this is the key change when using http-only-cookies
    });

    if (!res.ok) {
      console.error("Google Auth failed");
      return;
    }

    const data = await res.json();
    console.log("Backend response:", data);
    // No need to save JWT manually, cookie is already set
    props.setUser(data)
  };

  const handleLoginError = () => {
    console.log("Google Login Failed");
  };

  return (
    <div style={{width:"100%"}}>
      <h2>Login</h2>
      <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
    </div>
  );
}

export default Login;
